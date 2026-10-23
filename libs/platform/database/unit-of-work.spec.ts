import { ManagedUnitOfWork, type TransactionContext, type TransactionDriver } from './unit-of-work';
import { PrismaTransactionDriver, type PrismaTransactionHost } from './prisma-transaction-driver';
import { planLocks } from './lock-plan';

interface Client {
  writes: string[];
}

function memoryDriver() {
  const committed: string[] = [];
  const driver: TransactionDriver<Client> = {
    async transaction(work) {
      const client = { writes: [] as string[] };
      const result = await work(client);
      committed.push(...client.writes);
      return result;
    },
  };
  return { driver, committed };
}

describe('ManagedUnitOfWork (driver contract, not PostgreSQL integration)', () => {
  it('passes the same client to separate adapters and invalidates it after success', async () => {
    const { driver, committed } = memoryDriver();
    const uow = new ManagedUnitOfWork(driver);
    let leaked: TransactionContext | undefined;
    await uow.run(async (tx) => {
      leaked = tx;
      const appClient = uow.clientFor(tx);
      const outboxClient = uow.clientFor(tx);
      expect(appClient).toBe(outboxClient);
      appClient.writes.push('application');
      outboxClient.writes.push('outbox');
    });
    expect(committed).toEqual(['application', 'outbox']);
    expect(() => uow.clientFor(leaked!)).toThrow('TX_CONTEXT_INVALID');
  });

  it('propagates failure, leaves no simulated partial commit, and invalidates the context', async () => {
    const { driver, committed } = memoryDriver();
    const uow = new ManagedUnitOfWork(driver);
    const failure = new Error('outbox failed');
    let leaked: TransactionContext | undefined;
    await expect(
      uow.run(async (tx) => {
        leaked = tx;
        uow.clientFor(tx).writes.push('application');
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(committed).toEqual([]);
    expect(() => uow.clientFor(leaked!)).toThrow('TX_CONTEXT_INVALID');
    await expect(uow.run(async () => 'next request')).resolves.toBe('next request');
  });

  it('rejects nested UoW calls including another instance, without opening an inner transaction', async () => {
    const { driver } = memoryDriver();
    const spy = jest.spyOn(driver, 'transaction');
    const first = new ManagedUnitOfWork(driver);
    const second = new ManagedUnitOfWork(driver);
    await first.run(async (tx) => {
      await expect(first.run(async () => undefined)).rejects.toThrow('TX_NESTING_FORBIDDEN');
      await expect(second.run(async () => undefined)).rejects.toThrow('TX_NESTING_FORBIDDEN');
      expect(() => second.clientFor(tx)).toThrow('TX_CONTEXT_INVALID');
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('isolates concurrent requests rather than treating them as nested transactions', async () => {
    const uow = new ManagedUnitOfWork(memoryDriver().driver);
    const contexts: TransactionContext[] = [];
    let release!: () => void;
    const barrier = new Promise<void>((resolve) => {
      release = resolve;
    });
    const run = () =>
      uow.run(async (tx) => {
        contexts.push(tx);
        if (contexts.length === 2) release();
        await barrier;
        return uow.clientFor(tx);
      });
    const [a, b] = await Promise.all([run(), run()]);
    expect(a).not.toBe(b);
    expect(contexts[0]?.id).not.toBe(contexts[1]?.id);
  });

  it('does not report success or retry automatically if commit fails', async () => {
    const failure = new Error('commit failed');
    const driver: TransactionDriver<Client> = {
      async transaction(work) {
        await work({ writes: [] });
        throw failure;
      },
    };
    const transaction = jest.spyOn(driver, 'transaction');
    const uow = new ManagedUnitOfWork(driver);
    await expect(uow.run(async () => 'not committed')).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});

describe('Prisma 6 driver contract', () => {
  it('uses an interactive transaction and forwards isolation and bounded timeout options', async () => {
    const client: Client = { writes: [] };
    const host: PrismaTransactionHost<Client> = {
      $transaction: jest.fn(async (work) => work(client)),
    };
    const driver = new PrismaTransactionDriver(host);
    await expect(
      driver.transaction(async (tx) => {
        expect(tx).toBe(client);
        return 42;
      }),
    ).resolves.toBe(42);
    expect(host.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'ReadCommitted',
      maxWait: 2000,
      timeout: 5000,
    });
  });

  it('rejects invalid timeout configuration', () => {
    const host: PrismaTransactionHost<Client> = {
      $transaction: async () => {
        throw new Error();
      },
    };
    expect(() => new PrismaTransactionDriver(host, { maxWait: 0, timeout: 5000 })).toThrow(
      RangeError,
    );
    expect(() => new PrismaTransactionDriver(host, { maxWait: 2000, timeout: NaN })).toThrow(
      RangeError,
    );
  });
});

describe('global lock plan (Word §4.4)', () => {
  const a = '00000000-0000-4000-8000-00000000000a';
  const b = '00000000-0000-4000-8000-00000000000b';
  it('normalizes and deduplicates UUIDs and orders table groups before IDs', () => {
    expect(
      planLocks([
        { table: 'cv_version', id: a },
        { table: 'user_account', id: b },
        { table: 'interview', id: a },
        { table: 'user_account', id: a.toUpperCase() },
        { table: 'company', id: b },
        { table: 'user_account', id: a },
      ]),
    ).toEqual([
      { table: 'user_account', id: a },
      { table: 'user_account', id: b },
      { table: 'company', id: b },
      { table: 'interview', id: a },
      { table: 'cv_version', id: a },
    ]);
  });
  it('rejects invalid IDs/table names before any adapter could interpolate them into SQL', () => {
    expect(() => planLocks([{ table: 'company', id: "'; DROP TABLE company" }])).toThrow(TypeError);
    expect(() => planLocks([{ table: 'unknown' as 'company', id: a }])).toThrow(TypeError);
    expect(planLocks([])).toEqual([]);
  });
});
