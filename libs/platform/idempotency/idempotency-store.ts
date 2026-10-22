import type { TransactionContext } from '../database/unit-of-work';

export interface IdempotencyRequest {
  readonly userId: string;
  readonly operation: string;
  readonly key: string; // 1..100 characters, supplied once per logical command
  readonly requestHash: string; // normalized DTO AND target resource, not payload alone
}

export type IdempotencyClaim =
  | { readonly kind: 'claimed' }
  | { readonly kind: 'replay'; readonly resourceId: string; readonly responseCode: number }
  | { readonly kind: 'conflict' }
  | { readonly kind: 'in_progress'; readonly retryAfterSeconds: number };

export const IDEMPOTENCY_STORE = Symbol.for('rms.platform.IdempotencyStore.v1');

/**
 * Adapter owned by BE2, implemented with the business migrations later.
 * Scope is UNIQUE(user_id, operation, key). claim + complete + business writes
 * use the SAME tx; retain >=24h; replay requires current authorization first.
 * Persist resource identity/status only, never a signed URL, token, or raw response.
 */
export interface IdempotencyStore {
  claim(request: IdempotencyRequest, tx: TransactionContext): Promise<IdempotencyClaim>;
  complete(
    request: IdempotencyRequest,
    result: { readonly resourceId: string; readonly responseCode: number },
    tx: TransactionContext,
  ): Promise<void>;
}
