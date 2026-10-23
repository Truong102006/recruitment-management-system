import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export class SessionRules {
  static readonly ABSOLUTE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  static readonly IDLE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

  static generateSessionToken(): string {
    return randomBytes(32).toString('hex');
  }

  static generateCsrfToken(): string {
    return randomBytes(32).toString('hex');
  }

  static hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  static isSessionValid(
    session: {
      expiresAt: Date;
      lastSeenAt: Date;
      revokedAt: Date | null;
    },
    now: Date = new Date(),
  ): boolean {
    if (session.revokedAt !== null) {
      return false;
    }
    if (now.getTime() >= session.expiresAt.getTime()) {
      return false;
    }
    const idleTime = now.getTime() - session.lastSeenAt.getTime();
    if (idleTime > this.IDLE_TTL_MS) {
      return false;
    }
    return true;
  }

  static verifyCsrf(providedCsrfToken: string, storedCsrfHash: string): boolean {
    const computedHash = this.hash(providedCsrfToken);
    const bufA = Buffer.from(computedHash, 'utf8');
    const bufB = Buffer.from(storedCsrfHash, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
