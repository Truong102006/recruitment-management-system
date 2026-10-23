import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';
import { SalaryRules } from './salary.rules';
import { JobType, WorkplaceMode } from '../dto/job.dto';

export const ALLOWED_JOB_TYPES: readonly JobType[] = [
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERNSHIP',
] as const;

export const ALLOWED_WORKPLACE_MODES: readonly WorkplaceMode[] = [
  'ON_SITE',
  'HYBRID',
  'REMOTE',
] as const;

export interface JobCompletenessFields {
  title?: string | null;
  description?: string | null;
  location?: string | null;
  headcount?: number | null;
  jobType?: string | null;
  workplaceMode?: string | null;
  deadline?: Date | string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  currency?: string | null;
}

export class PublicationRules {
  public static validateTitle(title?: string | null, required = true): void {
    if (!title || title.trim().length === 0) {
      if (required) {
        throw new ValidationError('Job title is required.', {
          title: ['Job title cannot be empty'],
        });
      }
      return;
    }

    const trimmed = title.trim();
    if (trimmed.length < 10 || trimmed.length > 150) {
      throw new ValidationError('Job title must be between 10 and 150 characters.', {
        title: ['Length must be between 10 and 150 characters'],
      });
    }
  }

  public static validateDescription(description?: string | null, required = true): void {
    if (!description || description.trim().length === 0) {
      if (required) {
        throw new ValidationError('Job description is required.', {
          description: ['Job description cannot be empty'],
        });
      }
      return;
    }

    const trimmed = description.trim();
    if (trimmed.length < 100 || trimmed.length > 10000) {
      throw new ValidationError('Job description must be between 100 and 10,000 characters.', {
        description: ['Length must be between 100 and 10,000 characters'],
      });
    }
  }

  public static validateLocation(location?: string | null, required = true): void {
    if (!location || location.trim().length === 0) {
      if (required) {
        throw new ValidationError('Job location is required.', {
          location: ['Job location cannot be empty'],
        });
      }
      return;
    }

    const trimmed = location.trim();
    if (trimmed.length < 1 || trimmed.length > 255) {
      throw new ValidationError('Job location must be between 1 and 255 characters.', {
        location: ['Length must be between 1 and 255 characters'],
      });
    }
  }

  public static validateHeadcount(headcount?: number | null, required = true): void {
    if (headcount === undefined || headcount === null) {
      if (required) {
        throw new ValidationError('Headcount is required.', {
          headcount: ['Headcount cannot be empty'],
        });
      }
      return;
    }

    const num = Number(headcount);
    if (!Number.isInteger(num) || num < 1 || num > 100) {
      throw new ValidationError('Headcount must be an integer between 1 and 100.', {
        headcount: ['Headcount must be between 1 and 100'],
      });
    }
  }

  public static validateJobType(jobType?: string | null, required = true): void {
    if (!jobType) {
      if (required) {
        throw new ValidationError('Job type is required.', {
          jobType: ['Job type cannot be empty'],
        });
      }
      return;
    }

    if (!ALLOWED_JOB_TYPES.includes(jobType as JobType)) {
      throw new ValidationError(
        `Invalid job type '${jobType}'. Allowed types: ${ALLOWED_JOB_TYPES.join(', ')}.`,
        { jobType: ['Job type is invalid'] },
      );
    }
  }

  public static validateWorkplaceMode(workplaceMode?: string | null, required = true): void {
    if (!workplaceMode) {
      if (required) {
        throw new ValidationError('Workplace mode is required.', {
          workplaceMode: ['Workplace mode cannot be empty'],
        });
      }
      return;
    }

    if (!ALLOWED_WORKPLACE_MODES.includes(workplaceMode as WorkplaceMode)) {
      throw new ValidationError(
        `Invalid workplace mode '${workplaceMode}'. Allowed modes: ${ALLOWED_WORKPLACE_MODES.join(', ')}.`,
        { workplaceMode: ['Workplace mode is invalid'] },
      );
    }
  }

  public static validateDeadline(
    deadline?: Date | string | null,
    referenceTime: Date = new Date(),
    required = true,
  ): void {
    if (!deadline) {
      if (required) {
        throw new ValidationError('Application deadline is required.', {
          deadline: ['Deadline cannot be empty'],
        });
      }
      return;
    }

    const date = deadline instanceof Date ? deadline : new Date(deadline);
    if (isNaN(date.getTime())) {
      throw new ValidationError('Invalid deadline format.', {
        deadline: ['Deadline must be a valid date'],
      });
    }

    if (date.getTime() <= referenceTime.getTime()) {
      throw new ValidationError('Application deadline must be in the future.', {
        deadline: ['Deadline must be after current time'],
      });
    }
  }

  public static validateCompletenessForPublish(
    job: JobCompletenessFields,
    referenceTime: Date = new Date(),
  ): void {
    this.validateTitle(job.title, true);
    this.validateDescription(job.description, true);
    this.validateLocation(job.location, true);
    this.validateHeadcount(job.headcount, true);
    this.validateJobType(job.jobType, true);
    this.validateWorkplaceMode(job.workplaceMode, true);
    this.validateDeadline(job.deadline, referenceTime, true);
    SalaryRules.validateSalary(job.salaryMin, job.salaryMax, job.currency);
  }
}
