import { Inject, Injectable } from '@nestjs/common';
import { createHmac, randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaUserRepository, UserWithRoles } from '../repositories/prisma-user.repository';
import {
  PrismaSessionRepository,
  SessionWithUser,
} from '../repositories/prisma-session.repository';
import { EmailRules } from '../rules/email.rules';
import { SessionRules } from '../rules/session.rules';
import { RateLimiterService } from '../../../common/services/rate-limiter.service';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { Prisma } from '@prisma/client';
import { UnauthorizedError } from '../../../../../../libs/platform/errors/domain.error';
import { Actor } from '../../../../../../libs/contracts/backend';
import { LoginDto } from '../dto/auth.dto';
import { ISessionService, ValidatedSession } from '../../../common/guards/session.guard';

// Standard dummy hash for constant-time comparison when email not found
const DUMMY_HASH = '$2a$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUU0123456789.';

@Injectable()
export class SessionService implements ISessionService {
  private readonly csrfSecret: string;

  constructor(
    private readonly userRepo: PrismaUserRepository,
    private readonly sessionRepo: PrismaSessionRepository,
    private readonly rateLimiter: RateLimiterService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
  ) {
    this.csrfSecret = process.env.CSRF_SECRET || 'default_csrf_secret_key_32_bytes_long_12345';
  }

  deriveCsrfToken(sessionId: string): string {
    return createHmac('sha256', this.csrfSecret).update(sessionId).digest('hex');
  }

  async login(
    dto: LoginDto,
    ip: string = '127.0.0.1',
  ): Promise<{ user: UserWithRoles; sessionToken: string; csrfToken: string }> {
    const normalizedEmail = EmailRules.normalize(dto.email);

    // Rate limit login attempts: 5 per 60s per IP+email
    this.rateLimiter.checkRateLimit(`login:${ip}:${normalizedEmail}`, 5, 60);

    // 1. Initial lookup outside Tx
    const initialUser = await this.userRepo.findByEmail(normalizedEmail);
    const hashToCompare = initialUser ? initialUser.passwordHash : DUMMY_HASH;

    // 2. BCrypt compare outside Tx (CPU heavy)
    const passwordValid = await bcrypt.compare(dto.password, hashToCompare);
    if (!initialUser || !passwordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // 3. UoW: Lock user row, recheck state and create session
    return this.uow.run(async (tx) => {
      const lockedUser = await this.userRepo.findByEmailWithLock(normalizedEmail, tx);
      if (!lockedUser) {
        throw new UnauthorizedError('Invalid email or password');
      }

      if (lockedUser.status !== 'ACTIVE') {
        throw new UnauthorizedError(lockedUser.lockedReason || 'Account is locked');
      }

      if (lockedUser.passwordHash !== initialUser.passwordHash) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const rawSessionToken = SessionRules.generateSessionToken();
      const tokenHash = SessionRules.hash(rawSessionToken);

      const sessionId = randomUUID();
      const csrfToken = this.deriveCsrfToken(sessionId);
      const csrfHash = SessionRules.hash(csrfToken);

      const now = new Date();
      const expiresAt = new Date(now.getTime() + SessionRules.ABSOLUTE_TTL_MS);

      await this.sessionRepo.create(
        {
          id: sessionId,
          userId: lockedUser.id,
          tokenHash,
          csrfHash,
          expiresAt,
          lastSeenAt: now,
        },
        tx,
      );

      return {
        user: lockedUser,
        sessionToken: rawSessionToken,
        csrfToken,
      };
    });
  }

  async validateSession(
    rawSessionToken: string,
  ): Promise<{ actor: Actor; session: SessionWithUser; csrfToken: string } | null> {
    if (!rawSessionToken) {
      return null;
    }

    const tokenHash = SessionRules.hash(rawSessionToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);
    if (!session) {
      return null;
    }

    const now = new Date();
    if (!SessionRules.isSessionValid(session, now)) {
      return null;
    }

    if (session.user.status !== 'ACTIVE') {
      return null;
    }

    // Update lastSeenAt if > 60s passed
    if (now.getTime() - session.lastSeenAt.getTime() > 60_000) {
      await this.sessionRepo.updateLastSeen(session.id, now).catch(() => {});
    }

    const csrfToken = this.deriveCsrfToken(session.id);
    const actor: Actor = {
      userId: session.user.id,
      sessionId: session.id,
      roles: session.user.roles.map((r) => r.role as Actor['roles'][number]),
    };

    return { actor, session, csrfToken };
  }

  async validateSessionToken(rawSessionToken: string): Promise<ValidatedSession | null> {
    const validated = await this.validateSession(rawSessionToken);
    if (!validated) {
      return null;
    }
    return {
      sessionId: validated.session.id,
      userId: validated.session.user.id,
      roles: validated.session.user.roles.map((r) => r.role as Actor['roles'][number]),
      csrfHash: validated.session.csrfHash,
      csrfToken: validated.csrfToken,
    };
  }

  async logout(rawSessionToken: string): Promise<void> {
    if (!rawSessionToken) {
      return;
    }
    const tokenHash = SessionRules.hash(rawSessionToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);
    if (session) {
      await this.sessionRepo.revokeById(session.id, new Date());
    }
  }

  async getSessionInfo(rawSessionToken: string) {
    const validated = await this.validateSession(rawSessionToken);
    if (!validated) {
      throw new UnauthorizedError('Session is invalid or expired');
    }

    const { session, csrfToken } = validated;
    return {
      userId: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      roles: session.user.roles.map((r) => r.role),
      status: session.user.status,
      csrfToken,
    };
  }
}
