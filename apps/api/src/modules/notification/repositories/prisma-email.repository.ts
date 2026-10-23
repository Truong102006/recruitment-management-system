import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import type { TransactionContext as Tx } from '../../../../../libs/platform/database/unit-of-work';

export interface EmailDeliveryRecord {
  id: string;
  eventId: string;
  userId: string;
  templateCode: string;
  recipientEmail: string;
  status: 'PENDING' | 'SENDING' | 'SENT' | 'FAILED';
  providerMessageId: string | null;
  attemptCount: number;
  sentAt: Date | null;
  lastErrorCode: string | null;
  lockedUntil: Date | null;
  leaseToken: string | null;
  nextRetryAt: Date;
  createdAt: Date;
}

export interface CreateEmailDeliveryInput {
  eventId: string;
  userId: string;
  templateCode: string;
  recipientEmail: string;
}

@Injectable()
export class PrismaEmailRepository {
  async createDelivery(input: CreateEmailDeliveryInput, tx: Tx): Promise<void> {
    const id = crypto.randomUUID();
    await tx.client.$executeRaw`
      INSERT INTO email_delivery (
        id, event_id, user_id, template_code, recipient_email,
        status, attempt_count, next_retry_at, created_at
      )
      VALUES (
        ${id}::uuid,
        ${input.eventId}::uuid,
        ${input.userId}::uuid,
        ${input.templateCode},
        ${input.recipientEmail},
        'PENDING',
        0,
        now(),
        now()
      )
      ON CONFLICT (event_id, user_id, template_code) DO NOTHING
    `;
  }

  async claimBatch(
    limit: number,
    leaseDurationMs: number,
    tx: Tx,
  ): Promise<{ deliveries: EmailDeliveryRecord[]; leaseToken: string }> {
    const leaseToken = crypto.randomUUID();
    const lockedUntil = new Date(Date.now() + leaseDurationMs);

    const rows: any[] = await tx.client.$queryRaw`
      WITH selected AS (
        SELECT id
        FROM email_delivery
        WHERE status IN ('PENDING', 'SENDING')
          AND (locked_until IS NULL OR locked_until < now())
          AND next_retry_at <= now()
        ORDER BY created_at ASC
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      UPDATE email_delivery
      SET
        status = 'SENDING',
        attempt_count = attempt_count + 1,
        locked_until = ${lockedUntil},
        lease_token = ${leaseToken}::uuid
      FROM selected
      WHERE email_delivery.id = selected.id
      RETURNING
        email_delivery.id,
        email_delivery.event_id as "eventId",
        email_delivery.user_id as "userId",
        email_delivery.template_code as "templateCode",
        email_delivery.recipient_email as "recipientEmail",
        email_delivery.status,
        email_delivery.provider_message_id as "providerMessageId",
        email_delivery.attempt_count as "attemptCount",
        email_delivery.sent_at as "sentAt",
        email_delivery.last_error_code as "lastErrorCode",
        email_delivery.locked_until as "lockedUntil",
        email_delivery.lease_token as "leaseToken",
        email_delivery.next_retry_at as "nextRetryAt",
        email_delivery.created_at as "createdAt"
    `;

    return { deliveries: rows, leaseToken };
  }

  async markSent(
    id: string,
    leaseToken: string,
    providerMessageId: string | undefined,
    tx: Tx,
  ): Promise<boolean> {
    const updated = await tx.client.$executeRaw`
      UPDATE email_delivery
      SET
        status = 'SENT',
        sent_at = now(),
        locked_until = NULL,
        lease_token = NULL,
        provider_message_id = ${providerMessageId ?? null}
      WHERE id = ${id}::uuid
        AND lease_token = ${leaseToken}::uuid
        AND status = 'SENDING'
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
      UPDATE email_delivery
      SET
        status = 'PENDING',
        locked_until = NULL,
        lease_token = NULL,
        next_retry_at = ${nextRetryAt},
        last_error_code = ${errorCode}
      WHERE id = ${id}::uuid
        AND lease_token = ${leaseToken}::uuid
        AND status = 'SENDING'
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
      UPDATE email_delivery
      SET
        status = 'FAILED',
        locked_until = NULL,
        lease_token = NULL,
        last_error_code = ${errorCode}
      WHERE id = ${id}::uuid
        AND lease_token = ${leaseToken}::uuid
        AND status = 'SENDING'
    `;
    return updated > 0;
  }
}
