import { ForbiddenError } from '../../../../../../libs/platform/errors/domain.error';
import { ServiceUnavailableError } from '../../../../../../libs/platform/errors/domain.error';
import { Injectable, Optional, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../company/repositories/prisma-company-membership.repository';
import { PublishJobDto, JobDetailDto, SkillDto } from '../dto/job.dto';
import { PublicationRules } from '../rules/publication.rules';
import { JobPolicy } from '../policies/job.policy';
import { JobMapper } from '../mappers/job.mapper';
import { Actor, OutboxPort, PORTS, Tx } from '../../../../../../libs/contracts/backend';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { NotFoundError, ConflictError } from '../../../../../../libs/platform/errors/domain.error';
import { randomUUID } from 'crypto';

@Injectable()
export class PublishJobService {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    @Optional() @Inject(PORTS.outbox) private readonly outboxPort?: OutboxPort,
  ) {}

  public async publishJob(actor: Actor, jobId: string, dto: PublishJobDto): Promise<JobDetailDto> {
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

      // 3. Verify actor membership and company status
      const membership = await this.membershipRepo.findUniqueWithLock(
        job.companyId,
        actor.userId,
        tx,
      );
      JobPolicy.assertCanManageCompanyJobs(actor, membership, company);

      // Check available owner
      const availableOwners = await this.membershipRepo.countAvailableOwners(job.companyId, tx);
      if (availableOwners < 1) {
        throw new ConflictError(
          'Cannot publish job for a company without an available active owner.',
        );
      }

      // 4. Version check
      if (job.version !== dto.version) {
        throw new ConflictError(
          `Job version conflict. Expected version ${dto.version}, but current version is ${job.version}.`,
        );
      }

      if (job.status === 'CLOSED') {
        throw new ConflictError(
          'Cannot publish a closed job. Closed jobs cannot be modified or reopened.',
        );
      }

      // If dto provides a new deadline, use it
      const effectiveDeadline = dto.deadline ? new Date(dto.deadline) : job.deadline;

      // 5. Completeness validation
      const now = new Date();
      PublicationRules.validateCompletenessForPublish(
        {
          title: job.title,
          description: job.description,
          location: job.location,
          headcount: job.headcount,
          jobType: job.jobType,
          workplaceMode: job.workplaceMode,
          deadline: effectiveDeadline,
          salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
          salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
          currency: job.currency,
        },
        now,
      );

      // 6. Update to PUBLISHED
      const updated = await this.jobRepo.update(
        jobId,
        dto.version,
        {
          status: 'PUBLISHED',
          publishedAt: now,
          deadline: effectiveDeadline,
        },
        tx,
      );

      if (!updated) {
        throw new NotFoundError(`Job post '${jobId}' not found.`);
      }

      // 7. Emit outbox event
      if (this.outboxPort) {
        await this.outboxPort.append(
          {
            eventId: randomUUID(),
            eventType: 'job.published',
            schemaVersion: 1,
            aggregateId: jobId,
            aggregateVersion: updated.version,
            occurredAt: now.toISOString(),
            payload: {
              jobId,
              companyId: job.companyId,
              publishedAt: now.toISOString(),
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
