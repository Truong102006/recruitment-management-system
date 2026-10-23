import { randomUUID } from 'node:crypto';
import type {
  Actor,
  IdentityCandidatePort,
  JobVisibilityPort,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import type { SavedJobDto, PageResponse } from '../../../../../../libs/contracts/public';
import type { UnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import { ApplicationRuleError } from '../../application/rules/application-rule.error';
import type { SavedJobRepository } from '../repositories/saved-job.repository';

function validatePage(page: number, pageSize: number) {
  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Invalid pagination');
}

export class SavedJobService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly identity: IdentityCandidatePort,
    private readonly jobs: JobVisibilityPort,
    private readonly repository: SavedJobRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async save(actor: Actor, jobId: string): Promise<{ created: boolean }> {
    return this.uow.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      const visibility = await this.jobs.getPublicOrPlaceholder(jobId, actor, tx);
      if (!visibility.available)
        throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Job not found');
      const created = await this.repository.save(candidate.userId, jobId, tx);
      if (created)
        await this.outbox.append(
          {
            eventId: randomUUID(),
            eventType: 'saved_job.created',
            schemaVersion: 1,
            aggregateId: candidate.userId,
            aggregateVersion: 0,
            occurredAt: new Date().toISOString(),
            payload: { candidateId: candidate.userId, jobId },
          },
          tx,
        );
      return { created };
    });
  }
  async remove(actor: Actor, jobId: string): Promise<void> {
    await this.uow.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      const deleted = await this.repository.remove(candidate.userId, jobId, tx);
      if (deleted)
        await this.outbox.append(
          {
            eventId: randomUUID(),
            eventType: 'saved_job.deleted',
            schemaVersion: 1,
            aggregateId: candidate.userId,
            aggregateVersion: 0,
            occurredAt: new Date().toISOString(),
            payload: { candidateId: candidate.userId, jobId },
          },
          tx,
        );
    });
  }
  async list(actor: Actor, page: number, pageSize: number): Promise<PageResponse<SavedJobDto>> {
    validatePage(page, pageSize);
    return this.uow.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      const result = await this.repository.list(candidate.userId, page, pageSize, tx);
      const data: SavedJobDto[] = [];
      for (const row of result.rows) {
        const visibility = await this.jobs.getPublicOrPlaceholder(row.jobId, actor, tx);
        data.push({
          jobId: row.jobId,
          savedAt: row.savedAt.toISOString(),
          available: visibility.available,
          acceptingApplications: visibility.available ? visibility.acceptingApplications : false,
          title: visibility.available ? row.title : null,
        });
      }
      return { data, meta: { page, pageSize, total: result.total } };
    });
  }
}
