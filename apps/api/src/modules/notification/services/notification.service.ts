import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { Actor, OutboxPort, TransactionContext as Tx } from '../../../../../../libs/contracts/backend';
import type { AnyDomainEvent } from '../../../../../../libs/contracts/backend/be3-events';
import type { NotificationsPageResponse } from '../../../../../../libs/contracts/public';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { NotificationPolicy } from '../policies/notification.policy';
import { PrismaNotificationRepository } from '../repositories/prisma-notification.repository';
import { PrismaOutboxRepository } from '../repositories/prisma-outbox.repository';

@Injectable()
export class NotificationService implements OutboxPort {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    private readonly policy: NotificationPolicy,
    private readonly notificationRepo: PrismaNotificationRepository,
    private readonly outboxRepo: PrismaOutboxRepository,
  ) {}

  async append(event: AnyDomainEvent, tx: Tx): Promise<void> {
    await this.outboxRepo.append(event, tx);
  }

  async listForUser(
    actor: Actor,
    page = 1,
    pageSize = 20,
  ): Promise<NotificationsPageResponse> {
    this.policy.assertCanReadNotifications(actor);

    return this.uow.run(async (tx: Tx) => {
      const { data, total, unreadCount } = await this.notificationRepo.findForUser(
        actor.userId,
        page,
        pageSize,
        tx,
      );

      return {
        data,
        meta: {
          page: Math.max(1, page),
          pageSize: Math.min(50, Math.max(1, pageSize)),
          total,
          unreadCount,
        },
      };
    });
  }

  async markAsRead(actor: Actor, notificationId: string): Promise<void> {
    this.policy.assertCanReadNotifications(actor);

    await this.uow.run(async (tx: Tx) => {
      const updated = await this.notificationRepo.markRead(notificationId, actor.userId, tx);
      // If notification not found or belongs to another user, throw 404
      if (!updated) {
        const client = this.uow.clientFor(tx);
        const exists = await client.notification.findFirst({
          where: { id: notificationId, userId: actor.userId },
        });
        if (!exists) {
          throw new NotFoundException({
            code: 'RESOURCE_NOT_FOUND',
            message: 'Notification not found or access denied',
          });
        }
      }
    });
  }
}
