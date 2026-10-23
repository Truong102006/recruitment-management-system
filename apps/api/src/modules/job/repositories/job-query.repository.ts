import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { JobSearchQueryDto, JobSummaryDto, JobDetailDto, SkillDto } from '../dto/job.dto';
import { JobMapper } from '../mappers/job.mapper';

@Injectable()
export class JobQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  public async searchPublicJobs(
    query: JobSearchQueryDto,
    referenceTime: Date = new Date(),
  ): Promise<{
    data: JobSummaryDto[];
    meta: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  }> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // Normalizing skillIds
    let skillIds: string[] = [];
    if (Array.isArray(query.skillIds)) {
      skillIds = query.skillIds.map((s) => String(s).trim()).filter(Boolean);
    } else if (typeof query.skillIds === 'string' && query.skillIds.trim().length > 0) {
      skillIds = query.skillIds
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    const skillMatchMode = query.skillMatchMode === 'ALL' ? 'ALL' : 'ANY';

    // Base WHERE conditions:
    // 1. Job is PUBLISHED
    // 2. Deadline is in the future
    // 3. Company is APPROVED
    // 4. Company has at least 1 available active owner
    const where: Prisma.JobPostWhereInput = {
      status: 'PUBLISHED',
      deadline: {
        gt: referenceTime,
      },
      company: {
        approvalStatus: 'APPROVED',
        memberships: {
          some: {
            role: 'OWNER',
            active: true,
            user: {
              status: 'ACTIVE',
              emailVerifiedAt: { not: null },
            },
          },
        },
      },
    };

    // Keyword search (q)
    if (query.q && query.q.trim().length > 0) {
      const q = query.q.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { company: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }

    // Location filter
    if (query.location && query.location.trim().length > 0) {
      where.location = { contains: query.location.trim(), mode: 'insensitive' };
    }

    // JobType filter
    if (query.jobType) {
      where.jobType = query.jobType;
    }

    // WorkplaceMode filter
    if (query.workplaceMode) {
      where.workplaceMode = query.workplaceMode;
    }

    // Currency filter
    if (query.currency) {
      where.currency = query.currency.toUpperCase();
    }

    // Salary range filters
    if (query.salaryMin !== undefined && query.salaryMin !== null) {
      where.salaryMax = { gte: Number(query.salaryMin) };
    }

    if (query.salaryMax !== undefined && query.salaryMax !== null) {
      where.salaryMin = { lte: Number(query.salaryMax) };
    }

    // Skill filter
    if (skillIds.length > 0) {
      if (skillMatchMode === 'ALL') {
        // Must contain all skills
        where.AND = skillIds.map((skillId) => ({
          skills: {
            some: { skillId },
          },
        }));
      } else {
        // Must contain at least one skill
        where.skills = {
          some: {
            skillId: { in: skillIds },
          },
        };
      }
    }

    // Order by
    let orderBy: Prisma.JobPostOrderByWithRelationInput[] = [{ createdAt: 'desc' }, { id: 'desc' }];
    if (query.sortBy === 'deadline') {
      orderBy = [{ deadline: query.sortOrder === 'desc' ? 'desc' : 'asc' }, { id: 'desc' }];
    } else if (query.sortBy === 'salaryMax') {
      orderBy = [{ salaryMax: query.sortOrder === 'asc' ? 'asc' : 'desc' }, { id: 'desc' }];
    }

    const [total, jobs] = await Promise.all([
      this.prisma.jobPost.count({ where }),
      this.prisma.jobPost.findMany({
        where,
        include: {
          company: true,
          skills: {
            include: { skill: true },
          },
        },
        orderBy,
        skip,
        take: pageSize,
      }),
    ]);

    const items = jobs.map((job) => {
      const skills: SkillDto[] = job.skills.map((js) => JobMapper.toSkillDto(js.skill));
      return JobMapper.toJobSummaryDto(job, job.company.name, skills, referenceTime);
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

  public async findPublicJobDetail(
    id: string,
    referenceTime: Date = new Date(),
  ): Promise<JobDetailDto | null> {
    const job = await this.prisma.jobPost.findUnique({
      where: { id },
      include: {
        company: {
          include: {
            memberships: {
              where: {
                role: 'OWNER',
                active: true,
                user: { status: 'ACTIVE', emailVerifiedAt: { not: null } },
              },
            },
          },
        },
        skills: {
          include: { skill: true },
        },
      },
    });

    if (!job) {
      return null;
    }

    // Check company status: MUST be APPROVED
    if (job.company.approvalStatus !== 'APPROVED') {
      return null;
    }

    // Check available active owner
    if (job.company.memberships.length === 0) {
      return null;
    }

    // Draft jobs are never public
    if (job.status === 'DRAFT') {
      return null;
    }

    // Closed jobs that were never published are never public
    if (job.status === 'CLOSED' && !job.publishedAt) {
      return null;
    }

    const skills: SkillDto[] = job.skills.map((js) => JobMapper.toSkillDto(js.skill));
    return JobMapper.toJobDetailDto(job, job.company.name, skills, referenceTime);
  }
}
