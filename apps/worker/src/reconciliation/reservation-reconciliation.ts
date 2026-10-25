import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
  type TransactionContext as Tx,
} from '../../../../libs/platform/database/unit-of-work';

@Injectable()
export class ReservationReconciliation {
  private readonly logger = new Logger(ReservationReconciliation.name);

  constructor(
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {}

  async reconcile(): Promise<{ orphanReleasedCount: number }> {
    return this.uow.run(async (tx: Tx) => {
      const client = this.uow.clientFor(tx);
      // Find active reservations whose interview is no longer CONFIRMED
      const orphanReservations = await client.$queryRaw<Array<{ interview_id: string; user_id: string }>>`
        UPDATE interview_reservation ir
        SET
          released_at = now(),
          release_reason = 'RECONCILIATION_INTERVIEW_NOT_CONFIRMED'
        FROM interview i
        WHERE ir.interview_id = i.id
          AND ir.released_at IS NULL
          AND i.status NOT IN ('CONFIRMED')
        RETURNING ir.interview_id, ir.user_id
      `;

      if (orphanReservations.length > 0) {
        this.logger.warn(`Reconciled and released ${orphanReservations.length} orphan reservations`);
      }

      return { orphanReleasedCount: orphanReservations.length };
    });
  }
}
