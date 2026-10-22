import type { TransactionContext } from './unit-of-work';
import type { ManagedUnitOfWork } from './unit-of-work';

/** The narrow part of Prisma.TransactionClient used by BE2 SQL adapters. */
export interface ParameterizedSqlClient {
  $queryRawUnsafe<T = unknown>(query: string, ...values: readonly unknown[]): Promise<T>;
}

/** SQL strings must be fixed by the adapter; every value is passed as a bind parameter. */
export class TransactionSql {
  constructor(private readonly unitOfWork: ManagedUnitOfWork<ParameterizedSqlClient>) {}

  query<Row>(tx: TransactionContext, sql: string, values: readonly unknown[]): Promise<Row[]> {
    return this.unitOfWork.clientFor(tx).$queryRawUnsafe<Row[]>(sql, ...values);
  }
}
