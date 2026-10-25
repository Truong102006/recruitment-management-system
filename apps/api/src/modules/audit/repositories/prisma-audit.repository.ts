import { Inject, Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { Prisma } from '@prisma/client';
import {
  ManagedUnitOfWork,
  TransactionContext as Tx,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { AuditLogDto } from '../../../../../../libs/contracts/public';

export interface CreateAuditEntryInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId: string;
  reason?: string | null;
  traceId?: string;
}

export interface FindAuditLogsFilter {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  traceId?: string;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

@Injectable()
export class PrismaAuditRepository {
  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  async write(input: CreateAuditEntryInput, tx: Tx): Promise<void> {
    const client = this.uow.clientFor(tx);
    const id = crypto.randomUUID();
    const traceId = input.traceId || crypto.randomUUID();

    await client.$executeRaw`
      INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, reason, trace_id, created_at)
      VALUES (
        ${id}::uuid,
        ${input.actorId ? input.actorId : null}::uuid,
        ${input.action},
        ${input.entityType},
        ${input.entityId}::uuid,
        ${input.reason ?? null},
        ${traceId}::uuid,
        now()
      )
    `;
  }

  async findMany(
    filter: FindAuditLogsFilter,
    tx: Tx,
  ): Promise<{ data: AuditLogDto[]; total: number }> {
    const client = this.uow.clientFor(tx);
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filter.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    // Use Prisma client to query audit_log
    const where: Prisma.AuditLogWhereInput = {};
    if (filter.actorId) where.actorId = filter.actorId;
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.traceId) where.traceId = filter.traceId;
    if (filter.from || filter.to) {
      where.createdAt = {};
      if (filter.from) (where.createdAt as Prisma.DateTimeFilter).gte = filter.from;
      if (filter.to) (where.createdAt as Prisma.DateTimeFilter).lt = filter.to;
    }

    const [records, total] = await Promise.all([
      client.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: pageSize,
      }),
      client.auditLog.count({ where }),
    ]);

    const data: AuditLogDto[] = records.map((r: {
      id: string;
      actorId: string | null;
      action: string;
      entityType: string;
      entityId: string;
      reason: string | null;
      traceId: string;
      createdAt: Date;
    }) => ({
      id: r.id,
      actorId: r.actorId,
      action: r.action,
      entityType: r.entityType,
      entityId: r.entityId,
      reason: r.reason,
      traceId: r.traceId,
      createdAt: r.createdAt.toISOString(),
    }));

    return { data, total };
  }
}
