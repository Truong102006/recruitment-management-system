import {
  JobDetailDto,
  JobSummaryDto,
  SkillDto,
  JobType,
  WorkplaceMode,
  JobStatus,
} from '../dto/job.dto';

export interface JobEntityLike {
  id: string;
  companyId: string;
  title?: string | null;
  description?: string | null;
  location?: string | null;
  headcount?: number | null;
  jobType?: string | null;
  workplaceMode?: string | null;
  salaryMin?: number | { toNumber?(): number } | string | null;
  salaryMax?: number | { toNumber?(): number } | string | null;
  currency?: string | null;
  deadline?: Date | string | null;
  status: string;
  version: number;
  createdAt?: Date | string | null;
  publishedAt?: Date | string | null;
  closedAt?: Date | string | null;
  closeReason?: string | null;
}

export class JobMapper {
  public static toSkillDto(skill: {
    id: string;
    name: string;
    category?: string | null;
    active: boolean;
  }): SkillDto {
    return {
      id: skill.id,
      name: skill.name,
      category: skill.category,
      active: skill.active,
    };
  }

  public static toJobSummaryDto(
    job: JobEntityLike,
    companyName: string,
    skills: SkillDto[],
    referenceTime: Date = new Date(),
  ): JobSummaryDto {
    const isPastDeadline = job.deadline
      ? new Date(job.deadline).getTime() <= referenceTime.getTime()
      : false;
    const isClosed = job.status === 'CLOSED' || isPastDeadline;
    const acceptingApplications = job.status === 'PUBLISHED' && !isPastDeadline;

    return {
      id: job.id,
      companyId: job.companyId,
      companyName,
      title: job.title || '',
      location: job.location ?? null,
      jobType: job.jobType as JobType | null,
      workplaceMode: job.workplaceMode as WorkplaceMode | null,
      salaryMin: job.salaryMin ? Number(job.salaryMin) : null,
      salaryMax: job.salaryMax ? Number(job.salaryMax) : null,
      currency: job.currency,
      deadline: job.deadline ? new Date(job.deadline).toISOString() : null,
      status: job.status as JobStatus,
      skillIds: skills.map((s) => s.id),
      skills,
      version: job.version,
      createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : undefined,
      publishedAt: job.publishedAt ? new Date(job.publishedAt).toISOString() : null,
      closedAt: job.closedAt ? new Date(job.closedAt).toISOString() : null,
      closeReason: job.closeReason,
      isClosed,
      acceptingApplications,
    };
  }

  public static toJobDetailDto(
    job: JobEntityLike & { createdAt: Date | string; updatedAt: Date | string; createdBy?: string },
    companyName: string,
    skills: SkillDto[],
    referenceTime: Date = new Date(),
  ): JobDetailDto {
    const summary = this.toJobSummaryDto(job, companyName, skills, referenceTime);
    return {
      ...summary,
      description: job.description ?? null,
      headcount:
        job.headcount !== undefined && job.headcount !== null ? Number(job.headcount) : null,
      createdBy: job.createdBy,
      version: job.version,
      createdAt: new Date(job.createdAt).toISOString(),
      updatedAt: new Date(job.updatedAt).toISOString(),
    };
  }
}
