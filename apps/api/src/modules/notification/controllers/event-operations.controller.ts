import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { CsrfGuard } from '../../../common/guards/csrf.guard';
import type { Actor } from '../../../../../libs/contracts/backend';
import type {
  OutboxEventAdminDto,
  PageResponse,
  RetryEventRequest,
} from '../../../../../libs/contracts/public';
import { EventOperationsService } from '../services/event-operations.service';

@Controller('admin/events')
@UseGuards(SessionGuard, CsrfGuard)
export class EventOperationsController {
  constructor(private readonly service: EventOperationsService) {}

  @Get()
  async listEvents(
    @CurrentActor() actor: Actor,
    @Query('status') status?: string,
    @Query('eventType') eventType?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ): Promise<PageResponse<OutboxEventAdminDto>> {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 20;

    return this.service.listEvents(actor, {
      status,
      eventType,
      page,
      pageSize,
    });
  }

  @Get(':id')
  async getEvent(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OutboxEventAdminDto> {
    return this.service.getEventDetail(actor, id);
  }

  @Post(':id/retry')
  @HttpCode(200)
  async retryEvent(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: RetryEventRequest,
  ): Promise<{ success: true }> {
    await this.service.retryEvent(actor, id, body?.reason);
    return { success: true };
  }
}
