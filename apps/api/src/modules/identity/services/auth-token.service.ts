import { ServiceUnavailableError } from '../../../../../../libs/platform/errors/domain.error';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';
import { PrismaAuthTokenRepository } from '../repositories/prisma-auth-token.repository';
import { PrismaSessionRepository } from '../repositories/prisma-session.repository';
import { EmailRules } from '../rules/email.rules';
import { PasswordRules } from '../rules/password.rules';
import { TokenRules } from '../rules/token.rules';
import { TokenEncryption } from '../../../../../../libs/platform/crypto/token-encryption';
import { RateLimiterService } from '../../../common/services/rate-limiter.service';
import {
  ManagedUnitOfWork,
  UNIT_OF_WORK,
} from '../../../../../../libs/platform/database/unit-of-work';
import { Prisma } from '@prisma/client';
import {
  ConflictError,
  ValidationError,
} from '../../../../../../libs/platform/errors/domain.error';
import { OutboxPort, PORTS } from '../../../../../../libs/contracts/backend';

@Injectable()
export class AuthTokenService {
  private readonly encryption: TokenEncryption;

  constructor(
    private readonly userRepo: PrismaUserRepository,
    private readonly tokenRepo: PrismaAuthTokenRepository,
    private readonly sessionRepo: PrismaSessionRepository,
    private readonly rateLimiter: RateLimiterService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    @Optional()
    @Inject(PORTS.outbox)
    private readonly outboxPort?: OutboxPort,
  ) {
    this.encryption = new TokenEncryption();
  }

  async verifyEmail(rawToken: string): Promise<void> {
    if (!rawToken) {
      throw new ValidationError('Token is required');
    }

    const tokenHash = TokenRules.hashToken(rawToken);
    const token = await this.tokenRepo.findByHash(tokenHash, 'VERIFY_EMAIL');
    if (!token) {
      throw new ConflictError('TOKEN_INVALID_OR_EXPIRED');
    }

    const now = new Date();
    await this.uow.run(async (tx) => {
      // Atomic CAS consumption
      const user = await this.userRepo.findByIdWithLock(token.userId, tx);
      if (!user || user.status !== 'ACTIVE') {
        throw new ConflictError('ACCOUNT_LOCKED_OR_UNAVAILABLE');
      }
      const consumed = await this.tokenRepo.consumeAtomic(token.id, new Date(), tx);
      if (!consumed) {
        throw new ConflictError('TOKEN_INVALID_OR_EXPIRED');
      }

      // Recheck user under lock
      await this.userRepo.markEmailVerified(user.id, now, tx);
    });
  }

  async resendVerification(
    email: string,
    ip: string = '127.0.0.1',
  ): Promise<{ rawToken?: string }> {
    if (!this.outboxPort) {
      throw new ServiceUnavailableError('Auth mail outbox unavailable');
    }
    const normalizedEmail = EmailRules.normalize(email);

    // Rate limiting: 3 per minute
    this.rateLimiter.checkRateLimit(`resend:${ip}:${normalizedEmail}`, 3, 60);

    return this.uow.run(async (tx) => {
      const user = await this.userRepo.findByEmailWithLock(normalizedEmail, tx);
      if (!user || user.status !== 'ACTIVE') {
        return {}; // Silent 202
      }

      const now = new Date();
      // Invalidate previous active VERIFY_EMAIL tokens
      await this.tokenRepo.invalidateActiveForUser(user.id, 'VERIFY_EMAIL', now, tx);

      // Create new token
      const rawToken = TokenRules.generateRawToken();
      const tokenHash = TokenRules.hashToken(rawToken);
      const expiresAt = new Date(now.getTime() + TokenRules.VERIFY_EMAIL_TTL_MS);

      const createdToken = await this.tokenRepo.create(
        {
          userId: user.id,
          purpose: 'VERIFY_EMAIL',
          tokenHash,
          expiresAt,
        },
        tx,
      );

      const eventId = randomUUID();
      const encryptedEnvelope = this.encryption.encrypt(rawToken, {
        tokenId: createdToken.id,
        userId: user.id,
        purpose: 'VERIFY_EMAIL',
        eventId,
      });

      if (this.outboxPort) {
        await this.outboxPort.append(
          {
            eventId,
            eventType: 'auth.verification_requested',
            schemaVersion: 1,
            aggregateId: user.id,
            aggregateVersion: user.version,
            occurredAt: now.toISOString(),
            payload: {
              userId: user.id,
              email: user.email,
              tokenId: createdToken.id,
              expiresAt: expiresAt.toISOString(),
              encryptedEnvelope: JSON.stringify(encryptedEnvelope),
            },
          },
          tx,
        );
      }

      return { rawToken };
    });
  }

  async forgotPassword(email: string, ip: string = '127.0.0.1'): Promise<{ rawToken?: string }> {
    if (!this.outboxPort) {
      throw new ServiceUnavailableError('Auth mail outbox unavailable');
    }
    const normalizedEmail = EmailRules.normalize(email);

    // Rate limiting: 3 per minute
    this.rateLimiter.checkRateLimit(`forgot:${ip}:${normalizedEmail}`, 3, 60);

    return this.uow.run(async (tx) => {
      const user = await this.userRepo.findByEmailWithLock(normalizedEmail, tx);
      if (!user || user.status !== 'ACTIVE') {
        return {}; // Silent 202
      }

      const now = new Date();
      // Invalidate previous active RESET_PASSWORD tokens
      await this.tokenRepo.invalidateActiveForUser(user.id, 'RESET_PASSWORD', now, tx);

      // Create new token
      const rawToken = TokenRules.generateRawToken();
      const tokenHash = TokenRules.hashToken(rawToken);
      const expiresAt = new Date(now.getTime() + TokenRules.RESET_PASSWORD_TTL_MS);

      const createdToken = await this.tokenRepo.create(
        {
          userId: user.id,
          purpose: 'RESET_PASSWORD',
          tokenHash,
          expiresAt,
        },
        tx,
      );

      const eventId = randomUUID();
      const encryptedEnvelope = this.encryption.encrypt(rawToken, {
        tokenId: createdToken.id,
        userId: user.id,
        purpose: 'RESET_PASSWORD',
        eventId,
      });

      if (this.outboxPort) {
        await this.outboxPort.append(
          {
            eventId,
            eventType: 'auth.password_reset_requested',
            schemaVersion: 1,
            aggregateId: user.id,
            aggregateVersion: user.version,
            occurredAt: now.toISOString(),
            payload: {
              userId: user.id,
              email: user.email,
              tokenId: createdToken.id,
              expiresAt: expiresAt.toISOString(),
              encryptedEnvelope: JSON.stringify(encryptedEnvelope),
            },
          },
          tx,
        );
      }

      return { rawToken };
    });
  }

  async resetPassword(rawToken: string, newPassword: string): Promise<void> {
    if (!rawToken) {
      throw new ValidationError('Token is required');
    }
    PasswordRules.validate(newPassword);

    // Compute hash outside Tx
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const tokenHash = TokenRules.hashToken(rawToken);

    const token = await this.tokenRepo.findByHash(tokenHash, 'RESET_PASSWORD');
    if (!token) {
      throw new ConflictError('TOKEN_INVALID_OR_EXPIRED');
    }

    const now = new Date();
    await this.uow.run(async (tx) => {
      // 1. CAS consume token atomically
      const user = await this.userRepo.findByIdWithLock(token.userId, tx);
      if (!user || user.status !== 'ACTIVE') {
        throw new ConflictError('ACCOUNT_LOCKED_OR_UNAVAILABLE');
      }
      const consumed = await this.tokenRepo.consumeAtomic(token.id, new Date(), tx);
      if (!consumed) {
        throw new ConflictError('TOKEN_INVALID_OR_EXPIRED');
      }

      // 3. Update password hash & increment version
      await this.userRepo.updatePasswordHash(user.id, passwordHash, tx);

      // 4. Revoke all active sessions for this user
      await this.sessionRepo.revokeAllForUser(user.id, now, tx);

      // 5. Invalidate sibling reset tokens
      await this.tokenRepo.invalidateActiveForUser(user.id, 'RESET_PASSWORD', now, tx);
    });
  }
}
