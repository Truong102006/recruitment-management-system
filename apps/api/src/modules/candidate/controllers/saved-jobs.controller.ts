import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';
import { SavedJobService } from '../services/saved-job.service';

class PageQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page = 1;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize = 20;
}

@Controller('saved-jobs')
@UseGuards(SessionGuard)
export class SavedJobsController {
  constructor(private readonly service: SavedJobService) {}
  @Get() list(@CurrentActor() actor: Actor, @Query() query: PageQueryDto) {
    return this.service.list(actor, query.page, query.pageSize);
  }
  @Put(':jobId')
  @HttpCode(204)
  async save(
    @CurrentActor() actor: Actor,
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ): Promise<void> {
    await this.service.save(actor, jobId);
  }
  @Delete(':jobId')
  @HttpCode(204)
  remove(
    @CurrentActor() actor: Actor,
    @Param('jobId', new ParseUUIDPipe({ version: '4' })) jobId: string,
  ): Promise<void> {
    return this.service.remove(actor, jobId);
  }
}
