import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { UnitOfWork } from '../../../../libs/platform/database/unit-of-work';
import { PrismaOutboxRepository } from '../../../api/src/modules/notification/repositories/prisma-outbox.repository';

@Injectable()
export class ExpireProposalsJob {
  private readonly logger = new Logger(ExpireProposalsJob.name);

  constructor(
    private readonly uow: UnitOfWork,
    private readonly outboxRepo: PrismaOutboxRepository,
  ) {}

  async runOnce(): Promise<number> {
    return this.uow.run(async (tx) => {
      const expiredRows: any[] = await tx.client.$queryRaw`
        UPDATE interview
        SET status = 'EXPIRED'
        WHERE status = 'PROPOSED'
          AND expires_at <= now()
        RETURNING id, application_id as "applicationId", version
      `;

      for (const row of expiredRows) {
        await this.outboxRepo.append(
          {
            eventId: crypto.randomUUID(),
            eventType: 'interview.expired',
            schemaVersion: 1,
            aggregateType: 'INTERVIEW',
            aggregateId: row.id,
            aggregateVersion: row.version,
            occurredAt: new Date().toISOString(),
            payload: {
              interviewId: row.id,
              applicationId: row.applicationId,
            },
          },
          tx,
        );
      }

      return expiredRows.length;
    });
  }
}
