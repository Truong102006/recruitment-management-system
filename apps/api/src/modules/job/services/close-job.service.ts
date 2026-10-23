import { ForbiddenError } from '../../../../../../libs/platform/errors/domain.error';
import { ServiceUnavailableError } from '../../../../../../libs/platform/errors/domain.error';
import { Injectable, Optional, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../company/repositories/prisma-company-membership.repository';
import { CloseJobDto, JobDetailDto, SkillDto } from '../dto/job.dto';
import { JobPolicy } from '../policies/job.policy';
import { JobMapper } from '../mappers/job.mapper';
import { Actor, OutboxPort, PORTS, Tx } from '../../../../../../libs/contracts/backend';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';
import { randomUUID } from 'crypto';

@Injectable()
export class CloseJobService {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    @Optional() @Inject(PORTS.outbox) private readonly outboxPort?: OutboxPort,
  ) {}

  public async closeJob(actor: Actor, jobId: string, dto: CloseJobDto): Promise<JobDetailDto> {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new ValidationError('Close reason is required.', {
        reason: ['Close reason cannot be empty'],
      });
    }

    if (!this.outboxPort) {
      throw new ServiceUnavailableError('Job outbox unavailable');
    }
    return this.uow.run(async (tx: Tx) => {
      if (!(await this.membershipRepo.lockRecoveryAccount(actor.userId, tx))) {
        throw new ForbiddenError('Account must be active and verified', 'ACCOUNT_NOT_ACTIVE');
      }
      // 1. Initial job lookup to get companyId
      const initialJob = await this.jobRepo.findById(jobId, tx);
      if (!initialJob) {
        throw new NotFoundError(`Job post '${jobId}' not found.`);
      }

      // 2. Canonical locks: company -> job
      const company = await this.companyRepo.findByIdWithLock(initialJob.companyId, tx);
      if (!company) {
        throw new NotFoundError(`Company '${initialJob.companyId}' not found.`);
      }

      const job = await this.jobRepo.findByIdWithLock(jobId, tx);
      if (!job) {
        throw new NotFoundError(`Job post '${jobId}' not found.`);
      }

      // 3. Verify actor membership
      const membership = await this.membershipRepo.findUniqueWithLock(
        job.companyId,
        actor.userId,
        tx,
      );
      JobPolicy.assertCanManageCompanyJobs(actor, membership, company);

      // 4. Version check
      if (job.version !== dto.version) {
        throw new ConflictError(
          `Job version conflict. Expected version ${dto.version}, but current version is ${job.version}.`,
        );
      }

      if (job.status === 'CLOSED') {
        throw new ConflictError(
          'Job is already closed. Closed jobs cannot be closed again or reopened.',
        );
      }

      const now = new Date();

      // 5. Update to CLOSED
      const updated = await this.jobRepo.closeJob(jobId, dto.version, dto.reason.trim(), now, tx);

      if (!updated) {
        throw new NotFoundError(`Job post '${jobId}' not found.`);
      }

      // 6. Emit outbox event
      if (this.outboxPort) {
        await this.outboxPort.append(
          {
            eventId: randomUUID(),
            eventType: 'job.closed',
            schemaVersion: 1,
            aggregateId: jobId,
            aggregateVersion: updated.version,
            occurredAt: now.toISOString(),
            payload: {
              jobId,
              companyId: job.companyId,
              reason: dto.reason.trim(),
            },
          },
          tx,
        );
      }

      const skills: SkillDto[] = (updated.skills || []).map(
        (js: { skill: { id: string; name: string; category?: string | null; active: boolean } }) =>
          JobMapper.toSkillDto(js.skill),
      );
      return JobMapper.toJobDetailDto(updated, company.name, skills, now);
    });
  }
}
