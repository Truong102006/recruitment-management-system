import { Injectable } from '@nestjs/common';
import { PrismaJobRepository } from '../repositories/prisma-job.repository';
import { PrismaSkillRepository } from '../repositories/prisma-skill.repository';
import { JobQueryRepository } from '../repositories/job-query.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../company/repositories/prisma-company-membership.repository';
import { JobSearchQueryDto, JobSummaryDto, JobDetailDto, SkillDto } from '../dto/job.dto';
import { JobPolicy } from '../policies/job.policy';
import { JobMapper } from '../mappers/job.mapper';
import { Actor } from '../../../../../../libs/contracts/backend';
import { NotFoundError } from '../../../../../../libs/platform/errors/domain.error';

@Injectable()
export class JobReadService {
  constructor(
    private readonly jobRepo: PrismaJobRepository,
    private readonly skillRepo: PrismaSkillRepository,
    private readonly jobQueryRepo: JobQueryRepository,
    private readonly companyRepo: PrismaCompanyRepository,
    private readonly membershipRepo: PrismaCompanyMembershipRepository,
  ) {}

  public async getCompanyJobs(
    actor: Actor,
    companyId: string,
    pagination: { page?: number; pageSize?: number } = {},
  ): Promise<{
    data: JobSummaryDto[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new NotFoundError(`Company '${companyId}' not found.`);
    }

    const membership = await this.membershipRepo.findUnique(companyId, actor.userId);
    JobPolicy.assertCanReadCompanyJobs(actor, membership);

    const page = Math.max(1, Number(pagination.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(pagination.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    const [total, jobs] = await Promise.all([
      this.jobRepo.countByCompany(companyId),
      this.jobRepo.findByCompany(companyId, { skip, take: pageSize }),
    ]);

    const items = jobs.map((job) => {
      const skills: SkillDto[] = (job.skills || []).map(
        (js: { skill: { id: string; name: string; category?: string | null; active: boolean } }) =>
          JobMapper.toSkillDto(js.skill),
      );
      return JobMapper.toJobSummaryDto(job, company.name, skills);
    });

    return {
      data: items,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    };
  }

  public async getCompanyJobDetail(
    actor: Actor,
    companyId: string,
    jobId: string,
  ): Promise<JobDetailDto> {
    const company = await this.companyRepo.findById(companyId);
    if (!company) {
      throw new NotFoundError(`Company '${companyId}' not found.`);
    }

    const membership = await this.membershipRepo.findUnique(companyId, actor.userId);
    JobPolicy.assertCanReadCompanyJobs(actor, membership);

    const job = await this.jobRepo.findById(jobId);
    if (!job || job.companyId !== companyId) {
      throw new NotFoundError(`Job post '${jobId}' not found in company '${companyId}'.`);
    }

    const skills: SkillDto[] = (job.skills || []).map(
      (js: { skill: { id: string; name: string; category?: string | null; active: boolean } }) =>
        JobMapper.toSkillDto(js.skill),
    );
    return JobMapper.toJobDetailDto(job, company.name, skills);
  }

  public async searchPublicJobs(query: JobSearchQueryDto) {
    return this.jobQueryRepo.searchPublicJobs(query);
  }

  public async getPublicJobDetail(id: string): Promise<JobDetailDto> {
    const detail = await this.jobQueryRepo.findPublicJobDetail(id);
    if (!detail) {
      throw new NotFoundError(`Job post '${id}' not found or not publicly available.`);
    }
    return detail;
  }

  public async getActiveSkills(): Promise<SkillDto[]> {
    const skills = await this.skillRepo.listActiveSkills();
    return skills.map((s) => JobMapper.toSkillDto(s));
  }
}
