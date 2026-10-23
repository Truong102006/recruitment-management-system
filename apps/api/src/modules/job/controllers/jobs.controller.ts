import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateJobService } from '../services/create-job.service';
import { UpdateJobService } from '../services/update-job.service';
import { PublishJobService } from '../services/publish-job.service';
import { CloseJobService } from '../services/close-job.service';
import { JobReadService } from '../services/job-read.service';
import {
  CreateJobDto,
  UpdateJobDto,
  PublishJobDto,
  CloseJobDto,
  JobSearchQueryDto,
  JobDetailDto,
} from '../dto/job.dto';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { PublicRoute } from '../../../common/decorators/public-route.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { CsrfGuard } from '../../../common/guards/csrf.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';

@Controller('jobs')
@UseGuards(SessionGuard, CsrfGuard)
export class JobsController {
  constructor(
    private readonly createJobService: CreateJobService,
    private readonly updateJobService: UpdateJobService,
    private readonly publishJobService: PublishJobService,
    private readonly closeJobService: CloseJobService,
    private readonly jobReadService: JobReadService,
  ) {}

  @PublicRoute()
  @Get()
  public async searchPublicJobs(@Query() query: JobSearchQueryDto) {
    return this.jobReadService.searchPublicJobs(query);
  }

  @PublicRoute()
  @Get(':id')
  public async getPublicJobDetail(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<JobDetailDto> {
    return this.jobReadService.getPublicJobDetail(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  public async createDraft(
    @CurrentActor() actor: Actor,
    @Body() dto: CreateJobDto,
  ): Promise<JobDetailDto> {
    return this.createJobService.createDraft(actor, dto);
  }

  @Patch(':id')
  public async updateJob(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: UpdateJobDto,
  ): Promise<JobDetailDto> {
    return this.updateJobService.updateJob(actor, id, dto);
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  public async publishJob(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: PublishJobDto,
  ): Promise<JobDetailDto> {
    return this.publishJobService.publishJob(actor, id, dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  public async closeJob(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() dto: CloseJobDto,
  ): Promise<JobDetailDto> {
    return this.closeJobService.closeJob(actor, id, dto);
  }
}
