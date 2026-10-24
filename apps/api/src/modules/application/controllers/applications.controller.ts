import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';
import { SubmitApplicationWorkflowService } from '../services/submit-application-workflow.service';
import { CvChangeWorkflowService } from '../services/cv-change-workflow.service';
import { ReviewApplicationWorkflowService } from '../services/review-application-workflow.service';
import { ApplicationReadService } from '../services/application-read.service';

class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
  @IsOptional() @IsUUID('4') companyId?: string;
}
class ScopeQueryDto {
  @IsOptional() @IsUUID('4') companyId?: string;
}
class SubmitDto {
  @IsUUID('4') cvId!: string;
  @IsOptional() @IsString() @MaxLength(3000) coverLetter?: string;
}
class VersionDto {
  @IsInt() @Min(0) version!: number;
}
class ReviewDto extends VersionDto {
  @IsIn(['SCREENING', 'SHORTLISTED']) status!: 'SCREENING' | 'SHORTLISTED';
}
class ChangeCvDto extends VersionDto {
  @IsUUID('4') newCvId!: string;
}
class ReviewChangeDto {
  @IsInt() @Min(0) applicationVersion!: number;
  @IsInt() @Min(0) requestVersion!: number;
  @IsOptional() @IsString() @MaxLength(3000) reason?: string;
}

@Controller()
@UseGuards(SessionGuard)
export class ApplicationsController {
  constructor(
    private readonly submitService: SubmitApplicationWorkflowService,
    private readonly changeService: CvChangeWorkflowService,
    private readonly reviewService: ReviewApplicationWorkflowService,
    private readonly readService: ApplicationReadService,
  ) {}

  @Get('applications') list(@CurrentActor() actor: Actor, @Query() query: PageQueryDto) {
    return query.companyId
      ? this.readService.listRecruiter(actor, query.companyId, query.page, query.pageSize)
      : this.readService.listCandidate(actor, query.page, query.pageSize);
  }
  @Get('applications/:id') one(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ScopeQueryDto,
  ) {
    return this.readService.one(actor, id, query.companyId);
  }
  @Get('applications/:id/history') history(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query() query: ScopeQueryDto,
  ) {
    return this.readService.history(actor, id, query.companyId);
  }
  @Post('jobs/:id/applications')
  async submit(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: SubmitDto,
    @Headers('idempotency-key') key: string,
  ) {
    const result = await this.submitService.submit(actor, id, body, key);
    return this.readService.one(actor, result.applicationId);
  }
  @Post('applications/:id/cv-change')
  @HttpCode(200)
  requestCvChange(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ChangeCvDto,
    @Headers('idempotency-key') key: string,
  ) {
    return this.changeService.requestChange(actor, id, body.newCvId, body.version, key);
  }
  @Post('cv-change/:id/approve')
  @HttpCode(200)
  approveCvChange(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ReviewChangeDto,
  ) {
    return this.changeService.reviewChange(
      actor,
      id,
      body.applicationVersion,
      body.requestVersion,
      'APPROVE',
      body.reason,
    );
  }
  @Post('cv-change/:id/reject')
  @HttpCode(200)
  rejectCvChange(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ReviewChangeDto,
  ) {
    return this.changeService.reviewChange(
      actor,
      id,
      body.applicationVersion,
      body.requestVersion,
      'REJECT',
      body.reason,
    );
  }
  @Post('applications/:id/review')
  @HttpCode(200)
  review(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: ReviewDto,
  ) {
    return this.reviewService.review(actor, id, body.status, body.version);
  }
  @Post('applications/:id/withdraw')
  @HttpCode(200)
  withdraw(
    @CurrentActor() actor: Actor,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: VersionDto,
  ) {
    return this.reviewService.withdraw(actor, id, body.version);
  }
}
