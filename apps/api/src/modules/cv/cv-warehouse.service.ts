import { createHash, randomUUID } from 'node:crypto';
import type {
  Actor,
  IdentityCandidatePort,
  OutboxPort,
} from '../../../../../libs/contracts/backend';
import type { UnitOfWork } from '../../../../../libs/platform/database/unit-of-work';
import { ApplicationRuleError } from '../application/rules/application-rule.error';
import type { CvRepository } from './cv.repository';

export const MAX_CV_BYTES = 10_485_760;
export interface QuarantineStore {
  putNew(objectKey: string, bytes: Uint8Array): Promise<{ versionId: string }>;
  readVersion(objectKey: string, versionId: string): Promise<Uint8Array>;
  deleteVersion(objectKey: string, versionId: string): Promise<void>;
  signedDownload(objectKey: string, versionId: string, seconds: number): Promise<string>;
}
/** Must validate full PDF structure/password state and malware scan, with bounded resources. */
export interface CvSafetyInspector {
  inspect(bytes: Uint8Array): Promise<'CLEAN' | 'MALFORMED' | 'ENCRYPTED' | 'MALWARE'>;
}
export class CvInputError extends Error {
  constructor(
    readonly code: 'FILE_TOO_LARGE' | 'UNSUPPORTED_MEDIA_TYPE',
    message: string,
  ) {
    super(message);
  }
}

function safeName(name: string): string {
  const cleaned = [...name]
    .filter(
      (char) =>
        char !== '/' && char !== '\\' && char.charCodeAt(0) > 31 && char.charCodeAt(0) !== 127,
    )
    .join('')
    .trim()
    .normalize('NFC');
  if (!cleaned || cleaned.length > 255 || !/\.pdf$/i.test(cleaned))
    throw new CvInputError('UNSUPPORTED_MEDIA_TYPE', 'A PDF filename is required');
  return cleaned;
}
async function readBounded(chunks: AsyncIterable<Uint8Array>): Promise<Uint8Array> {
  const parts: Uint8Array[] = [];
  let size = 0;
  for await (const chunk of chunks) {
    size += chunk.byteLength;
    if (size > MAX_CV_BYTES) throw new CvInputError('FILE_TOO_LARGE', 'CV exceeds 10 MiB');
    parts.push(chunk);
  }
  if (size === 0) throw new CvInputError('UNSUPPORTED_MEDIA_TYPE', 'Empty CV');
  return Buffer.concat(parts);
}
function pdfSignature(bytes: Uint8Array): boolean {
  return bytes.byteLength >= 5 && Buffer.from(bytes.subarray(0, 5)).toString('ascii') === '%PDF-';
}

/** Storage IO happens outside DB transactions; orphan objects are reconciled by attempt ID. */
export class CvWarehouseService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly identity: IdentityCandidatePort,
    private readonly repository: CvRepository,
    private readonly store: QuarantineStore,
    private readonly inspector: CvSafetyInspector,
    private readonly outbox: OutboxPort,
  ) {}

  async initiate(actor: Actor, originalName: string) {
    const name = safeName(originalName);
    const cvId = randomUUID();
    const attemptId = randomUUID();
    return this.unitOfWork.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      const key = `cv/${candidate.userId}/${cvId}/${attemptId}`;
      const cv = await this.repository.reserve(candidate.userId, cvId, attemptId, name, key, tx);
      return { cvId, attemptId, versionNo: cv.versionNo, status: 'PENDING_UPLOAD' as const };
    });
  }

  async upload(
    actor: Actor,
    cvId: string,
    attemptId: string,
    mimeType: string,
    chunks: AsyncIterable<Uint8Array>,
  ) {
    if (mimeType.toLowerCase() !== 'application/pdf')
      throw new CvInputError('UNSUPPORTED_MEDIA_TYPE', 'PDF MIME type required');
    const bytes = await readBounded(chunks);
    if (!pdfSignature(bytes))
      throw new CvInputError('UNSUPPORTED_MEDIA_TYPE', 'PDF signature required');
    const checksum = createHash('sha256').update(bytes).digest('hex');
    const cv = await this.unitOfWork.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      const row = await this.repository.getOwned(candidate.userId, cvId, tx);
      if (
        row.status !== 'PENDING_UPLOAD' ||
        row.uploadAttemptId !== attemptId ||
        row.uploadExpiresAt <= new Date()
      )
        throw new ApplicationRuleError('STATE_CONFLICT', 'Upload attempt is no longer active');
      return row;
    });
    const object = await this.store.putNew(cv.objectKey, bytes);
    // A lost finalize leaves a quarantined orphan; reconciliation deletes it by object key/version.
    await this.unitOfWork.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      if (
        candidate.userId !== cv.candidateId ||
        !(await this.repository.quarantine(
          cvId,
          attemptId,
          object.versionId,
          bytes.byteLength,
          checksum,
          tx,
        ))
      )
        throw new ApplicationRuleError('STATE_CONFLICT', 'Upload attempt already finalized');
      await this.outbox.append(
        {
          eventId: randomUUID(),
          eventType: 'cv.scan_requested',
          schemaVersion: 1,
          aggregateId: cvId,
          aggregateVersion: cv.version + 1,
          occurredAt: new Date().toISOString(),
          payload: { cvId },
        },
        tx,
      );
    });
    return { cvId, status: 'QUARANTINED' as const };
  }

  /** Called by a post-commit worker; a missing or failing scanner never marks READY. */
  async scan(cvId: string): Promise<'READY' | 'REJECTED' | 'TECHNICAL_FAILURE' | 'SKIPPED'> {
    const token = randomUUID();
    const cv = await this.unitOfWork.run((tx) => this.repository.claimScan(cvId, token, tx));
    if (!cv || !cv.storageVersionId || !cv.checksumSha256) return 'SKIPPED';
    let outcome: 'READY' | 'REJECTED' | 'TECHNICAL_FAILURE' = 'TECHNICAL_FAILURE';
    let reason: string | null = 'TECHNICAL_FAILURE';
    try {
      const bytes = await this.store.readVersion(cv.objectKey, cv.storageVersionId);
      const actual = createHash('sha256').update(bytes).digest('hex');
      if (actual !== cv.checksumSha256) {
        outcome = 'REJECTED';
        reason = 'CHECKSUM_MISMATCH';
      } else {
        const result = await this.inspector.inspect(bytes);
        outcome = result === 'CLEAN' ? 'READY' : 'REJECTED';
        reason = result === 'CLEAN' ? null : result;
      }
    } catch {
      // Technical failure is retried from quarantine; never label it malware.
    }
    const finished = await this.unitOfWork.run((tx) =>
      this.repository.finishScan(cvId, token, outcome, reason, tx),
    );
    return finished ? outcome : 'SKIPPED';
  }

  async download(actor: Actor, cvId: string): Promise<string> {
    const cv = await this.unitOfWork.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      await this.repository.requireReady(candidate.userId, cvId, tx);
      return this.repository.getOwned(candidate.userId, cvId, tx);
    });
    return this.store.signedDownload(cv.objectKey, cv.storageVersionId!, 300);
  }

  async requestDelete(actor: Actor, cvId: string): Promise<void> {
    await this.unitOfWork.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      const cv = await this.repository.requestDelete(candidate.userId, cvId, tx);
      await this.outbox.append(
        {
          eventId: randomUUID(),
          eventType: 'cv.delete_requested',
          schemaVersion: 1,
          aggregateId: cvId,
          aggregateVersion: cv.version + 1,
          occurredAt: new Date().toISOString(),
          payload: { cvId },
        },
        tx,
      );
    });
  }

  async deleteObject(cvId: string): Promise<boolean> {
    const cv = await this.unitOfWork.run((tx) => this.repository.getForWorker(cvId, tx));
    if (!cv || cv.status !== 'DELETE_PENDING') return false;
    if (cv.storageVersionId) await this.store.deleteVersion(cv.objectKey, cv.storageVersionId);
    return this.unitOfWork.run((tx) => this.repository.finishDelete(cvId, cv.storageVersionId, tx));
  }
}
