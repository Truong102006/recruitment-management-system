import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

export type AuthTokenPurpose = 'VERIFY_EMAIL' | 'RESET_PASSWORD';

export class TokenRules {
  static readonly VERIFY_EMAIL_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
  static readonly RESET_PASSWORD_TTL_MS = 30 * 60 * 1000; // 30 minutes

  static generateRawToken(): string {
    return randomBytes(32).toString('hex');
  }

  static hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken, 'utf8').digest('hex');
  }

  static getTtlMs(purpose: AuthTokenPurpose): number {
    switch (purpose) {
      case 'VERIFY_EMAIL':
        return this.VERIFY_EMAIL_TTL_MS;
      case 'RESET_PASSWORD':
        return this.RESET_PASSWORD_TTL_MS;
      default:
        throw new Error(`Unknown token purpose: ${purpose}`);
    }
  }

  static safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
