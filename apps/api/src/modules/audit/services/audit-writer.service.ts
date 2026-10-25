import { Injectable } from '@nestjs/common';
import type { AuditWriterPort, TransactionContext as Tx } from '../../../../../../libs/contracts/backend';
import { PrismaAuditRepository } from '../repositories/prisma-audit.repository';

@Injectable()
export class AuditWriterService implements AuditWriterPort {
  constructor(private readonly auditRepo: PrismaAuditRepository) {}

  async write(
    input: {
      readonly action: string;
      readonly actorId: string;
      readonly resourceId: string;
      readonly reason: string;
      readonly entityType?: string;
      readonly traceId?: string;
    },
    tx: Tx,
  ): Promise<void> {
    await this.auditRepo.write(
      {
        action: input.action,
        actorId: input.actorId,
        entityType: input.entityType || 'RESOURCE',
        entityId: input.resourceId,
        reason: input.reason,
        traceId: input.traceId,
      },
      tx,
    );
  }
}
