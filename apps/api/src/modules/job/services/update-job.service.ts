import { normalizeText } from '../../../common/validation/text';
import { ForbiddenError } from '../../../../../../libs/platform/errors/domain.error';
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaSkillRepository } from '../repositories/prisma-skill.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../company/repositories/prisma-company-membership.repository';
import { UpdateJobDto, JobDetailDto, SkillDto } from '../dto/job.dto';
import { JobUpdateRules } from '../rules/job-update.rules';
import { JobPolicy } from '../policies/job.policy';
import { JobMapper } from '../mappers/job.mapper';
import { Actor, Tx } from '../../../../../../libs/contracts/backend';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { NotFoundError, ConflictError } from '../../../../../../libs/platform/errors/domain.error';

@Injectable()
export class UpdateJobService {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly skillRepo: PrismaSkillRepository,
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  public async updateJob(actor: Actor, jobId: string, dto: UpdateJobDto): Promise<JobDetailDto> {
    dto = {
      ...dto,
      title: typeof dto.title === 'string' ? normalizeText(dto.title) : dto.title,
      description:
        typeof dto.description === 'string' ? normalizeText(dto.description) : dto.description,
      location: typeof dto.location === 'string' ? normalizeText(dto.location) : dto.location,
    };
    if (dto.salary) {
      if (dto.salaryMin === undefined && dto.salary.min !== undefined) {
        dto.salaryMin = dto.salary.min;
      }
      if (dto.salaryMax === undefined && dto.salary.max !== undefined) {
        dto.salaryMax = dto.salary.max;
      }
      if (dto.currency === undefined && dto.salary.currency !== undefined) {
        dto.currency = dto.salary.currency;
      }
    }
    return this.uow.run(async (tx: Tx) => {
      if (!(await this.membershipRepo.lockRecoveryAccount(actor.userId, tx))) {
        throw new ForbiddenError('Account must be active and verified', 'ACCOUNT_NOT_ACTIVE');
      }
      const discovered = await this.jobRepo.findById(jobId, tx);
      if (!discovered) {
        throw new NotFoundError('Job not found');
      }
      const company = await this.companyRepo.findByIdWithLock(discovered.companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found');
      }
      const job = await this.jobRepo.findByIdWithLock(jobId, tx);
      if (!job) {
        throw new NotFoundError(`Job post '${jobId}' not found.`);
      }

      if (job.version !== dto.version) {
        throw new ConflictError(
          `Job version conflict. Expected version ${dto.version}, but current version is ${job.version}.`,
        );
      }

      const membership = await this.membershipRepo.findUniqueWithLock(
        job.companyId,
        actor.userId,
        tx,
      );
      JobPolicy.assertCanManageCompanyJobs(actor, membership, company);
      if ((await this.membershipRepo.countAvailableOwners(company.id, tx)) < 1) {
        throw new ConflictError(
          'Cannot manage jobs for a company without an available active owner.',
        );
      }

      JobUpdateRules.validateUpdate(
        {
          status: job.status,
          version: job.version,
          title: job.title,
          headcount: job.headcount,
          jobType: job.jobType,
          workplaceMode: job.workplaceMode,
          salaryMin: job.salaryMin !== null ? Number(job.salaryMin) : null,
          salaryMax: job.salaryMax !== null ? Number(job.salaryMax) : null,
          currency: job.currency,
        },
        dto,
        new Date(),
      );

      // Validate skills if provided
      let validSkillIds: string[] | undefined;
      if (dto.skillIds !== undefined) {
        validSkillIds = await this.skillRepo.assertAllActive(dto.skillIds, tx);
      }

      const effectiveMin =
        dto.salaryMin !== undefined
          ? dto.salaryMin
          : job.salaryMin !== null
            ? Number(job.salaryMin)
            : null;
      const effectiveMax =
        dto.salaryMax !== undefined
          ? dto.salaryMax
          : job.salaryMax !== null
            ? Number(job.salaryMax)
            : null;
      const effectiveCur = dto.currency !== undefined ? dto.currency : job.currency;

      const updated = await this.jobRepo.update(
        jobId,
        dto.version,
        {
          title: dto.title,
          description: dto.description,
          location: dto.location,
          headcount: dto.headcount,
          jobType: dto.jobType,
          workplaceMode: dto.workplaceMode,
          salaryMin: effectiveMin,
          salaryMax: effectiveMax,
          currency: effectiveCur,
          deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        },
        tx,
      );

      let finalJob = updated;
      if (validSkillIds !== undefined) {
        finalJob = await this.jobRepo.setSkills(jobId, validSkillIds, tx);
      }

      if (!finalJob) {
        throw new NotFoundError(`Job post '${jobId}' not found.`);
      }

      const skills: SkillDto[] = (finalJob.skills || []).map(
        (js: { skill: { id: string; name: string; category?: string | null; active: boolean } }) =>
          JobMapper.toSkillDto(js.skill),
      );
      return JobMapper.toJobDetailDto(finalJob, company.name, skills);
    });
  }
}
