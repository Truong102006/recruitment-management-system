import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';

declare const transactionBrand: unique symbol;

/** Opaque capability. Only the UnitOfWork that created it can resolve its DB client. */
export interface TransactionContext {
  readonly id: string;
  readonly [transactionBrand]: true;
}

export interface UnitOfWork {
  run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}

/** The driver resolves only after commit, and rejects on callback OR commit failure. */
export interface TransactionDriver<Client> {
  transaction<T>(work: (client: Client) => Promise<T>): Promise<T>;
}

export const UNIT_OF_WORK = Symbol.for('rms.platform.UnitOfWork.v1');

// Shared by all instances: a second UoW in the same async call chain is not a nested DB tx.
const activeScope = new AsyncLocalStorage<{ active: boolean }>();

export class ManagedUnitOfWork<Client> implements UnitOfWork {
  private readonly clients = new WeakMap<TransactionContext, Client>();

  constructor(private readonly driver: TransactionDriver<Client>) {}

  async run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    if (activeScope.getStore()?.active) {
      throw new Error('TX_NESTING_FORBIDDEN: pass the existing TransactionContext to the port');
    }
    return this.driver.transaction(async (client) => {
      const tx = Object.freeze({ id: randomUUID() }) as TransactionContext;
      const scope = { active: true };
      this.clients.set(tx, client);
      try {
        return await activeScope.run(scope, () => work(tx));
      } finally {
        scope.active = false;
        this.clients.delete(tx);
      }
    });
  }

  /** For persistence adapters only; never expose this client in HTTP DTOs. */
  clientFor(tx: TransactionContext): Client {
    if (!this.clients.has(tx)) {
      throw new Error('TX_CONTEXT_INVALID: foreign or completed transaction');
    }
    return this.clients.get(tx)!;
  }
}
