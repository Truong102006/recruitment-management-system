import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import type { Actor } from '../../../../../libs/contracts/backend';
import type { OutboxEventAdminDto, PageResponse } from '../../../../../libs/contracts/public';
import { UnitOfWork } from '../../../../../libs/platform/database/unit-of-work';
import { NotificationPolicy } from '../policies/notification.policy';
import { PrismaOutboxRepository } from '../repositories/prisma-outbox.repository';
import { PrismaAuditRepository } from '../../audit/repositories/prisma-audit.repository';

@Injectable()
export class EventOperationsService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly policy: NotificationPolicy,
    private readonly outboxRepo: PrismaOutboxRepository,
    private readonly auditRepo: PrismaAuditRepository,
  ) {}

  async listEvents(
    actor: Actor,
    filter: { status?: string; eventType?: string; page?: number; pageSize?: number },
  ): Promise<PageResponse<OutboxEventAdminDto>> {
    this.policy.assertCanManageEvents(actor);

    return this.uow.run(async (tx) => {
      const page = Math.max(1, filter.page ?? 1);
      const pageSize = Math.min(50, Math.max(1, filter.pageSize ?? 20));

      const { data, total } = await this.outboxRepo.findMany(
        { ...filter, page, pageSize },
        tx,
      );

      return {
        data,
        meta: {
          page,
          pageSize,
          total,
        },
      };
    });
  }

  async getEventDetail(actor: Actor, eventId: string): Promise<OutboxEventAdminDto> {
    this.policy.assertCanManageEvents(actor);

    return this.uow.run(async (tx) => {
      const event = await this.outboxRepo.findById(eventId, tx);
      if (!event) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Outbox event not found',
        });
      }
      return event;
    });
  }

  async retryEvent(actor: Actor, eventId: string, reason: string): Promise<void> {
    this.policy.assertCanManageEvents(actor);

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException({
        code: 'VALIDATION_FAILED',
        message: 'Reason is required to retry a failed event',
      });
    }

    await this.uow.run(async (tx) => {
      const event = await this.outboxRepo.findById(eventId, tx);
      if (!event) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Outbox event not found',
        });
      }

      if (event.status !== 'FAILED') {
        throw new ConflictException({
          code: 'STATE_CONFLICT',
          message: 'Only FAILED events can be retried by administrator',
        });
      }

      const retried = await this.outboxRepo.adminRetry(eventId, tx);
      if (!retried) {
        throw new ConflictException({
          code: 'STATE_CONFLICT',
          message: 'Failed to reset event status for retry',
        });
      }

      await this.auditRepo.write(
        {
          actorId: actor.userId,
          action: 'OUTBOX_EVENT_RETRY',
          entityType: 'OUTBOX_EVENT',
          entityId: eventId,
          reason,
        },
        tx,
      );
    });
  }
}
