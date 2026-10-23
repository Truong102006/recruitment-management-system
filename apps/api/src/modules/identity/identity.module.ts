import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { SessionService } from './services/session.service';
import { RegisterService } from './services/register.service';
import { AuthTokenService } from './services/auth-token.service';
import { PrismaUserRepository } from './repositories/prisma-user.repository';
import { PrismaSessionRepository } from './repositories/prisma-session.repository';
import { PrismaAuthTokenRepository } from './repositories/prisma-auth-token.repository';
import { RateLimiterService } from '../../common/services/rate-limiter.service';
import { IdentityCandidateAdapter } from './ports/identity-candidate.adapter';
import { AuthMailMaterialAdapter } from './ports/auth-mail-material.adapter';
import { SESSION_SERVICE_TOKEN } from '../../common/guards/session.guard';
import { PORTS } from '../../../../../libs/contracts/backend';

@Module({
  controllers: [AuthController],
  providers: [
    RateLimiterService,
    PrismaUserRepository,
    PrismaSessionRepository,
    PrismaAuthTokenRepository,
    SessionService,
    RegisterService,
    AuthTokenService,
    IdentityCandidateAdapter,
    AuthMailMaterialAdapter,
    {
      provide: SESSION_SERVICE_TOKEN,
      useExisting: SessionService,
    },
    {
      provide: PORTS.identityCandidate,
      useExisting: IdentityCandidateAdapter,
    },
    {
      provide: PORTS.authMailMaterial,
      useExisting: AuthMailMaterialAdapter,
    },
  ],
  exports: [
    SessionService,
    RegisterService,
    AuthTokenService,
    PrismaUserRepository,
    PrismaSessionRepository,
    PrismaAuthTokenRepository,
    SESSION_SERVICE_TOKEN,
    PORTS.identityCandidate,
    PORTS.authMailMaterial,
  ],
})
export class IdentityModule {}
