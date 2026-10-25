import { ServiceUnavailableError } from '../../../../../../libs/platform/errors/domain.error';
import { Inject, Injectable, Optional } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaUserRepository } from '../repositories/prisma-user.repository';
import { PrismaAuthTokenRepository } from '../repositories/prisma-auth-token.repository';
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
import { CandidateProfilePort, OutboxPort, PORTS } from '../../../../../../libs/contracts/backend';
import { RegisterDto } from '../dto/auth.dto';
import { normalizeText } from '../../../common/validation/text';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

export type RegisterResult =
  | { duplicate: true }
  | {
      duplicate: false;
      user: {
        userId: string;
        email: string;
        fullName: string;
        roles: string[];
        status: string;
        requiresVerification: boolean;
      };
      verificationToken?: string; // provided in test / development environments
    };

@Injectable()
export class RegisterService {
  private readonly encryption: TokenEncryption;

  constructor(
    private readonly userRepo: PrismaUserRepository,
    private readonly tokenRepo: PrismaAuthTokenRepository,
    private readonly rateLimiter: RateLimiterService,
    @Inject(UNIT_OF_WORK)
    private readonly uow: ManagedUnitOfWork<Prisma.TransactionClient>,
    @Optional()
    @Inject(PORTS.candidateProfile)
    private readonly candidateProfilePort?: CandidateProfilePort,
    @Optional()
    @Inject(PORTS.outbox)
    private readonly outboxPort?: OutboxPort,
  ) {
    this.encryption = new TokenEncryption();
  }

  async register(dto: RegisterDto, ip: string = '127.0.0.1'): Promise<RegisterResult> {
    if (!this.candidateProfilePort || !this.outboxPort) {
      throw new ServiceUnavailableError('Registration dependencies unavailable');
    }
    // 1. Rate limiting
    this.rateLimiter.checkRateLimit(`register:${ip}`, 10, 60);

    // 2. Normalization & validation
    const normalizedEmail = EmailRules.normalize(dto.email);
    PasswordRules.validate(dto.password);
    const fullName = normalizeText(dto.fullName);
    if ([...fullName].length < 1 || [...fullName].length > 120) {
      throw new ValidationError('Full name must contain between 1 and 120 Unicode code points.', {
        fullName: ['Length must be between 1 and 120 after trim and NFC normalization'],
      });
    }

    // 3. Hash password outside Tx (cost 10)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Roles: CANDIDATE is mandatory; RECRUITER is optional if requested
    const roles: string[] = ['CANDIDATE'];
    if (dto.role === 'RECRUITER') {
      roles.push('RECRUITER');
    }

    // 4. Atomic transaction
    try {
      return await this.uow.run(async (tx) => {
        // Check existing email under lock
        const existing = await this.userRepo.findByEmailWithLock(normalizedEmail, tx);
        if (existing) {
          // Return duplicate without creating duplicate or throwing 500
          return { duplicate: true };
        }

        // Create user account and initial roles
        const user = await this.userRepo.create(
          {
            email: normalizedEmail,
            passwordHash,
            fullName,
            roles,
          },
          tx,
        );

        // Call CandidateProfilePort if registered
        if (this.candidateProfilePort) {
          await this.candidateProfilePort.ensureForCandidate(user.id, tx);
        }

        // Create VERIFY_EMAIL auth token
        const rawToken = TokenRules.generateRawToken();
        const tokenHash = TokenRules.hashToken(rawToken);
        const expiresAt = new Date(Date.now() + TokenRules.VERIFY_EMAIL_TTL_MS);

        const createdToken = await this.tokenRepo.create(
          {
            userId: user.id,
            purpose: 'VERIFY_EMAIL',
            tokenHash,
            expiresAt,
          },
          tx,
        );

        // Encrypt mail material
        const eventId = randomUUID();
        const encryptedEnvelope = this.encryption.encrypt(rawToken, {
          tokenId: createdToken.id,
          userId: user.id,
          purpose: 'VERIFY_EMAIL',
          eventId,
        });

        // Emit event to outbox if registered
        if (this.outboxPort) {
          await this.outboxPort.append(
            {
              eventId,
              eventType: 'auth.verification_requested',
              schemaVersion: 1,
              aggregateId: user.id,
              aggregateVersion: user.version,
              occurredAt: new Date().toISOString(),
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

        return {
          duplicate: false,
          user: {
            userId: user.id,
            email: user.email,
            fullName: user.fullName,
            roles: user.roles.map((r) => r.role),
            status: user.status,
            requiresVerification: true,
          },
          verificationToken: rawToken,
        };
      });
    } catch (err: unknown) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return { duplicate: true };
      }
      throw err;
    }
  }
}
