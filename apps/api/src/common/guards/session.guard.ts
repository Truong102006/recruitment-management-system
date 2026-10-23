import { Injectable, CanActivate, ExecutionContext, Inject, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';
import { UnauthorizedError } from '../../../../../libs/platform/errors/domain.error';
import type { Actor } from '../../../../../libs/contracts/backend';

export interface ValidatedSession {
  sessionId: string;
  userId: string;
  roles: readonly ('CANDIDATE' | 'RECRUITER' | 'INTERVIEWER' | 'ADMIN')[];
  csrfHash: string;
  csrfToken?: string;
}

export interface ISessionService {
  validateSessionToken(rawToken: string): Promise<ValidatedSession | null>;
}

export const SESSION_SERVICE_TOKEN = Symbol.for('rms.SessionService.v1');

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Optional()
    @Inject(SESSION_SERVICE_TOKEN)
    private readonly sessionService?: ISessionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<
      Request & {
        actor?: Actor;
        session?: ValidatedSession;
        csrfToken?: string;
      }
    >();

    const cookieNames = ['__Host-recruitment_session', 'recruitment_session'];

    let sessionToken: string | undefined;
    if (request.cookies) {
      for (const name of cookieNames) {
        if (request.cookies[name]) {
          sessionToken = request.cookies[name];
          break;
        }
      }
    }

    if (!sessionToken) {
      const authHeader = request.headers['authorization'];
      if (authHeader && authHeader.startsWith('Bearer ')) {
        sessionToken = authHeader.substring(7).trim();
      }
    }

    if (!sessionToken) {
      if (isPublic) {
        return true;
      }
      throw new UnauthorizedError('Session cookie required', 'UNAUTHORIZED');
    }

    if (this.sessionService) {
      const session = await this.sessionService.validateSessionToken(sessionToken);
      if (!session) {
        if (isPublic) {
          return true;
        }
        throw new UnauthorizedError('Session is invalid or expired', 'SESSION_EXPIRED');
      }

      request.session = session;
      request.csrfToken = session.csrfToken;
      request.actor = {
        userId: session.userId,
        sessionId: session.sessionId,
        roles: session.roles,
      };
    } else {
      if (!isPublic) {
        throw new UnauthorizedError('Session validation unavailable', 'UNAUTHORIZED');
      }
    }

    return true;
  }
}
