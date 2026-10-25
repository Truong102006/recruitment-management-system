import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
  type TransactionContext as Tx,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { NotificationDto } from '../../../../../../libs/contracts/public';

export interface CreateNotificationInput {
  userId: string;
  eventId: string;
  title: string;
  content: string;
  targetType: 'APPLICATION' | 'INTERVIEW' | 'COMPANY' | 'JOB';
  targetId: string;
}

@Injectable()
export class PrismaNotificationRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  async createNotification(input: CreateNotificationInput, tx: Tx): Promise<void> {
    const client = this.uow.clientFor(tx);
    const id = crypto.randomUUID();
    // Unique on (user_id, event_id): ON CONFLICT DO NOTHING to prevent duplicates
    await client.$executeRaw`
      INSERT INTO notification (id, user_id, event_id, title, content, target_type, target_id, created_at)
      VALUES (
        ${id}::uuid,
        ${input.userId}::uuid,
        ${input.eventId}::uuid,
        ${input.title},
        ${input.content},
        ${input.targetType},
        ${input.targetId}::uuid,
        now()
      )
      ON CONFLICT (user_id, event_id) DO NOTHING
    `;
  }

  async findForUser(
    userId: string,
    page: number,
    pageSize: number,
    tx: Tx,
  ): Promise<{ data: NotificationDto[]; total: number; unreadCount: number }> {
    const client = this.uow.clientFor(tx);
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(50, Math.max(1, pageSize));
    const offset = (validPage - 1) * validPageSize;

    const [records, total, unreadCount] = await Promise.all([
      client.notification.findMany({
        where: { userId },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: offset,
        take: validPageSize,
      }),
      client.notification.count({ where: { userId } }),
      client.notification.count({ where: { userId, readAt: null } }),
    ]);

    const data: NotificationDto[] = records.map((r) => ({
      id: r.id,
      title: r.title,
      content: r.content,
      targetType: r.targetType as NotificationDto['targetType'],
      targetId: r.targetId,
      readAt: r.readAt ? r.readAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));

    return { data, total, unreadCount };
  }

  async markRead(id: string, userId: string, tx: Tx): Promise<boolean> {
    const client = this.uow.clientFor(tx);
    // Only mark read if read_at is currently null (first read timestamp preserved)
    const updated = await client.$executeRaw`
      UPDATE notification
      SET read_at = now()
      WHERE id = ${id}::uuid
        AND user_id = ${userId}::uuid
        AND read_at IS NULL
    `;
    return updated > 0;
  }
}
