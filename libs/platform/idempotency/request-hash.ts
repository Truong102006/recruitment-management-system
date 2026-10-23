import { createHash } from 'node:crypto';

function canonicalJson(value: unknown, ancestors = new Set<object>()): string {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') {
    return JSON.stringify(value);
  }
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (typeof value !== 'object' || value === null) {
    throw new TypeError(
      'Hash input must be validated JSON without undefined or non-finite numbers',
    );
  }
  if (ancestors.has(value)) throw new TypeError('Circular hash input');
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      return `[${Array.from(value, (item) => canonicalJson(item, ancestors)).join(',')}]`;
    }
    if (
      Object.getPrototypeOf(value) !== Object.prototype &&
      Object.getPrototypeOf(value) !== null
    ) {
      throw new TypeError('Hash input must contain plain JSON objects');
    }
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(record[key], ancestors)}`)
      .join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

/** Normalize/validate the DTO first; never silently trim passwords or reorder arrays here. */
export function hashRequest(operation: string, target: string, normalizedPayload: unknown): string {
  return createHash('sha256')
    .update(canonicalJson({ operation, target, payload: normalizedPayload }))
    .digest('hex');
}
