import { RegisterService } from '../services/register.service';
import { SessionService } from '../services/session.service';
import { AuthTokenService } from '../services/auth-token.service';
import { RateLimiterService } from '../../../common/services/rate-limiter.service';
import {
  UnauthorizedError,
  ConflictError,
} from '../../../../../../libs/platform/errors/domain.error';
import * as bcrypt from 'bcryptjs';

describe('Identity Services Unit Tests (Phase 3)', () => {
  let rateLimiter: RateLimiterService;

  beforeEach(() => {
    rateLimiter = new RateLimiterService();
  });

  const mockUow: any = {
    run: jest.fn(async (callback) => callback({ id: 'dummy-tx-id' })),
    clientFor: jest.fn(() => ({})),
  };

  describe('RegisterService', () => {
    it('registers candidate user and calls ports if provided', async () => {
      const mockUserRepo: any = {
        findByEmailWithLock: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'user-uuid-1',
          email: 'new_cand@example.com',
          fullName: 'New Cand',
          status: 'ACTIVE',
          version: 0,
          roles: [{ role: 'CANDIDATE' }],
        }),
      };
      const mockTokenRepo: any = {
        create: jest.fn().mockResolvedValue({
          id: 'token-uuid-1',
          purpose: 'VERIFY_EMAIL',
        }),
      };
      const mockCandidateProfilePort: any = {
        ensureForCandidate: jest.fn().mockResolvedValue(undefined),
      };
      const mockOutboxPort: any = {
        append: jest.fn().mockResolvedValue(undefined),
      };

      const service = new RegisterService(
        mockUserRepo,
        mockTokenRepo,
        rateLimiter,
        mockUow,
        mockCandidateProfilePort,
        mockOutboxPort,
      );

      const result = await service.register({
        email: 'new_cand@example.com',
        password: 'ValidPassword123!',
        fullName: 'New Cand',
      });

      expect(result.duplicate).toBe(false);
      if (!result.duplicate) {
        expect(result.user.userId).toBe('user-uuid-1');
        expect(result.user.roles).toEqual(['CANDIDATE']);
      }
      expect(mockCandidateProfilePort.ensureForCandidate).toHaveBeenCalledWith(
        'user-uuid-1',
        expect.anything(),
      );
      expect(mockOutboxPort.append).toHaveBeenCalled();
    });

    it('registers recruiter user with RECRUITER role', async () => {
      const mockUserRepo: any = {
        findByEmailWithLock: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({
          id: 'recruiter-uuid',
          email: 'recruiter@example.com',
          fullName: 'Recruiter User',
          status: 'ACTIVE',
          version: 0,
          roles: [{ role: 'CANDIDATE' }, { role: 'RECRUITER' }],
        }),
      };
      const mockTokenRepo: any = {
        create: jest.fn().mockResolvedValue({ id: 'token-uuid', purpose: 'VERIFY_EMAIL' }),
      };

      const service = new RegisterService(
        mockUserRepo,
        mockTokenRepo,
        rateLimiter,
        mockUow,
        {
          ensureForCandidate: jest.fn().mockResolvedValue(undefined),
          getSubmissionSnapshot: jest.fn(),
        },
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      const result = await service.register({
        email: 'recruiter@example.com',
        password: 'ValidPassword123!',
        fullName: 'Recruiter User',
        role: 'RECRUITER',
      });

      expect(result.duplicate).toBe(false);
      if (!result.duplicate) {
        expect(result.user.roles).toContain('RECRUITER');
      }
    });

    it('returns duplicate: true when email exists under lock', async () => {
      const mockUserRepo: any = {
        findByEmailWithLock: jest.fn().mockResolvedValue({ id: 'existing-id' }),
      };
      const mockTokenRepo: any = {};

      const service = new RegisterService(
        mockUserRepo,
        mockTokenRepo,
        rateLimiter,
        mockUow,
        {
          ensureForCandidate: jest.fn().mockResolvedValue(undefined),
          getSubmissionSnapshot: jest.fn(),
        },
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      const result = await service.register({
        email: 'existing@example.com',
        password: 'ValidPassword123!',
        fullName: 'Existing',
      });

      expect(result.duplicate).toBe(true);
    });
  });

  describe('SessionService', () => {
    it('authenticates user with valid password and creates session', async () => {
      const password = 'SecretPassword123!';
      const passwordHash = await bcrypt.hash(password, 10);
      const user = {
        id: 'usr-1',
        email: 'login@example.com',
        fullName: 'Login User',
        status: 'ACTIVE',
        passwordHash,
        roles: [{ role: 'CANDIDATE' }],
      };

      const mockUserRepo: any = {
        findByEmail: jest.fn().mockResolvedValue(user),
        findByEmailWithLock: jest.fn().mockResolvedValue(user),
      };
      const mockSessionRepo: any = {
        create: jest.fn().mockResolvedValue({ id: 'sess-1' }),
      };

      const service = new SessionService(mockUserRepo, mockSessionRepo, rateLimiter, mockUow);
      const res = await service.login({ email: 'login@example.com', password });
      expect(res.user.id).toBe('usr-1');
      expect(res.sessionToken).toBeDefined();
      expect(res.csrfToken).toBeDefined();
    });

    it('rejects login with wrong password with UnauthorizedError', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword!', 10);
      const user = {
        id: 'usr-1',
        email: 'login@example.com',
        status: 'ACTIVE',
        passwordHash,
        roles: [{ role: 'CANDIDATE' }],
      };

      const mockUserRepo: any = {
        findByEmail: jest.fn().mockResolvedValue(user),
      };
      const mockSessionRepo: any = {};

      const service = new SessionService(mockUserRepo, mockSessionRepo, rateLimiter, mockUow);
      await expect(
        service.login({ email: 'login@example.com', password: 'WrongPassword!' }),
      ).rejects.toThrow(UnauthorizedError);
    });

    it('rejects login for locked account with UnauthorizedError', async () => {
      const password = 'CorrectPassword!';
      const passwordHash = await bcrypt.hash(password, 10);
      const user = {
        id: 'usr-1',
        email: 'locked@example.com',
        status: 'LOCKED',
        lockedReason: 'Violation of Terms',
        passwordHash,
        roles: [{ role: 'CANDIDATE' }],
      };

      const mockUserRepo: any = {
        findByEmail: jest.fn().mockResolvedValue(user),
        findByEmailWithLock: jest.fn().mockResolvedValue(user),
      };
      const mockSessionRepo: any = {};

      const service = new SessionService(mockUserRepo, mockSessionRepo, rateLimiter, mockUow);
      await expect(service.login({ email: 'locked@example.com', password })).rejects.toThrow(
        /Violation of Terms/,
      );
    });

    it('validates active session, derives CSRF and gets session info', async () => {
      const now = new Date();
      const session = {
        id: 'sess-123',
        userId: 'usr-123',
        csrfHash: 'hash',
        expiresAt: new Date(now.getTime() + 24 * 3600 * 1000),
        lastSeenAt: now,
        revokedAt: null,
        user: {
          id: 'usr-123',
          email: 'user@example.com',
          fullName: 'Active User',
          status: 'ACTIVE',
          roles: [{ role: 'CANDIDATE' }],
        },
      };

      const rawToken = 'my_raw_session_token';
      const mockUserRepo: any = {};
      const mockSessionRepo: any = {
        findByTokenHash: jest.fn().mockResolvedValue(session),
        updateLastSeen: jest.fn().mockResolvedValue(session),
        revokeById: jest.fn().mockResolvedValue(undefined),
      };

      const service = new SessionService(mockUserRepo, mockSessionRepo, rateLimiter, mockUow);
      const res = await service.validateSession(rawToken);
      expect(res).not.toBeNull();
      expect(res?.actor.userId).toBe('usr-123');

      const info = await service.getSessionInfo(rawToken);
      expect(info.userId).toBe('usr-123');

      const validatedSession = await service.validateSessionToken(rawToken);
      expect(validatedSession?.sessionId).toBe('sess-123');

      await service.logout(rawToken);
      expect(mockSessionRepo.revokeById).toHaveBeenCalledWith('sess-123', expect.anything());
    });

    it('returns null for empty session token', async () => {
      const service = new SessionService({} as any, {} as any, rateLimiter, mockUow);
      expect(await service.validateSession('')).toBeNull();
      expect(await service.validateSessionToken('')).toBeNull();
    });
  });

  describe('AuthTokenService', () => {
    it('verifies email with CAS consume and active user check', async () => {
      const token = { id: 'tok-1', userId: 'usr-1', purpose: 'VERIFY_EMAIL' };
      const user = { id: 'usr-1', status: 'ACTIVE' };

      const mockUserRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue(user),
        markEmailVerified: jest.fn().mockResolvedValue(undefined),
      };
      const mockTokenRepo: any = {
        findByHash: jest.fn().mockResolvedValue(token),
        consumeAtomic: jest.fn().mockResolvedValue(true),
      };
      const mockSessionRepo: any = {};

      const service = new AuthTokenService(
        mockUserRepo,
        mockTokenRepo,
        mockSessionRepo,
        rateLimiter,
        mockUow,
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      await expect(service.verifyEmail('valid_raw_token')).resolves.not.toThrow();
    });

    it('rejects verifyEmail with ConflictError when token is already consumed', async () => {
      const mockUserRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue({ id: 'usr-1', status: 'ACTIVE' }),
      };
      const mockTokenRepo: any = {
        findByHash: jest.fn().mockResolvedValue({ id: 'tok-1' }),
        consumeAtomic: jest.fn().mockResolvedValue(false),
      };
      const mockSessionRepo: any = {};

      const service = new AuthTokenService(
        mockUserRepo,
        mockTokenRepo,
        mockSessionRepo,
        rateLimiter,
        mockUow,
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      await expect(service.verifyEmail('consumed_token')).rejects.toThrow(ConflictError);
    });

    it('handles resendVerification and forgotPassword emitting outbox events', async () => {
      const user = { id: 'usr-1', email: 'test@example.com', status: 'ACTIVE', version: 1 };
      const mockUserRepo: any = { findByEmailWithLock: jest.fn().mockResolvedValue(user) };
      const mockTokenRepo: any = {
        invalidateActiveForUser: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue({ id: 'tok-created' }),
      };
      const mockOutboxPort: any = { append: jest.fn().mockResolvedValue(undefined) };

      const service = new AuthTokenService(
        mockUserRepo,
        mockTokenRepo,
        {} as any,
        rateLimiter,
        mockUow,
        mockOutboxPort,
      );

      const resendRes = await service.resendVerification('test@example.com');
      expect(resendRes.rawToken).toBeDefined();
      expect(mockOutboxPort.append).toHaveBeenCalled();

      const forgotRes = await service.forgotPassword('test@example.com');
      expect(forgotRes.rawToken).toBeDefined();
    });

    it('resets password, updates password hash, and revokes all active sessions', async () => {
      const token = { id: 'reset-tok-1', userId: 'usr-1', purpose: 'RESET_PASSWORD' };
      const user = { id: 'usr-1', status: 'ACTIVE' };

      const mockUserRepo: any = {
        findByIdWithLock: jest.fn().mockResolvedValue(user),
        updatePasswordHash: jest.fn().mockResolvedValue(user),
      };
      const mockTokenRepo: any = {
        findByHash: jest.fn().mockResolvedValue(token),
        consumeAtomic: jest.fn().mockResolvedValue(true),
        invalidateActiveForUser: jest.fn().mockResolvedValue(1),
      };
      const mockSessionRepo: any = {
        revokeAllForUser: jest.fn().mockResolvedValue(3),
      };

      const service = new AuthTokenService(
        mockUserRepo,
        mockTokenRepo,
        mockSessionRepo,
        rateLimiter,
        mockUow,
        { append: jest.fn().mockResolvedValue(undefined) },
      );
      await service.resetPassword('raw_reset_tok', 'BrandNewPassword123!');
      expect(mockTokenRepo.consumeAtomic).toHaveBeenCalledWith(
        'reset-tok-1',
        expect.anything(),
        expect.anything(),
      );
      expect(mockUserRepo.updatePasswordHash).toHaveBeenCalled();
      expect(mockSessionRepo.revokeAllForUser).toHaveBeenCalledWith(
        'usr-1',
        expect.anything(),
        expect.anything(),
      );
    });
  });
});
