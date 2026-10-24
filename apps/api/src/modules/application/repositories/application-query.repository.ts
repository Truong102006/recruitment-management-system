import type {
  CandidateApplicationDto,
  CandidateHistoryDto,
  PageResponse,
} from '../../../../../../libs/contracts/public';
import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';
import { TransactionSql } from '../../../../../../libs/platform/database/sql-client';
import {
  toCandidateApplication,
  toCandidateHistory,
} from '../mappers/candidate-application.mapper';

export interface ApplicationQueryRepository {
  one(applicationId: string, tx: TransactionContext): Promise<CandidateApplicationDto | null>;
  forCandidate(
    candidateId: string,
    page: number,
    pageSize: number,
    tx: TransactionContext,
  ): Promise<PageResponse<CandidateApplicationDto>>;
  forCompany(
    companyId: string,
    page: number,
    pageSize: number,
    tx: TransactionContext,
  ): Promise<PageResponse<CandidateApplicationDto>>;
  history(applicationId: string, tx: TransactionContext): Promise<CandidateHistoryDto[]>;
}
type Row = {
  id: string;
  job_id: string;
  status: CandidateApplicationDto['status'];
  version: number;
  original_cv_version_id: string;
  current_cv_version_id: string;
  candidate_snapshot: CandidateApplicationDto['candidateSnapshot'];
  cover_letter: string | null;
  submitted_at: Date;
  updated_at: Date;
  result_message: string | null;
  result_published_at: Date | null;
};
type HistoryRow = {
  id: string;
  event_type: CandidateHistoryDto['eventType'];
  from_status: CandidateHistoryDto['fromStatus'];
  to_status: CandidateHistoryDto['toStatus'];
  old_cv_id: string | null;
  new_cv_id: string | null;
  public_message: string | null;
  created_at: Date;
  aggregate_version: number;
};
const fields = `a.id, a.job_id, a.status, a.version, a.original_cv_version_id,
  a.current_cv_version_id, a.candidate_snapshot, a.cover_letter, a.submitted_at,
  a.updated_at, a.result_message, a.result_published_at`;
function map(row: Row): CandidateApplicationDto {
  return toCandidateApplication({
    applicationId: row.id,
    jobId: row.job_id,
    status: row.status,
    version: row.version,
    originalCvVersionId: row.original_cv_version_id,
    currentCvVersionId: row.current_cv_version_id,
    candidateSnapshot: row.candidate_snapshot,
    coverLetter: row.cover_letter,
    submittedAt: row.submitted_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    resultMessage: row.result_message,
    resultPublishedAt: row.result_published_at?.toISOString() ?? null,
  });
}

export class PrismaApplicationQueryRepository implements ApplicationQueryRepository {
  constructor(private readonly sql: TransactionSql) {}
  async one(
    applicationId: string,
    tx: TransactionContext,
  ): Promise<CandidateApplicationDto | null> {
    const [row] = await this.sql.query<Row>(
      tx,
      `SELECT ${fields} FROM application a WHERE a.id = $1::uuid`,
      [applicationId],
    );
    return row ? map(row) : null;
  }
  async forCandidate(
    candidateId: string,
    page: number,
    pageSize: number,
    tx: TransactionContext,
  ): Promise<PageResponse<CandidateApplicationDto>> {
    const [count] = await this.sql.query<{ total: bigint }>(
      tx,
      `SELECT count(*) AS total FROM application WHERE candidate_id = $1::uuid`,
      [candidateId],
    );
    const rows = await this.sql.query<Row>(
      tx,
      `SELECT ${fields} FROM application a WHERE a.candidate_id = $1::uuid
       ORDER BY a.submitted_at DESC, a.id DESC LIMIT $2 OFFSET $3`,
      [candidateId, pageSize, (page - 1) * pageSize],
    );
    return { data: rows.map(map), meta: { page, pageSize, total: Number(count?.total ?? 0) } };
  }
  async forCompany(
    companyId: string,
    page: number,
    pageSize: number,
    tx: TransactionContext,
  ): Promise<PageResponse<CandidateApplicationDto>> {
    const [count] = await this.sql.query<{ total: bigint }>(
      tx,
      `SELECT count(*) AS total FROM application a JOIN job_post j ON j.id = a.job_id
       WHERE j.company_id = $1::uuid`,
      [companyId],
    );
    const rows = await this.sql.query<Row>(
      tx,
      `SELECT ${fields} FROM application a JOIN job_post j ON j.id = a.job_id
       WHERE j.company_id = $1::uuid ORDER BY a.submitted_at DESC, a.id DESC
       LIMIT $2 OFFSET $3`,
      [companyId, pageSize, (page - 1) * pageSize],
    );
    return { data: rows.map(map), meta: { page, pageSize, total: Number(count?.total ?? 0) } };
  }
  async history(applicationId: string, tx: TransactionContext): Promise<CandidateHistoryDto[]> {
    const rows = await this.sql.query<HistoryRow>(
      tx,
      `SELECT id, event_type, from_status, to_status, old_cv_id, new_cv_id,
        public_message, created_at, aggregate_version FROM application_history
       WHERE application_id = $1::uuid ORDER BY created_at, id`,
      [applicationId],
    );
    return rows.map((row) =>
      toCandidateHistory({
        id: row.id,
        eventType: row.event_type,
        fromStatus: row.from_status,
        toStatus: row.to_status,
        oldCvId: row.old_cv_id,
        newCvId: row.new_cv_id,
        publicMessage: row.public_message,
        createdAt: row.created_at.toISOString(),
        aggregateVersion: row.aggregate_version,
      }),
    );
  }
}
