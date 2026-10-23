import type { CvSelectionPort } from '../../../../../libs/contracts/backend';
import { TransactionSql } from '../../../../../libs/platform/database/sql-client';
import type { TransactionContext } from '../../../../../libs/platform/database/unit-of-work';
import { ApplicationRuleError } from '../application/rules/application-rule.error';

export interface CvRecord {
  id: string;
  candidateId: string;
  versionNo: number;
  objectKey: string;
  uploadAttemptId: string;
  status: string;
  storageVersionId: string | null;
  checksumSha256: string | null;
  uploadExpiresAt: Date;
  leaseToken: string | null;
  version: number;
}

export interface CvRepository extends CvSelectionPort {
  reserve(
    candidateId: string,
    cvId: string,
    attemptId: string,
    name: string,
    objectKey: string,
    tx: TransactionContext,
  ): Promise<CvRecord>;
  getOwned(candidateId: string, cvId: string, tx: TransactionContext): Promise<CvRecord>;
  getForWorker(cvId: string, tx: TransactionContext): Promise<CvRecord | null>;
  quarantine(
    cvId: string,
    attemptId: string,
    storageVersionId: string,
    size: number,
    checksum: string,
    tx: TransactionContext,
  ): Promise<boolean>;
  claimScan(cvId: string, leaseToken: string, tx: TransactionContext): Promise<CvRecord | null>;
  finishScan(
    cvId: string,
    leaseToken: string,
    outcome: 'READY' | 'REJECTED' | 'TECHNICAL_FAILURE',
    reason: string | null,
    tx: TransactionContext,
  ): Promise<boolean>;
  requestDelete(candidateId: string, cvId: string, tx: TransactionContext): Promise<CvRecord>;
  finishDelete(
    cvId: string,
    storageVersionId: string | null,
    tx: TransactionContext,
  ): Promise<boolean>;
}

type DbRow = {
  id: string;
  candidate_id: string;
  version_no: number;
  object_key: string;
  upload_attempt_id: string;
  status: string;
  storage_version_id: string | null;
  checksum_sha256: string | null;
  upload_expires_at: Date;
  lease_token: string | null;
  version: number;
};
const columns = `id, candidate_id, version_no, object_key, upload_attempt_id, status,
  storage_version_id, checksum_sha256, upload_expires_at, lease_token, version`;
function map(row: DbRow): CvRecord {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    versionNo: row.version_no,
    objectKey: row.object_key,
    uploadAttemptId: row.upload_attempt_id,
    status: row.status,
    storageVersionId: row.storage_version_id,
    checksumSha256: row.checksum_sha256,
    uploadExpiresAt: row.upload_expires_at,
    leaseToken: row.lease_token,
    version: row.version,
  };
}

/** The caller locks the candidate user first; all CV operations then follow that lock. */
export class PrismaCvRepository implements CvRepository {
  constructor(private readonly sql: TransactionSql) {}

  async reserve(
    candidateId: string,
    cvId: string,
    attemptId: string,
    name: string,
    objectKey: string,
    tx: TransactionContext,
  ): Promise<CvRecord> {
    const [slot] = await this.sql.query<{ active: bigint; next_no: number }>(
      tx,
      `SELECT count(*) FILTER (WHERE status <> 'DELETED') AS active,
              (coalesce(max(version_no), 0) + 1)::int AS next_no
         FROM cv_version WHERE candidate_id = $1::uuid`,
      [candidateId],
    );
    if (!slot) throw new Error('CV quota query returned no row');
    if (Number(slot.active) >= 20)
      throw new ApplicationRuleError('STATE_CONFLICT', 'CV quota reached');
    const [row] = await this.sql.query<DbRow>(
      tx,
      `INSERT INTO cv_version (id, candidate_id, version_no, original_name, object_key,
        status, upload_attempt_id, upload_expires_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, 'PENDING_UPLOAD', $6::uuid,
               clock_timestamp() + interval '24 hours') RETURNING ${columns}`,
      [cvId, candidateId, slot.next_no, name, objectKey, attemptId],
    );
    if (!row) throw new Error('CV reservation returned no row');
    return map(row);
  }

  async getOwned(candidateId: string, cvId: string, tx: TransactionContext): Promise<CvRecord> {
    const [row] = await this.sql.query<DbRow>(
      tx,
      `SELECT ${columns} FROM cv_version WHERE id = $1::uuid AND candidate_id = $2::uuid FOR UPDATE`,
      [cvId, candidateId],
    );
    if (!row) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'CV not found');
    return map(row);
  }

  async getForWorker(cvId: string, tx: TransactionContext): Promise<CvRecord | null> {
    const [row] = await this.sql.query<DbRow>(
      tx,
      `SELECT ${columns} FROM cv_version WHERE id = $1::uuid FOR UPDATE`,
      [cvId],
    );
    return row ? map(row) : null;
  }

  async quarantine(
    cvId: string,
    attemptId: string,
    storageVersionId: string,
    size: number,
    checksum: string,
    tx: TransactionContext,
  ): Promise<boolean> {
    const rows = await this.sql.query<{ id: string }>(
      tx,
      `UPDATE cv_version SET status = 'QUARANTINED', storage_version_id = $3,
        size_bytes = $4, mime_type = 'application/pdf', checksum_sha256 = $5, version = version + 1
       WHERE id = $1::uuid AND upload_attempt_id = $2::uuid AND status = 'PENDING_UPLOAD'
         AND upload_expires_at > clock_timestamp() RETURNING id`,
      [cvId, attemptId, storageVersionId, size, checksum],
    );
    return rows.length === 1;
  }

  async claimScan(
    cvId: string,
    leaseToken: string,
    tx: TransactionContext,
  ): Promise<CvRecord | null> {
    const [row] = await this.sql.query<DbRow>(
      tx,
      `UPDATE cv_version SET status = 'SCANNING', lease_token = $2::uuid,
         scan_locked_until = clock_timestamp() + interval '5 minutes',
         scan_attempt_count = scan_attempt_count + 1, version = version + 1
       WHERE id = $1::uuid AND storage_version_id IS NOT NULL
         AND (status = 'QUARANTINED' OR
           (status = 'SCANNING' AND scan_locked_until < clock_timestamp()))
         AND (scan_next_retry_at IS NULL OR scan_next_retry_at <= clock_timestamp())
       RETURNING ${columns}`,
      [cvId, leaseToken],
    );
    return row ? map(row) : null;
  }

  async finishScan(
    cvId: string,
    leaseToken: string,
    outcome: 'READY' | 'REJECTED' | 'TECHNICAL_FAILURE',
    reason: string | null,
    tx: TransactionContext,
  ): Promise<boolean> {
    const rows = await this.sql.query<{ id: string }>(
      tx,
      `UPDATE cv_version SET status = CASE WHEN $3 = 'TECHNICAL_FAILURE' THEN 'QUARANTINED' ELSE $3 END,
         scan_reason = $4, lease_token = NULL, scan_locked_until = NULL,
         scan_next_retry_at = CASE WHEN $3 = 'TECHNICAL_FAILURE'
           THEN clock_timestamp() + interval '5 minutes' ELSE NULL END,
         ready_at = CASE WHEN $3 = 'READY' THEN clock_timestamp() ELSE NULL END,
         version = version + 1
       WHERE id = $1::uuid AND lease_token = $2::uuid AND status = 'SCANNING'
         AND scan_locked_until > clock_timestamp() RETURNING id`,
      [cvId, leaseToken, outcome, reason],
    );
    return rows.length === 1;
  }

  async requireReady(candidateId: string, cvId: string, tx: TransactionContext) {
    const cv = await this.getOwned(candidateId, cvId, tx);
    if (cv.status !== 'READY' || !cv.storageVersionId || !cv.checksumSha256)
      throw new ApplicationRuleError('STATE_CONFLICT', 'CV is not ready');
    return {
      cvId: cv.id,
      candidateId,
      storageVersionId: cv.storageVersionId,
      checksumSha256: cv.checksumSha256,
    };
  }

  async requestDelete(
    candidateId: string,
    cvId: string,
    tx: TransactionContext,
  ): Promise<CvRecord> {
    const cv = await this.getOwned(candidateId, cvId, tx);
    if (!['READY', 'REJECTED', 'QUARANTINED'].includes(cv.status))
      throw new ApplicationRuleError('STATE_CONFLICT', 'CV cannot be deleted in this state');
    const [refs] = await this.sql.query<{ used: boolean }>(
      tx,
      `SELECT EXISTS (SELECT 1 FROM application WHERE candidate_id = $1::uuid
        AND (original_cv_version_id = $2::uuid OR current_cv_version_id = $2::uuid))
       OR EXISTS (SELECT 1 FROM application_history WHERE candidate_id = $1::uuid
        AND (old_cv_id = $2::uuid OR new_cv_id = $2::uuid))
       OR EXISTS (SELECT 1 FROM cv_change_request WHERE candidate_id = $1::uuid
        AND (new_cv_id = $2::uuid OR base_cv_version_id = $2::uuid)) AS used`,
      [candidateId, cvId],
    );
    if (!refs) throw new Error('CV reference query returned no row');
    if (refs.used) throw new ApplicationRuleError('STATE_CONFLICT', 'CV is referenced');
    await this.sql.query(
      tx,
      `UPDATE cv_version SET status = 'DELETE_PENDING', delete_requested_at = clock_timestamp(),
        version = version + 1 WHERE id = $1::uuid`,
      [cvId],
    );
    return cv;
  }

  async finishDelete(
    cvId: string,
    storageVersionId: string | null,
    tx: TransactionContext,
  ): Promise<boolean> {
    const rows = await this.sql.query<{ id: string }>(
      tx,
      `UPDATE cv_version SET status = 'DELETED', deleted_at = clock_timestamp(), version = version + 1
       WHERE id = $1::uuid AND status = 'DELETE_PENDING'
         AND storage_version_id IS NOT DISTINCT FROM $2 RETURNING id`,
      [cvId, storageVersionId],
    );
    return rows.length === 1;
  }
}
