import { Injectable } from '@nestjs/common';
import { RateLimitExceededError } from '../../../../../libs/platform/errors/domain.error';

interface RateLimitRecord {
  timestamps: number[];
}

@Injectable()
export class RateLimiterService {
  private readonly storage = new Map<string, RateLimitRecord>();
  private readonly maxEntries = 10_000;

  checkRateLimit(key: string, limit: number, windowSeconds: number): void {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    const cutoff = now - windowMs;

    let record = this.storage.get(key);
    if (!record) {
      if (this.storage.size >= this.maxEntries) {
        this.prune(now);
      }
      record = { timestamps: [] };
      this.storage.set(key, record);
    }

    // Filter out timestamps outside current window
    record.timestamps = record.timestamps.filter((ts) => ts > cutoff);

    if (record.timestamps.length >= limit) {
      const oldest = record.timestamps[0] ?? now;
      const retryAfter = Math.ceil((oldest + windowMs - now) / 1000);
      throw new RateLimitExceededError(
        `Too many requests. Please try again in ${retryAfter} seconds.`,
      );
    }

    record.timestamps.push(now);
  }

  private prune(now: number): void {
    for (const [key, record] of this.storage.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > now - 3600_000);
      if (record.timestamps.length === 0) {
        this.storage.delete(key);
      }
    }
  }

  clear(): void {
    this.storage.clear();
  }
}
