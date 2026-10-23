import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { TransactionContext as Tx } from '../../../../../libs/platform/database/unit-of-work';
import type { AnyDomainEvent } from '../../../../../libs/contracts/backend/be3-events';
import type { OutboxEventAdminDto } from '../../../../../libs/contracts/public';

export interface OutboxEventRecord {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: any;
  status: 'PENDING' | 'PROCESSING' | 'DONE' | 'FAILED';
  attemptCount: number;
  nextRetryAt: Date;
  lockedUntil: Date | null;
  lastErrorCode: string | null;
  leaseToken: string | null;
  schemaVersion: number;
  aggregateVersion: number;
  createdAt: Date;
  processedAt: Date | null;
}

function resolveAggregateType(eventType: string, candidateType?: string): string {
  if (candidateType) return candidateType;
  if (eventType.startsWith('interview.')) return 'INTERVIEW';
  if (eventType.startsWith('evaluation.')) return 'EVALUATION';
  if (eventType.startsWith('application.')) return 'APPLICATION';
  if (eventType.startsWith('job.')) return 'JOB';
  if (eventType.startsWith('company.')) return 'COMPANY';
  if (eventType.startsWith('auth.')) return 'AUTH';
  if (eventType.startsWith('user.')) return 'USER';
  if (eventType.startsWith('cv.')) return 'CV';
  if (eventType.startsWith('candidate.')) return 'USER';
  if (eventType.startsWith('saved_job.')) return 'JOB';
  return 'RESOURCE';
}

@Injectable()
export class PrismaOutboxRepository {
  async append(event: AnyDomainEvent, tx: Tx): Promise<void> {
    const aggregateType = resolveAggregateType(
      event.eventType,
      (event as any).aggregateType,
    );
    const payloadJson = JSON.stringify(event.payload);

    await tx.client.$executeRaw`
      INSERT INTO outbox_event (
        id, aggregate_type, aggregate_id, event_type, payload,
        status, attempt_count, next_retry_at, schema_version,
        aggregate_version, created_at
      )
      VALUES (
        ${event.eventId}::uuid,
        ${aggregateType},
        ${event.aggregateId}::uuid,
        ${event.eventType},
        ${payloadJson}::jsonb,
        'PENDING',
        0,
        now(),
        ${event.schemaVersion || 1},
        ${event.aggregateVersion || 0},
        ${event.occurredAt ? new Date(event.occurredAt) : new Date()}
      )
    `;
  }

  async claimBatch(
    limit: number,
    leaseDurationMs: number,
    tx: Tx,
  ): Promise<{ events: OutboxEventRecord[]; leaseToken: string }> {
    const leaseToken = crypto.randomUUID();
    const lockedUntil = new Date(Date.now() + leaseDurationMs);

    const rows: any[] = await tx.client.$queryRaw`
      WITH selected AS (
        SELECT id
        FROM outbox_event
        WHERE status IN ('PENDING', 'PROCESSING')
          AND (locked_until IS NULL OR locked_until < now())
          AND next_retry_at <= now()
        ORDER BY created_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE outbox_event
      SET
        status = 'PROCESSING',
        attempt_count = attempt_count + 1,
        locked_until = ${lockedUntil},
        lease_token = ${leaseToken}::uuid
      FROM selected
      WHERE outbox_event.id = selected.id
      RETURNING
        outbox_event.id,
        outbox_event.aggregate_type as "aggregateType",
        outbox_event.aggregate_id as "aggregateId",
        outbox_event.event_type as "eventType",
        outbox_event.payload,
        outbox_event.status,
        outbox_event.attempt_count as "attemptCount",
        outbox_event.next_retry_at as "nextRetryAt",
        outbox_event.locked_until as "lockedUntil",
        outbox_event.last_error_code as "lastErrorCode",
        outbox_event.lease_token as "leaseToken",
        outbox_event.schema_version as "schemaVersion",
        outbox_event.aggregate_version as "aggregateVersion",
        outbox_event.created_at as "createdAt",
        outbox_event.processed_at as "processedAt"
    `;

    return { events: rows, leaseToken };
  }

  async markDone(id: string, leaseToken: string, tx: Tx): Promise<boolean> {
    const updated = await tx.client.$executeRaw`
      UPDATE outbox_event
      SET
        status = 'DONE',
        locked_until = NULL,
        lease_token = NULL,
        processed_at = now()
      WHERE id = ${id}::uuid
        AND lease_token = ${leaseToken}::uuid
        AND status = 'PROCESSING'
    `;
    return updated > 0;
  }

  async scheduleRetry(
    id: string,
    leaseToken: string,
    nextRetryAt: Date,
    errorCode: string,
    tx: Tx,
  ): Promise<boolean> {
    const updated = await tx.client.$executeRaw`
      UPDATE outbox_event
      SET
        status = 'PENDING',
        locked_until = NULL,
        lease_token = NULL,
        next_retry_at = ${nextRetryAt},
        last_error_code = ${errorCode}
      WHERE id = ${id}::uuid
        AND lease_token = ${leaseToken}::uuid
        AND status = 'PROCESSING'
    `;
    return updated > 0;
  }

  async markFailed(
    id: string,
    leaseToken: string,
    errorCode: string,
    tx: Tx,
  ): Promise<boolean> {
    const updated = await tx.client.$executeRaw`
      UPDATE outbox_event
      SET
        status = 'FAILED',
        locked_until = NULL,
        lease_token = NULL,
        last_error_code = ${errorCode}
      WHERE id = ${id}::uuid
        AND lease_token = ${leaseToken}::uuid
        AND status = 'PROCESSING'
    `;
    return updated > 0;
  }

  async adminRetry(id: string, tx: Tx): Promise<boolean> {
    const updated = await tx.client.$executeRaw`
      UPDATE outbox_event
      SET
        status = 'PENDING',
        attempt_count = 0,
        locked_until = NULL,
        lease_token = NULL,
        next_retry_at = now(),
        last_error_code = NULL
      WHERE id = ${id}::uuid
        AND status = 'FAILED'
    `;
    return updated > 0;
  }

  async findMany(
    filter: { status?: string; eventType?: string; page?: number; pageSize?: number },
    tx: Tx,
  ): Promise<{ data: OutboxEventAdminDto[]; total: number }> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filter.pageSize ?? 20));
    const offset = (page - 1) * pageSize;

    const where: any = {};
    if (filter.status) where.status = filter.status;
    if (filter.eventType) where.eventType = filter.eventType;

    const [records, total] = await Promise.all([
      (tx.client as any).outboxEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: pageSize,
      }),
      (tx.client as any).outboxEvent.count({ where }),
    ]);

    const data: OutboxEventAdminDto[] = records.map((r: any) => ({
      id: r.id,
      aggregateType: r.aggregateType,
      aggregateId: r.aggregateId,
      eventType: r.eventType,
      status: r.status,
      attemptCount: r.attemptCount,
      nextRetryAt: r.nextRetryAt.toISOString(),
      lockedUntil: r.lockedUntil ? r.lockedUntil.toISOString() : null,
      lastErrorCode: r.lastErrorCode,
      createdAt: r.createdAt.toISOString(),
      processedAt: r.processedAt ? r.processedAt.toISOString() : null,
      schemaVersion: r.schemaVersion,
      aggregateVersion: r.aggregateVersion,
    }));

    return { data, total };
  }

  async findById(id: string, tx: Tx): Promise<OutboxEventAdminDto | null> {
    const r = await (tx.client as any).outboxEvent.findUnique({
      where: { id },
    });
    if (!r) return null;

    return {
      id: r.id,
      aggregateType: r.aggregateType,
      aggregateId: r.aggregateId,
      eventType: r.eventType,
      status: r.status,
      attemptCount: r.attemptCount,
      nextRetryAt: r.nextRetryAt.toISOString(),
      lockedUntil: r.lockedUntil ? r.lockedUntil.toISOString() : null,
      lastErrorCode: r.lastErrorCode,
      createdAt: r.createdAt.toISOString(),
      processedAt: r.processedAt ? r.processedAt.toISOString() : null,
      schemaVersion: r.schemaVersion,
      aggregateVersion: r.aggregateVersion,
    };
  }
}
