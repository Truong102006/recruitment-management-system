import {
  Controller,
  Get,
  Patch,
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
import type { NotificationsPageResponse } from '../../../../../libs/contracts/public';
import { NotificationService } from '../services/notification.service';

@Controller('notifications')
@UseGuards(SessionGuard, CsrfGuard)
export class NotificationsController {
  constructor(private readonly service: NotificationService) {}

  @Get()
  async getNotifications(
    @CurrentActor() actor: Actor,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ): Promise<NotificationsPageResponse> {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 20;

    return this.service.listForUser(actor, page, pageSize);
  }

  @Patch(':id/read')
  @HttpCode(200)
  async markRead(
    @CurrentActor() actor: Actor,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ success: true }> {
    await this.service.markAsRead(actor, id);
    return { success: true };
  }
}
