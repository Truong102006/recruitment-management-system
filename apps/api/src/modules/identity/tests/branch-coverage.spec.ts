import { AuthTokenService } from '../services/auth-token.service';
import { SessionService } from '../services/session.service';
import { RateLimiterService } from '../../../common/services/rate-limiter.service';
import {
  ValidationError,
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  RateLimitExceededError,
} from '../../../../../../libs/platform/errors/domain.error';
import * as bcrypt from 'bcryptjs';

describe('Branch Coverage Edge Cases (Phase 3)', () => {
  let rateLimiter: RateLimiterService;
  const mockUow: any = {
    run: jest.fn(async (callback) => callback({ id: 'dummy-tx-id' })),
    clientFor: jest.fn(() => ({})),
  };

  beforeEach(() => {
    rateLimiter = new RateLimiterService();
  });

  describe('Domain Errors instantiation', () => {
    it('instantiates all domain error types', () => {
      expect(new ValidationError('msg', { field: ['error'] }).code).toBe('VALIDATION_FAILED');
      expect(new UnauthorizedError('msg', 'CUSTOM_AUTH').code).toBe('CUSTOM_AUTH');
      expect(new ForbiddenError('msg', 'CUSTOM_FORBIDDEN').code).toBe('CUSTOM_FORBIDDEN');
      expect(new NotFoundError('msg', 'CUSTOM_NOT_FOUND').code).toBe('CUSTOM_NOT_FOUND');
      expect(new ConflictError('msg', 'CUSTOM_CONFLICT').code).toBe('CUSTOM_CONFLICT');
      expect(new RateLimitExceededError('msg', 'CUSTOM_RATE').code).toBe('CUSTOM_RATE');
    });
  });

  describe('AuthTokenService edge branches', () => {
    it('throws ValidationError when token is missing in verifyEmail or resetPassword', async () => {
      const service = new AuthTokenService({} as any, {} as any, {} as any, rateLimiter, mockUow, {
        append: jest.fn().mockResolvedValue(undefined),
      });
      await expect(service.verifyEmail('')).rejects.toThrow(ValidationError);
      await expect(service.resetPassword('', 'ValidPassword123!')).rejects.toThrow(ValidationError);
    });

    it('throws ConflictError when verifyEmail user is locked or not found', async () => {
      const mockTokenRepo: any = {
        findByHash: jest.fn().mockResolvedValue({ id: 'tok-1', userId: 'usr-1' }),
        consumeAtomic: jest.fn().mockResolvedValue(true),
      };
      const mockUserRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'usr-1', status: 'LOCKED' }),
      };
      const service = new AuthTokenService(
        mockUserRepo,
        mockTokenRepo,
        {} as any,
        rateLimiter,
        mockUow,
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      await expect(service.verifyEmail('raw-token')).rejects.toThrow(ConflictError);
    });

    it('throws ConflictError when resetPassword token is not found or user is locked', async () => {
      const mockTokenRepo: any = {
        findByHash: jest.fn().mockResolvedValue(null),
      };
      const service = new AuthTokenService(
        {} as any,
        mockTokenRepo,
        {} as any,
        rateLimiter,
        mockUow,
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      await expect(service.resetPassword('unknown-tok', 'NewValidPass123!')).rejects.toThrow(
        ConflictError,
      );

      mockTokenRepo.findByHash = jest.fn().mockResolvedValue({ id: 'tok-1', userId: 'usr-1' });
      mockTokenRepo.consumeAtomic = jest.fn().mockResolvedValue(true);
      const mockUserRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue(null), // user not found
      };
      const service2 = new AuthTokenService(
        mockUserRepo,
        mockTokenRepo,
        {} as any,
        rateLimiter,
        mockUow,
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      await expect(service2.resetPassword('tok-1', 'NewValidPass123!')).rejects.toThrow(
        ConflictError,
      );
    });

    it('returns empty object silently when user is not found or inactive in resend/forgot', async () => {
      const mockUserRepo: any = {
        findByEmailWithLock: jest.fn().mockResolvedValue(null),
      };
      const service = new AuthTokenService(
        mockUserRepo,
        {} as any,
        {} as any,
        rateLimiter,
        mockUow,
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      expect(await service.resendVerification('unknown@example.com')).toEqual({});
      expect(await service.forgotPassword('unknown@example.com')).toEqual({});
    });
  });

  describe('SessionService edge branches', () => {
    it('throws UnauthorizedError when locked user password hash changes concurrently', async () => {
      const hash1 = await bcrypt.hash('pass1', 10);
      const hash2 = await bcrypt.hash('pass2', 10);
      const mockUserRepo: any = {
        findByEmail: jest.fn().mockResolvedValue({ email: 'u@e.com', passwordHash: hash1 }),
        findByEmailWithLock: jest
          .fn()
          .mockResolvedValue({ email: 'u@e.com', status: 'ACTIVE', passwordHash: hash2 }),
      };
      const service = new SessionService(mockUserRepo, {} as any, rateLimiter, mockUow);
      await expect(service.login({ email: 'u@e.com', password: 'pass1' })).rejects.toThrow(
        UnauthorizedError,
      );
    });

    it('returns null when validating expired or locked user session', async () => {
      const now = new Date();
      const expiredSession = {
        id: 'sess-1',
        expiresAt: new Date(now.getTime() - 1000), // expired
        lastSeenAt: now,
        revokedAt: null,
        user: { status: 'ACTIVE', roles: [] },
      };
      const mockSessionRepo: any = {
        findByTokenHash: jest.fn().mockResolvedValue(expiredSession),
      };
      const service = new SessionService({} as any, mockSessionRepo, rateLimiter, mockUow);
      expect(await service.validateSession('raw-tok')).toBeNull();

      const lockedUserSession = {
        id: 'sess-2',
        expiresAt: new Date(now.getTime() + 100000),
        lastSeenAt: now,
        revokedAt: null,
        user: { status: 'LOCKED', roles: [] },
      };
      mockSessionRepo.findByTokenHash = jest.fn().mockResolvedValue(lockedUserSession);
      expect(await service.validateSession('raw-tok-2')).toBeNull();
    });

    it('throws UnauthorizedError in getSessionInfo when token is invalid', async () => {
      const mockSessionRepo: any = {
        findByTokenHash: jest.fn().mockResolvedValue(null),
      };
      const service = new SessionService({} as any, mockSessionRepo, rateLimiter, mockUow);
      await expect(service.getSessionInfo('invalid-tok')).rejects.toThrow(UnauthorizedError);
    });
  });
});
