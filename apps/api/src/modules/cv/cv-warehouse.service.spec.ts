import type {
  Actor,
  IdentityCandidatePort,
  OutboxPort,
} from '../../../../../libs/contracts/backend';
import { ManagedUnitOfWork } from '../../../../../libs/platform/database/unit-of-work';
import type { CvRecord, CvRepository } from './cv.repository';
import {
  CvWarehouseService,
  type CvSafetyInspector,
  type QuarantineStore,
} from './cv-warehouse.service';

const actor: Actor = { userId: 'candidate', sessionId: 'session', roles: ['CANDIDATE'] };
const pdf = Buffer.from('%PDF-1.7\nbody\n%%EOF');
async function* file(bytes: Uint8Array = pdf) {
  yield bytes;
}

function setup() {
  let rows = new Map<string, CvRecord>();
  const events: string[] = [];
  const objects = new Map<string, Uint8Array>();
  const uow = new ManagedUnitOfWork({
    async transaction<T>(work: (client: Map<string, CvRecord>) => Promise<T>): Promise<T> {
      const copy = new Map([...rows].map(([id, row]) => [id, { ...row }]));
      const result = await work(copy);
      rows = copy;
      return result;
    },
  });
  const identity = {
    assertActiveCandidate: jest.fn(async () => ({
      userId: actor.userId,
      name: 'A',
      email: 'a@example.test',
    })),
  } as unknown as IdentityCandidatePort;
  const repository: CvRepository = {
    async reserve(candidateId, cvId, attemptId, _name, key, tx) {
      const state = uow.clientFor(tx);
      if ([...state.values()].filter((row) => row.status !== 'DELETED').length >= 20)
        throw new Error('quota');
      const row: CvRecord = {
        id: cvId,
        candidateId,
        versionNo: state.size + 1,
        objectKey: key,
        uploadAttemptId: attemptId,
        status: 'PENDING_UPLOAD',
        storageVersionId: null,
        checksumSha256: null,
        uploadExpiresAt: new Date(Date.now() + 60_000),
        leaseToken: null,
        version: 0,
      };
      state.set(cvId, row);
      return row;
    },
    async getOwned(candidateId, cvId, tx) {
      const row = uow.clientFor(tx).get(cvId);
      if (!row || row.candidateId !== candidateId) throw new Error('not found');
      return row;
    },
    async getForWorker(cvId, tx) {
      return uow.clientFor(tx).get(cvId) ?? null;
    },
    async quarantine(cvId, attemptId, versionId, _size, checksum, tx) {
      const row = uow.clientFor(tx).get(cvId)!;
      if (row.status !== 'PENDING_UPLOAD' || row.uploadAttemptId !== attemptId) return false;
      Object.assign(row, {
        status: 'QUARANTINED',
        storageVersionId: versionId,
        checksumSha256: checksum,
        version: row.version + 1,
      });
      return true;
    },
    async claimScan(cvId, token, tx) {
      const row = uow.clientFor(tx).get(cvId);
      if (!row || row.status !== 'QUARANTINED') return null;
      Object.assign(row, { status: 'SCANNING', leaseToken: token });
      return row;
    },
    async finishScan(cvId, token, outcome, _reason, tx) {
      const row = uow.clientFor(tx).get(cvId)!;
      if (row.leaseToken !== token) return false;
      Object.assign(row, {
        status: outcome === 'TECHNICAL_FAILURE' ? 'QUARANTINED' : outcome,
        leaseToken: null,
      });
      return true;
    },
    async requireReady(candidateId, cvId, tx) {
      const row = await repository.getOwned(candidateId, cvId, tx);
      if (row.status !== 'READY') throw new Error('not ready');
      return {
        cvId,
        candidateId,
        storageVersionId: row.storageVersionId!,
        checksumSha256: row.checksumSha256!,
      };
    },
    async requestDelete(candidateId, cvId, tx) {
      const row = await repository.getOwned(candidateId, cvId, tx);
      row.status = 'DELETE_PENDING';
      return row;
    },
    async finishDelete(cvId, _versionId, tx) {
      uow.clientFor(tx).get(cvId)!.status = 'DELETED';
      return true;
    },
  };
  const store: QuarantineStore = {
    async putNew(key, bytes) {
      objects.set(key, bytes);
      return { versionId: 'object-v1' };
    },
    async readVersion(key) {
      return objects.get(key)!;
    },
    async deleteVersion(key) {
      objects.delete(key);
    },
    async signedDownload(_key, _versionId, seconds) {
      return `https://example.test/cv?ttl=${seconds}`;
    },
  };
  let verdict: 'CLEAN' | 'MALWARE' = 'CLEAN';
  let scannerFails = false;
  const inspector: CvSafetyInspector = {
    async inspect() {
      if (scannerFails) throw new Error('scanner unavailable');
      return verdict;
    },
  };
  const outbox: OutboxPort = {
    async append(event) {
      events.push(event.eventType);
    },
  };
  const service = new CvWarehouseService(uow, identity, repository, store, inspector, outbox);
  return {
    service,
    repository,
    rows: () => rows,
    objects,
    events,
    verdict: (value: 'CLEAN' | 'MALWARE') => {
      verdict = value;
    },
    scannerFails: () => {
      scannerFails = true;
    },
  };
}

describe('CV warehouse', () => {
  it('reserves an immutable attempt, quarantines upload, scans and permits owner download', async () => {
    const h = setup();
    const init = await h.service.initiate(actor, 'resume.pdf');
    await expect(h.service.download(actor, init.cvId)).rejects.toThrow();
    await h.service.upload(actor, init.cvId, init.attemptId, 'application/pdf', file());
    expect(h.events).toEqual(['cv.scan_requested']);
    await expect(
      h.service.upload(actor, init.cvId, init.attemptId, 'application/pdf', file()),
    ).rejects.toThrow();
    expect(await h.service.scan(init.cvId)).toBe('READY');
    expect(await h.service.download(actor, init.cvId)).toContain('ttl=300');
  });

  it('keeps technical scanner failure quarantined and rejects malware', async () => {
    const a = setup();
    const first = await a.service.initiate(actor, 'resume.pdf');
    await a.service.upload(actor, first.cvId, first.attemptId, 'application/pdf', file());
    a.scannerFails();
    expect(await a.service.scan(first.cvId)).toBe('TECHNICAL_FAILURE');
    expect(a.rows().get(first.cvId)?.status).toBe('QUARANTINED');
    const b = setup();
    const second = await b.service.initiate(actor, 'resume.pdf');
    await b.service.upload(actor, second.cvId, second.attemptId, 'application/pdf', file());
    b.verdict('MALWARE');
    expect(await b.service.scan(second.cvId)).toBe('REJECTED');
  });

  it('rejects oversized and non-PDF bytes before storing an object', async () => {
    const h = setup();
    const init = await h.service.initiate(actor, 'resume.pdf');
    await expect(
      h.service.upload(
        actor,
        init.cvId,
        init.attemptId,
        'application/pdf',
        file(Buffer.alloc(10_485_761)),
      ),
    ).rejects.toMatchObject({ code: 'FILE_TOO_LARGE' });
    await expect(
      h.service.upload(
        actor,
        init.cvId,
        init.attemptId,
        'application/pdf',
        file(Buffer.from('not pdf')),
      ),
    ).rejects.toMatchObject({ code: 'UNSUPPORTED_MEDIA_TYPE' });
    expect(h.objects.size).toBe(0);
  });

  it('deletes an unreferenced object using only the CV ID from the event', async () => {
    const h = setup();
    const init = await h.service.initiate(actor, 'resume.pdf');
    await h.service.upload(actor, init.cvId, init.attemptId, 'application/pdf', file());
    await h.service.scan(init.cvId);
    await h.service.requestDelete(actor, init.cvId);
    expect(h.events).toEqual(['cv.scan_requested', 'cv.delete_requested']);
    expect(await h.service.deleteObject(init.cvId)).toBe(true);
    expect(h.rows().get(init.cvId)?.status).toBe('DELETED');
    expect(h.objects.size).toBe(0);
    expect(await h.service.deleteObject(init.cvId)).toBe(false);
  });
});
