import { Injectable, Logger } from '@nestjs/common';
import { UnitOfWork } from '../../../../libs/platform/database/unit-of-work';

@Injectable()
export class ReservationReconciliation {
  private readonly logger = new Logger(ReservationReconciliation.name);

  constructor(private readonly uow: UnitOfWork) {}

  async reconcile(): Promise<{ orphanReleasedCount: number }> {
    return this.uow.run(async (tx) => {
      // Find active reservations whose interview is no longer CONFIRMED
      const orphanReservations: any[] = await tx.client.$queryRaw`
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
