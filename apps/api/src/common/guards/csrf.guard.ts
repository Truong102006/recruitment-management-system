import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public-route.decorator';
import { ForbiddenError } from '../../../../../libs/platform/errors/domain.error';
import { timingSafeEqual } from 'crypto';

interface AuthenticatedRequest extends Request {
  session?: {
    csrfHash: string;
    sessionId: string;
  };
  csrfToken?: string;
}

@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const method = request.method.toUpperCase();

    // Safe read methods don't require CSRF tokens
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    // Unauthenticated/guest public endpoints (login, register) rely on OriginGuard
    if (isPublic && !request.session) {
      return true;
    }

    // If request has an active session, CSRF token header is required
    if (request.session) {
      const csrfHeader = request.headers['x-csrf-token'];
      if (!csrfHeader || typeof csrfHeader !== 'string') {
        throw new ForbiddenError('Missing X-CSRF-Token header');
      }

      // If session contains expected csrfToken or csrfHash, verify with constant-time compare
      const expectedToken = request.csrfToken;
      if (expectedToken) {
        const bufA = Buffer.from(csrfHeader);
        const bufB = Buffer.from(expectedToken);
        if (bufA.length !== bufB.length || !timingSafeEqual(bufA, bufB)) {
          throw new ForbiddenError('Invalid CSRF token');
        }
      }
    }

    return true;
  }
}
