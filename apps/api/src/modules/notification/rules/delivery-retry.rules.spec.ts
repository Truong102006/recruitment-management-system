import { DeliveryRetryRules } from './delivery-retry.rules';

describe('DeliveryRetryRules', () => {
  const refTime = new Date('2026-10-25T12:00:00Z');

  it('returns null when attemptCount >= MAX_ATTEMPTS (6)', () => {
    expect(DeliveryRetryRules.calculateNextRetry(6, refTime)).toBeNull();
    expect(DeliveryRetryRules.calculateNextRetry(7, refTime)).toBeNull();
  });

  it('calculates future retry date for attempts 1 to 5', () => {
    for (let attempt = 1; attempt <= 5; attempt++) {
      const next = DeliveryRetryRules.calculateNextRetry(attempt, refTime);
      expect(next).not.toBeNull();
      expect(next!.getTime()).toBeGreaterThan(refTime.getTime());
    }
  });

  it('uses default 10 seconds for attempt 0 or negative', () => {
    const next = DeliveryRetryRules.calculateNextRetry(0, refTime);
    expect(next).not.toBeNull();
    expect(next!.getTime()).toBeGreaterThanOrEqual(refTime.getTime() + 10000);
  });
});
