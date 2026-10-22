import type { TransactionDriver } from './unit-of-work';

/** Structural Prisma 6 interface; no dependency on an as-yet ungenerated business schema. */
export interface PrismaTransactionHost<Client> {
  $transaction<T>(
    work: (client: Client) => Promise<T>,
    options: { isolationLevel: 'ReadCommitted'; maxWait: number; timeout: number },
  ): Promise<T>;
}

export class PrismaTransactionDriver<Client> implements TransactionDriver<Client> {
  constructor(
    private readonly prisma: PrismaTransactionHost<Client>,
    private readonly options: { maxWait: number; timeout: number } = {
      maxWait: 2_000,
      timeout: 5_000,
    },
  ) {
    for (const value of [options.maxWait, options.timeout]) {
      if (!Number.isSafeInteger(value) || value <= 0) {
        throw new RangeError('Transaction time limits must be positive integer milliseconds');
      }
    }
  }

  transaction<T>(work: (client: Client) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(work, {
      isolationLevel: 'ReadCommitted',
      ...this.options,
    });
  }
}
