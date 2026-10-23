import type { ApplicationStatus } from '../../../../../../libs/contracts/public';
import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';
import { TransactionSql } from '../../../../../../libs/platform/database/sql-client';
import { ApplicationRuleError } from '../rules/application-rule.error';

export interface ApplicationRow {
  id: string;
  candidateId: string;
  jobId: string;
  companyId: string;
  status: ApplicationStatus;
  version: number;
  originalCvVersionId: string;
  currentCvVersionId: string;
}
export interface CvRequestRow {
  id: string;
  applicationId: string;
  candidateId: string;
  newCvId: string;
  baseCvVersionId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  version: number;
}

export interface ApplicationWorkflowRepository {
  scope(applicationId: string, tx: TransactionContext): Promise<ApplicationRow | null>;
  lockUsers(userIds: readonly string[], tx: TransactionContext): Promise<void>;
  lockCompany(companyId: string, tx: TransactionContext): Promise<{ approvalStatus: string }>;
  lockApplication(applicationId: string, tx: TransactionContext): Promise<ApplicationRow>;
  pendingCvRequest(applicationId: string, tx: TransactionContext): Promise<CvRequestRow | null>;
  cvRequest(requestId: string, tx: TransactionContext): Promise<CvRequestRow | null>;
  createCvRequest(
    row: {
      id: string;
      applicationId: string;
      candidateId: string;
      newCvId: string;
      baseCvId: string;
      applicationVersion: number;
    },
    tx: TransactionContext,
  ): Promise<void>;
  decideCvRequest(
    requestId: string,
    version: number,
    decision: 'APPROVED' | 'REJECTED',
    reviewerId: string,
    reason: string | null,
    tx: TransactionContext,
  ): Promise<void>;
  replaceCv(
    applicationId: string,
    version: number,
    oldCvId: string,
    newCvId: string,
    tx: TransactionContext,
  ): Promise<void>;
  changeStatus(
    applicationId: string,
    version: number,
    from: ApplicationStatus,
    to: ApplicationStatus,
    tx: TransactionContext,
  ): Promise<void>;
  cancelPendingCv(applicationId: string, tx: TransactionContext): Promise<void>;
  hasOpenApplication(
    candidateId: string,
    companyId: string,
    tx: TransactionContext,
  ): Promise<boolean>;
}

type RawApplication = {
  id: string;
  candidate_id: string;
  job_id: string;
  company_id: string;
  status: ApplicationStatus;
  version: number;
  original_cv_version_id: string;
  current_cv_version_id: string;
};
type RawRequest = {
  id: string;
  application_id: string;
  candidate_id: string;
  new_cv_id: string;
  base_cv_version_id: string;
  status: CvRequestRow['status'];
  version: number;
};
const applicationColumns = `a.id, a.candidate_id, a.job_id, j.company_id, a.status,
  a.version, a.original_cv_version_id, a.current_cv_version_id`;
const requestColumns = `id, application_id, candidate_id, new_cv_id, base_cv_version_id, status, version`;
function app(row: RawApplication): ApplicationRow {
  return {
    id: row.id,
    candidateId: row.candidate_id,
    jobId: row.job_id,
    companyId: row.company_id,
    status: row.status,
    version: row.version,
    originalCvVersionId: row.original_cv_version_id,
    currentCvVersionId: row.current_cv_version_id,
  };
}
function request(row: RawRequest): CvRequestRow {
  return {
    id: row.id,
    applicationId: row.application_id,
    candidateId: row.candidate_id,
    newCvId: row.new_cv_id,
    baseCvVersionId: row.base_cv_version_id,
    status: row.status,
    version: row.version,
  };
}
function changed(rows: readonly unknown[]): void {
  if (rows.length !== 1)
    throw new ApplicationRuleError('VERSION_CONFLICT', 'Application changed concurrently');
}

/** Every query uses the caller's opaque transaction; scope is rechecked after locks. */
export class PrismaApplicationWorkflowRepository implements ApplicationWorkflowRepository {
  constructor(private readonly sql: TransactionSql) {}

  async scope(applicationId: string, tx: TransactionContext): Promise<ApplicationRow | null> {
    const [row] = await this.sql.query<RawApplication>(
      tx,
      `SELECT ${applicationColumns} FROM application a JOIN job_post j ON j.id = a.job_id
       WHERE a.id = $1::uuid`,
      [applicationId],
    );
    return row ? app(row) : null;
  }
  async lockUsers(userIds: readonly string[], tx: TransactionContext): Promise<void> {
    for (const id of [...new Set(userIds)].sort()) {
      const rows = await this.sql.query<{ id: string }>(
        tx,
        `SELECT id FROM user_account WHERE id = $1::uuid FOR UPDATE`,
        [id],
      );
      if (rows.length !== 1) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'User not found');
    }
  }
  async lockCompany(
    companyId: string,
    tx: TransactionContext,
  ): Promise<{ approvalStatus: string }> {
    const [row] = await this.sql.query<{ approval_status: string }>(
      tx,
      `SELECT approval_status FROM company WHERE id = $1::uuid FOR UPDATE`,
      [companyId],
    );
    if (!row) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Company not found');
    return { approvalStatus: row.approval_status };
  }
  async lockApplication(applicationId: string, tx: TransactionContext): Promise<ApplicationRow> {
    const [row] = await this.sql.query<RawApplication>(
      tx,
      `SELECT ${applicationColumns} FROM application a JOIN job_post j ON j.id = a.job_id
       WHERE a.id = $1::uuid FOR UPDATE OF a`,
      [applicationId],
    );
    if (!row) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
    return app(row);
  }
  async pendingCvRequest(
    applicationId: string,
    tx: TransactionContext,
  ): Promise<CvRequestRow | null> {
    const [row] = await this.sql.query<RawRequest>(
      tx,
      `SELECT ${requestColumns} FROM cv_change_request
       WHERE application_id = $1::uuid AND status = 'PENDING' FOR UPDATE`,
      [applicationId],
    );
    return row ? request(row) : null;
  }
  async cvRequest(requestId: string, tx: TransactionContext): Promise<CvRequestRow | null> {
    const [row] = await this.sql.query<RawRequest>(
      tx,
      `SELECT ${requestColumns} FROM cv_change_request WHERE id = $1::uuid`,
      [requestId],
    );
    return row ? request(row) : null;
  }
  async createCvRequest(
    row: Parameters<ApplicationWorkflowRepository['createCvRequest']>[0],
    tx: TransactionContext,
  ): Promise<void> {
    await this.sql.query(
      tx,
      `INSERT INTO cv_change_request (id, application_id, candidate_id, new_cv_id,
        base_cv_version_id, application_version_at_request, status)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5::uuid, $6, 'PENDING')`,
      [
        row.id,
        row.applicationId,
        row.candidateId,
        row.newCvId,
        row.baseCvId,
        row.applicationVersion,
      ],
    );
  }
  async decideCvRequest(
    requestId: string,
    version: number,
    decision: 'APPROVED' | 'REJECTED',
    reviewerId: string,
    reason: string | null,
    tx: TransactionContext,
  ): Promise<void> {
    const rows = await this.sql.query<{ id: string }>(
      tx,
      `UPDATE cv_change_request SET status = $3, reviewed_by = $4::uuid,
         reviewed_at = clock_timestamp(), reason = $5, version = version + 1
       WHERE id = $1::uuid AND version = $2 AND status = 'PENDING' RETURNING id`,
      [requestId, version, decision, reviewerId, reason],
    );
    changed(rows);
  }
  async replaceCv(
    applicationId: string,
    version: number,
    oldCvId: string,
    newCvId: string,
    tx: TransactionContext,
  ): Promise<void> {
    const rows = await this.sql.query<{ id: string }>(
      tx,
      `UPDATE application SET current_cv_version_id = $4::uuid, version = version + 1,
         updated_at = clock_timestamp()
       WHERE id = $1::uuid AND version = $2 AND current_cv_version_id = $3::uuid
         AND status IN ('SUBMITTED','SCREENING') RETURNING id`,
      [applicationId, version, oldCvId, newCvId],
    );
    changed(rows);
  }
  async changeStatus(
    applicationId: string,
    version: number,
    from: ApplicationStatus,
    to: ApplicationStatus,
    tx: TransactionContext,
  ): Promise<void> {
    const rows = await this.sql.query<{ id: string }>(
      tx,
      `UPDATE application SET status = $4, version = version + 1, updated_at = clock_timestamp()
       WHERE id = $1::uuid AND version = $2 AND status = $3 RETURNING id`,
      [applicationId, version, from, to],
    );
    changed(rows);
  }
  async cancelPendingCv(applicationId: string, tx: TransactionContext): Promise<void> {
    await this.sql.query(
      tx,
      `UPDATE cv_change_request SET status = 'CANCELLED', cancelled_at = clock_timestamp(),
         reason = 'Application left screening', version = version + 1
       WHERE application_id = $1::uuid AND status = 'PENDING'`,
      [applicationId],
    );
  }
  async hasOpenApplication(
    candidateId: string,
    companyId: string,
    tx: TransactionContext,
  ): Promise<boolean> {
    const [row] = await this.sql.query<{ exists: boolean }>(
      tx,
      `SELECT EXISTS (SELECT 1 FROM application a JOIN job_post j ON j.id = a.job_id
        WHERE a.candidate_id = $1::uuid AND j.company_id = $2::uuid
          AND a.status NOT IN ('HIRED','REJECTED','WITHDRAWN')) AS exists`,
      [candidateId, companyId],
    );
    return row?.exists ?? false;
  }
}
