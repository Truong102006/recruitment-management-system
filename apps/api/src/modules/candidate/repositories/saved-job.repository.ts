import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';
import { TransactionSql } from '../../../../../../libs/platform/database/sql-client';

export interface SavedJobRow {
  jobId: string;
  savedAt: Date;
  title: string | null;
}
export interface SavedJobRepository {
  save(candidateId: string, jobId: string, tx: TransactionContext): Promise<boolean>;
  remove(candidateId: string, jobId: string, tx: TransactionContext): Promise<boolean>;
  list(
    candidateId: string,
    page: number,
    pageSize: number,
    tx: TransactionContext,
  ): Promise<{ rows: SavedJobRow[]; total: number }>;
}

export class PrismaSavedJobRepository implements SavedJobRepository {
  constructor(private readonly sql: TransactionSql) {}
  async save(candidateId: string, jobId: string, tx: TransactionContext): Promise<boolean> {
    const rows = await this.sql.query<{ job_id: string }>(
      tx,
      `INSERT INTO saved_job (candidate_id, job_id) VALUES ($1::uuid, $2::uuid)
       ON CONFLICT (candidate_id, job_id) DO NOTHING RETURNING job_id`,
      [candidateId, jobId],
    );
    return rows.length === 1;
  }
  async remove(candidateId: string, jobId: string, tx: TransactionContext): Promise<boolean> {
    const rows = await this.sql.query<{ job_id: string }>(
      tx,
      `DELETE FROM saved_job WHERE candidate_id = $1::uuid AND job_id = $2::uuid RETURNING job_id`,
      [candidateId, jobId],
    );
    return rows.length === 1;
  }
  async list(candidateId: string, page: number, pageSize: number, tx: TransactionContext) {
    const [count] = await this.sql.query<{ total: bigint }>(
      tx,
      `SELECT count(*) AS total FROM saved_job WHERE candidate_id = $1::uuid`,
      [candidateId],
    );
    const rows = await this.sql.query<{ job_id: string; created_at: Date; title: string | null }>(
      tx,
      `SELECT s.job_id, s.created_at, j.title FROM saved_job s
       JOIN job_post j ON j.id = s.job_id WHERE s.candidate_id = $1::uuid
       ORDER BY s.created_at DESC, s.job_id DESC LIMIT $2 OFFSET $3`,
      [candidateId, pageSize, (page - 1) * pageSize],
    );
    return {
      rows: rows.map((row) => ({ jobId: row.job_id, savedAt: row.created_at, title: row.title })),
      total: Number(count?.total ?? 0),
    };
  }
}
