export type ApplicationRuleErrorCode =
  | 'VALIDATION_FAILED'
  | 'VERSION_CONFLICT'
  | 'STATE_CONFLICT'
  | 'ACTION_FORBIDDEN'
  | 'RESOURCE_NOT_FOUND';

/** HTTP mapping belongs to the API layer; domain rules never disclose private state. */
export class ApplicationRuleError extends Error {
  constructor(
    readonly code: ApplicationRuleErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'ApplicationRuleError';
  }
}

export function assertExpectedVersion(expected: number, actual: number): void {
  if (!Number.isSafeInteger(expected) || expected < 0) {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Version must be a non-negative integer');
  }
  if (!Number.isSafeInteger(actual) || actual < 0) {
    throw new ApplicationRuleError('STATE_CONFLICT', 'Stored version is invalid');
  }
  if (expected !== actual) {
    throw new ApplicationRuleError('VERSION_CONFLICT', 'Resource version has changed');
  }
}

export function nextVersion(actual: number): number {
  if (!Number.isSafeInteger(actual) || actual < 0 || actual === Number.MAX_SAFE_INTEGER) {
    throw new ApplicationRuleError('STATE_CONFLICT', 'Resource version cannot advance');
  }
  return actual + 1;
}
