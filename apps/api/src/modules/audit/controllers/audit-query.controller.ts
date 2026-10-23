import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentActor } from '../../../common/decorators/actor.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { CsrfGuard } from '../../../common/guards/csrf.guard';
import type { Actor } from '../../../../../../libs/contracts/backend';
import type { AuditLogDto, PageResponse } from '../../../../../../libs/contracts/public';
import { AuditQueryService } from '../services/audit-query.service';

@Controller('admin/audit')
@UseGuards(SessionGuard, CsrfGuard)
export class AuditQueryController {
  constructor(private readonly service: AuditQueryService) {}

  @Get()
  async getAuditLogs(
    @CurrentActor() actor: Actor,
    @Query('actorId') actorId?: string,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('traceId') traceId?: string,
    @Query('from') fromStr?: string,
    @Query('to') toStr?: string,
    @Query('page') pageStr?: string,
    @Query('pageSize') pageSizeStr?: string,
  ): Promise<PageResponse<AuditLogDto>> {
    const page = pageStr ? parseInt(pageStr, 10) : 1;
    const pageSize = pageSizeStr ? parseInt(pageSizeStr, 10) : 20;
    const from = fromStr ? new Date(fromStr) : undefined;
    const to = toStr ? new Date(toStr) : undefined;

    return this.service.getAuditLogs(actor, {
      actorId,
      entityType,
      entityId,
      traceId,
      from,
      to,
      page,
      pageSize,
    });
  }
}
