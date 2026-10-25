import { ReservationReconciliation } from './reservation-reconciliation';
import type { ManagedUnitOfWork, TransactionContext } from '../../../../libs/platform/database/unit-of-work';
import type { Prisma } from '@prisma/client';

describe('ReservationReconciliation', () => {
  it('reconciles orphan reservations successfully', async () => {
    const mockClient = {
      $queryRaw: jest.fn().mockResolvedValue([
        { interview_id: 'i1', user_id: 'u1' },
      ]),
    };

    const mockUow: ManagedUnitOfWork<Prisma.TransactionClient> = {
      run: jest.fn().mockImplementation(async (fn: (tx: TransactionContext) => Promise<unknown>) => {
        return fn({} as TransactionContext);
      }),
      clientFor: jest.fn().mockReturnValue(mockClient as unknown as Prisma.TransactionClient),
    } as unknown as ManagedUnitOfWork<Prisma.TransactionClient>;

    const reconciliation = new ReservationReconciliation(mockUow);
    const result = await reconciliation.reconcile();

    expect(result.orphanReleasedCount).toBe(1);
    expect(mockClient.$queryRaw).toHaveBeenCalled();
  });
});
