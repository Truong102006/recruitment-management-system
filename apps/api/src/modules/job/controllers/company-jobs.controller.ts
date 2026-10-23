import { Controller, Get, Param, ParseUUIDPipe, Query, UseGuards } from '@nestjs/common';
import { JobReadService } from '../services/job-read.service';
import { JobDetailDto, JobSummaryDto, JobPageQueryDto } from '../dto/job.dto';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';

@Controller('companies/:id/jobs')
@UseGuards(SessionGuard)
export class CompanyJobsController {
  constructor(private readonly jobReadService: JobReadService) {}

  @Get()
  public async listCompanyJobs(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Query() query: JobPageQueryDto,
  ): Promise<{
    data: JobSummaryDto[];
    meta: { page: number; pageSize: number; total: number; totalPages: number };
  }> {
    return this.jobReadService.getCompanyJobs(actor, companyId, query);
  }

  @Get(':jobId')
  public async getCompanyJobDetail(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) companyId: string,
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ): Promise<JobDetailDto> {
    return this.jobReadService.getCompanyJobDetail(actor, companyId, jobId);
  }
}
