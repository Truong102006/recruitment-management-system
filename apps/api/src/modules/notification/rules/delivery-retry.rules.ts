export class DeliveryRetryRules {
  private static readonly BACKOFF_SECONDS = [10, 30, 120, 300, 900];
  static readonly MAX_ATTEMPTS = 6;

  static calculateNextRetry(attemptCount: number, now = new Date()): Date | null {
    if (attemptCount >= this.MAX_ATTEMPTS) {
      return null;
    }

    const index = Math.min(attemptCount - 1, this.BACKOFF_SECONDS.length - 1);
    const baseSeconds = this.BACKOFF_SECONDS[Math.max(0, index)] ?? 10;
    // Add jitter up to 20%
    const jitter = Math.floor(Math.random() * (baseSeconds * 0.2));
    const delayMs = (baseSeconds + jitter) * 1000;

    return new Date(now.getTime() + delayMs);
  }
}
