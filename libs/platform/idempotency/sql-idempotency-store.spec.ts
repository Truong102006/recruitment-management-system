import { TransactionSql } from '../database/sql-client';
import { SqlIdempotencyStore } from './sql-idempotency-store';
import type { TransactionContext } from '../database/unit-of-work';

const tx = { id: 'test-tx' } as TransactionContext;
const request = {
  userId: '00000000-0000-4000-8000-000000000001',
  operation: 'application.submit',
  key: 'same-intent',
  requestHash: 'a'.repeat(64),
};

describe('SQL idempotency adapter', () => {
  it('claims with bind parameters and completes the same scoped/hash row', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([{ id: 'claim-id' }])
      .mockResolvedValueOnce([{ id: 'claim-id' }]);
    const store = new SqlIdempotencyStore({ query } as unknown as TransactionSql);
    expect(await store.claim(request, tx)).toEqual({ kind: 'claimed' });
    await store.complete(
      request,
      {
        resourceId: '00000000-0000-4000-8000-000000000002',
        responseCode: 201,
      },
      tx,
    );
    expect(query).toHaveBeenCalledTimes(2);
    expect(query.mock.calls[0]?.[2]).toEqual(
      expect.arrayContaining([request.userId, request.operation, request.key, request.requestHash]),
    );
    expect(query.mock.calls[1]?.[1]).toContain('request_hash = $4');
    expect(query.mock.calls[1]?.[2]).toEqual([
      request.userId,
      request.operation,
      request.key,
      request.requestHash,
      '00000000-0000-4000-8000-000000000002',
      201,
    ]);
  });

  it('replays completed matching request and rejects another payload', async () => {
    const row = {
      request_hash: request.requestHash,
      status: 'COMPLETED',
      resource_id: 'existing-id',
      response_code: 201,
    };
    const query = jest
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([row])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ ...row, request_hash: 'b'.repeat(64) }]);
    const store = new SqlIdempotencyStore({ query } as unknown as TransactionSql);
    expect(await store.claim(request, tx)).toEqual({
      kind: 'replay',
      resourceId: 'existing-id',
      responseCode: 201,
    });
    expect(await store.claim(request, tx)).toEqual({ kind: 'conflict' });
  });

  it('does not report completion if the claimed row is gone', async () => {
    const query = jest.fn().mockResolvedValue([]);
    const store = new SqlIdempotencyStore({ query } as unknown as TransactionSql);
    await expect(
      store.complete(
        request,
        {
          resourceId: '00000000-0000-4000-8000-000000000002',
          responseCode: 201,
        },
        tx,
      ),
    ).rejects.toMatchObject({ code: 'CLAIM_LOST' });
  });
});
