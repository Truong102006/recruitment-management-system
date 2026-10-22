import { TransactionSql } from '../../../../../../libs/platform/database/sql-client';
import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';
import type {
  ApplicationWriteRepository,
  NewApplicationHistory,
  SubmittedApplication,
} from './application.repository';
import { ApplicationRuleError } from '../rules/application-rule.error';

function isCandidateJobDuplicate(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const value = error as {
    code?: unknown;
    constraint?: unknown;
    meta?: { code?: unknown; message?: unknown };
  };
  return (
    (value.code === '23505' && value.constraint === 'uq_application_candidate_job') ||
    (value.code === 'P2010' &&
      value.meta?.code === '23505' &&
      typeof value.meta.message === 'string' &&
      value.meta.message.includes('uq_application_candidate_job'))
  );
}

/** Uses Prisma's transaction client via parameterized SQL; no global PrismaClient calls. */
export class PrismaApplicationRepository implements ApplicationWriteRepository {
  constructor(private readonly sql: TransactionSql) {}

  async createSubmitted(record: SubmittedApplication, tx: TransactionContext): Promise<void> {
    try {
      await this.sql.query(
        tx,
        `INSERT INTO application
        (id, job_id, candidate_id, original_cv_version_id, current_cv_version_id,
         candidate_snapshot, status, cover_letter, submitted_at, updated_at, version)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $4::uuid,
               $5::jsonb, 'SUBMITTED', $6, clock_timestamp(), clock_timestamp(), 0)`,
        [
          record.id,
          record.jobId,
          record.candidateId,
          record.cvId,
          JSON.stringify(record.snapshot),
          record.coverLetter,
        ],
      );
    } catch (error) {
      if (isCandidateJobDuplicate(error))
        throw new ApplicationRuleError('STATE_CONFLICT', 'Application already exists for this job');
      throw error;
    }
  }

  async appendHistory(record: NewApplicationHistory, tx: TransactionContext): Promise<void> {
    await this.sql.query(
      tx,
      `INSERT INTO application_history
        (id, application_id, candidate_id, actor_id, actor_type, event_type,
         from_status, to_status, old_cv_id, new_cv_id, reason, public_message,
         created_at, aggregate_version)
       VALUES ($1::uuid, $2::uuid, $3::uuid, $4::uuid, $5, $6, $7, $8,
               $9::uuid, $10::uuid, $11, $12, clock_timestamp(), $13)`,
      [
        record.id,
        record.applicationId,
        record.candidateId,
        record.actorId,
        record.actorType,
        record.eventType,
        record.fromStatus,
        record.toStatus,
        record.oldCvId,
        record.newCvId,
        record.reason,
        record.publicMessage,
        record.aggregateVersion,
      ],
    );
  }
}
