import { PasswordRules } from '../rules/password.rules';
import { EmailRules } from '../rules/email.rules';
import { TokenRules } from '../rules/token.rules';
import { SessionRules } from '../rules/session.rules';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

describe('Identity Rules (Phase 3)', () => {
  describe('PasswordRules', () => {
    it('accepts passwords with >= 10 characters and <= 72 bytes', () => {
      expect(() => PasswordRules.validate('1234567890')).not.toThrow();
      expect(() => PasswordRules.validate('P@ssword12345!')).not.toThrow();
    });

    it('rejects passwords with < 10 characters', () => {
      expect(() => PasswordRules.validate('123456789')).toThrow(ValidationError);
      expect(() => PasswordRules.validate('')).toThrow(ValidationError);
    });

    it('rejects passwords exceeding 72 UTF-8 bytes', () => {
      // 73 ASCII characters
      const tooLong = 'a'.repeat(73);
      expect(() => PasswordRules.validate(tooLong)).toThrow(ValidationError);

      // Multibyte characters: e.g. Vietnamese accented character 'ễ' is 3 bytes in UTF-8
      // 25 * 3 = 75 bytes
      const multiByteTooLong = 'ễ'.repeat(25);
      expect(() => PasswordRules.validate(multiByteTooLong)).toThrow(ValidationError);
    });

    it('accepts multibyte passwords under 72 bytes with >= 10 characters', () => {
      // 'TiếngViệt123' has 12 code points, 15 bytes UTF-8
      expect(() => PasswordRules.validate('TiếngViệt123')).not.toThrow();
    });
  });

  describe('EmailRules', () => {
    it('normalizes email by trimming and lowercasing', () => {
      expect(EmailRules.normalize('  Alice@Example.COM ')).toBe('alice@example.com');
    });

    it('preserves dots and plus tags in email', () => {
      expect(EmailRules.normalize('john.doe+work@company.org')).toBe('john.doe+work@company.org');
    });

    it('rejects invalid email formats', () => {
      expect(() => EmailRules.normalize('invalid-email')).toThrow(ValidationError);
      expect(() => EmailRules.normalize('alice@')).toThrow(ValidationError);
      expect(() => EmailRules.normalize('@domain.com')).toThrow(ValidationError);
    });
  });

  describe('TokenRules', () => {
    it('generates 64-hex-char (32-byte) raw tokens and sha256 hashes', () => {
      const raw = TokenRules.generateRawToken();
      expect(raw).toHaveLength(64);
      const hash = TokenRules.hashToken(raw);
      expect(hash).toHaveLength(64);
      expect(hash).not.toBe(raw);
    });

    it('returns appropriate TTL for purposes', () => {
      expect(TokenRules.getTtlMs('VERIFY_EMAIL')).toBe(24 * 3600 * 1000);
      expect(TokenRules.getTtlMs('RESET_PASSWORD')).toBe(30 * 60 * 1000);
    });

    it('compares hashes using timingSafeEqual', () => {
      const h1 = TokenRules.hashToken('test1');
      const h2 = TokenRules.hashToken('test1');
      const h3 = TokenRules.hashToken('test2');
      expect(TokenRules.safeCompare(h1, h2)).toBe(true);
      expect(TokenRules.safeCompare(h1, h3)).toBe(false);
    });
  });

  describe('SessionRules', () => {
    it('validates unrevoked, unexpired session within idle timeout', () => {
      const now = new Date('2026-10-22T12:00:00Z');
      const validSession = {
        expiresAt: new Date('2026-10-23T12:00:00Z'),
        lastSeenAt: new Date('2026-10-22T11:30:00Z'),
        revokedAt: null,
      };
      expect(SessionRules.isSessionValid(validSession, now)).toBe(true);
    });

    it('rejects revoked sessions', () => {
      const now = new Date('2026-10-22T12:00:00Z');
      const revokedSession = {
        expiresAt: new Date('2026-10-23T12:00:00Z'),
        lastSeenAt: new Date('2026-10-22T11:30:00Z'),
        revokedAt: new Date('2026-10-22T11:45:00Z'),
      };
      expect(SessionRules.isSessionValid(revokedSession, now)).toBe(false);
    });

    it('rejects expired sessions', () => {
      const now = new Date('2026-10-23T13:00:00Z');
      const expiredSession = {
        expiresAt: new Date('2026-10-23T12:00:00Z'),
        lastSeenAt: new Date('2026-10-23T11:30:00Z'),
        revokedAt: null,
      };
      expect(SessionRules.isSessionValid(expiredSession, now)).toBe(false);
    });

    it('rejects idle sessions exceeding 2 hours', () => {
      const now = new Date('2026-10-22T15:00:00Z');
      const idleSession = {
        expiresAt: new Date('2026-10-23T12:00:00Z'),
        lastSeenAt: new Date('2026-10-22T12:00:00Z'), // 3 hours ago
        revokedAt: null,
      };
      expect(SessionRules.isSessionValid(idleSession, now)).toBe(false);
    });

    it('verifies CSRF token matching hash', () => {
      const csrf = SessionRules.generateCsrfToken();
      const hash = SessionRules.hash(csrf);
      expect(SessionRules.verifyCsrf(csrf, hash)).toBe(true);
      expect(SessionRules.verifyCsrf('wrong_csrf', hash)).toBe(false);
    });
  });
});
