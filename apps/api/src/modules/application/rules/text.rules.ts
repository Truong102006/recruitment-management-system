import { ApplicationRuleError } from './application-rule.error';

/** BR18: ordinary text is trimmed, NFC-normalized, then counted by code point. */
export function normalizeRequiredText(value: unknown, maxCodePoints?: number): string {
  if (typeof value !== 'string') {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Required text is missing');
  }
  const normalized = value.trim().normalize('NFC');
  if (!normalized || (maxCodePoints !== undefined && [...normalized].length > maxCodePoints)) {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Required text has invalid length');
  }
  return normalized;
}
