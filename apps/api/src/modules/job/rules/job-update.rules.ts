import { ConflictError } from '../../../../../../libs/platform/errors/domain.error';
import { PublicationRules } from './publication.rules';
import { SalaryRules } from './salary.rules';
import { UpdateJobDto } from '../dto/job.dto';

export class JobUpdateRules {
  public static validateUpdate(
    currentJob: {
      status: string;
      version: number;
      title?: string | null;
      headcount?: number | null;
      jobType?: string | null;
      workplaceMode?: string | null;
      salaryMin?: number | null;
      salaryMax?: number | null;
      currency?: string | null;
    },
    dto: UpdateJobDto,
    referenceTime: Date = new Date(),
  ): void {
    if (currentJob.status === 'CLOSED') {
      throw new ConflictError(
        'Cannot update a closed job. Closed jobs cannot be modified or reopened.',
      );
    }

    const effectiveMin = dto.salaryMin !== undefined ? dto.salaryMin : currentJob.salaryMin;
    const effectiveMax = dto.salaryMax !== undefined ? dto.salaryMax : currentJob.salaryMax;
    const effectiveCur = dto.currency !== undefined ? dto.currency : currentJob.currency;

    if (currentJob.status === 'PUBLISHED') {
      // In PUBLISHED status: title, headcount, jobType, workplaceMode CANNOT be changed
      if (dto.title !== undefined && dto.title !== currentJob.title) {
        throw new ConflictError('Cannot change the title of a published job.');
      }

      if (dto.headcount !== undefined && dto.headcount !== currentJob.headcount) {
        throw new ConflictError('Cannot change the target headcount of a published job.');
      }

      if (dto.jobType !== undefined && dto.jobType !== currentJob.jobType) {
        throw new ConflictError('Cannot change the job type of a published job.');
      }

      if (dto.workplaceMode !== undefined && dto.workplaceMode !== currentJob.workplaceMode) {
        throw new ConflictError('Cannot change the workplace mode of a published job.');
      }

      // Validate allowed fields if updated
      if (dto.description !== undefined) {
        PublicationRules.validateDescription(dto.description, true);
      }

      if (dto.location !== undefined) {
        PublicationRules.validateLocation(dto.location, true);
      }

      if (dto.deadline !== undefined) {
        PublicationRules.validateDeadline(dto.deadline, referenceTime, true);
      }

      if (
        dto.salaryMin !== undefined ||
        dto.salaryMax !== undefined ||
        dto.currency !== undefined
      ) {
        SalaryRules.validateSalary(effectiveMin, effectiveMax, effectiveCur);
      }

      return;
    }

    // In DRAFT status: any field can be changed, validate if provided
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
      PublicationRules.validateDeadline(dto.deadline, referenceTime, false);
    }

    if (dto.salaryMin !== undefined || dto.salaryMax !== undefined || dto.currency !== undefined) {
      SalaryRules.validateSalary(effectiveMin, effectiveMax, effectiveCur);
    }
  }
}
