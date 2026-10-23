import { ForbiddenError } from '../../../../../../libs/platform/errors/domain.error';
import { Injectable, Inject } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaSkillRepository } from '../repositories/prisma-skill.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../company/repositories/prisma-company-membership.repository';
import { CreateJobDto, JobDetailDto, SkillDto } from '../dto/job.dto';
import { PublicationRules } from '../rules/publication.rules';
import { SalaryRules } from '../rules/salary.rules';
import { JobPolicy } from '../policies/job.policy';
import { JobMapper } from '../mappers/job.mapper';
import { Actor, Tx } from '../../../../../../libs/contracts/backend';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { NotFoundError } from '../../../../../../libs/platform/errors/domain.error';

@Injectable()
export class CreateJobService {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly skillRepo: PrismaSkillRepository,
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
    @Inject(UNIT_OF_WORK) private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  public async createDraft(actor: Actor, dto: CreateJobDto): Promise<JobDetailDto> {
    // Validate draft inputs if provided
    if (dto.title !== undefined && dto.title !== null) {
      PublicationRules.validateTitle(dto.title, false);
    }
    if (dto.description !== undefined && dto.description !== null) {
      PublicationRules.validateDescription(dto.description, false);
    }
    if (dto.location !== undefined && dto.location !== null) {
      PublicationRules.validateLocation(dto.location, false);
    }
    if (dto.headcount !== undefined && dto.headcount !== null) {
      PublicationRules.validateHeadcount(dto.headcount, false);
    }
    if (dto.jobType !== undefined && dto.jobType !== null) {
      PublicationRules.validateJobType(dto.jobType, false);
    }
    if (dto.workplaceMode !== undefined && dto.workplaceMode !== null) {
      PublicationRules.validateWorkplaceMode(dto.workplaceMode, false);
    }
    if (dto.deadline !== undefined && dto.deadline !== null) {
      PublicationRules.validateDeadline(dto.deadline, new Date(), false);
    }
    SalaryRules.validateSalary(dto.salaryMin, dto.salaryMax, dto.currency);

    const { created, company } = await this.uow.run(async (tx: Tx) => {
      if (!(await this.membershipRepo.lockRecoveryAccount(actor.userId, tx))) {
        throw new ForbiddenError('Account must be active and verified', 'ACCOUNT_NOT_ACTIVE');
      }
      const company = await this.companyRepo.findByIdWithLock(dto.companyId, tx);
      if (!company) {
        throw new NotFoundError('Company not found');
      }
      const membership = await this.membershipRepo.findUniqueWithLock(
        dto.companyId,
        actor.userId,
        tx,
      );
      JobPolicy.assertCanManageCompanyJobs(actor, membership, company);
      const validSkillIds = dto.skillIds?.length
        ? await this.skillRepo.assertAllActive(dto.skillIds, tx)
        : [];
      const job = await this.jobRepo.create(
        {
          companyId: dto.companyId,
          createdBy: actor.userId,
          title: dto.title,
          description: dto.description,
          location: dto.location,
          headcount: dto.headcount,
          jobType: dto.jobType,
          workplaceMode: dto.workplaceMode,
          salaryMin: dto.salaryMin,
          salaryMax: dto.salaryMax,
          currency: dto.currency,
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          status: 'DRAFT',
        },
        tx,
      );

      if (validSkillIds.length > 0) {
        return { created: await this.jobRepo.setSkills(job.id, validSkillIds, tx), company };
      }
      return { created: job, company };
    });

    if (!created) {
      throw new NotFoundError('Job post could not be created.');
    }

    const skills: SkillDto[] = (created.skills || []).map(
      (js: { skill: { id: string; name: string; category?: string | null; active: boolean } }) =>
        JobMapper.toSkillDto(js.skill),
    );
    return JobMapper.toJobDetailDto(created, company.name, skills);
  }
}
