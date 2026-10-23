import { randomUUID } from 'node:crypto';
import type { TransactionContext } from '../database/unit-of-work';
import { TransactionSql } from '../database/sql-client';
import type { IdempotencyClaim, IdempotencyRequest, IdempotencyStore } from './idempotency-store';

interface ClaimedRow {
  id: string;
}
interface ExistingRow {
  request_hash: string;
  status: 'PROCESSING' | 'COMPLETED';
  resource_id: string | null;
  response_code: number | null;
}

export class IdempotencyError extends Error {
  constructor(
    readonly code: 'INVALID_REQUEST' | 'CLAIM_LOST' | 'KEY_CONFLICT' | 'REQUEST_IN_PROGRESS',
  ) {
    super(code);
    this.name = 'IdempotencyError';
  }
}

function validateRequest(request: IdempotencyRequest): void {
  if (
    !request.userId ||
    !request.operation.trim() ||
    request.operation.length > 80 ||
    !request.key ||
    request.key.length > 100 ||
    !/^[0-9a-f]{64}$/.test(request.requestHash)
  ) {
    throw new IdempotencyError('INVALID_REQUEST');
  }
}

/** A claim and its business writes must commit through the same TransactionContext. */
export class SqlIdempotencyStore implements IdempotencyStore {
  constructor(private readonly sql: TransactionSql) {}

  async claim(request: IdempotencyRequest, tx: TransactionContext): Promise<IdempotencyClaim> {
    validateRequest(request);
    const inserted = await this.sql.query<ClaimedRow>(
      tx,
      `INSERT INTO idempotency_record
        (id, user_id, operation, key, request_hash, status, created_at, expires_at)
       VALUES ($1::uuid, $2::uuid, $3, $4, $5, 'PROCESSING', clock_timestamp(),
               clock_timestamp() + interval '24 hours')
       ON CONFLICT (user_id, operation, key) DO NOTHING
       RETURNING id`,
      [randomUUID(), request.userId, request.operation, request.key, request.requestHash],
    );
    if (inserted.length === 1) return { kind: 'claimed' };

    const existing = await this.sql.query<ExistingRow>(
      tx,
      `SELECT request_hash, status, resource_id, response_code
       FROM idempotency_record
       WHERE user_id = $1::uuid AND operation = $2 AND key = $3`,
      [request.userId, request.operation, request.key],
    );
    const row = existing[0];
    if (!row) throw new IdempotencyError('CLAIM_LOST');
    if (row.request_hash !== request.requestHash) return { kind: 'conflict' };
    if (row.status === 'PROCESSING') return { kind: 'in_progress', retryAfterSeconds: 1 };
    if (row.status === 'COMPLETED' && row.resource_id && row.response_code !== null) {
      return { kind: 'replay', resourceId: row.resource_id, responseCode: row.response_code };
    }
    throw new IdempotencyError('CLAIM_LOST');
  }

  async complete(
    request: IdempotencyRequest,
    result: { readonly resourceId: string; readonly responseCode: number },
    tx: TransactionContext,
  ): Promise<void> {
    validateRequest(request);
    if (
      !result.resourceId ||
      !Number.isInteger(result.responseCode) ||
      result.responseCode < 200 ||
      result.responseCode > 299
    ) {
      throw new IdempotencyError('INVALID_REQUEST');
    }
    const updated = await this.sql.query<ClaimedRow>(
      tx,
      `UPDATE idempotency_record
       SET status = 'COMPLETED', resource_id = $5::uuid, response_code = $6,
           completed_at = clock_timestamp()
       WHERE user_id = $1::uuid AND operation = $2 AND key = $3
         AND request_hash = $4 AND status = 'PROCESSING'
       RETURNING id`,
      [
        request.userId,
        request.operation,
        request.key,
        request.requestHash,
        result.resourceId,
        result.responseCode,
      ],
    );
    if (updated.length !== 1) throw new IdempotencyError('CLAIM_LOST');
  }
}
