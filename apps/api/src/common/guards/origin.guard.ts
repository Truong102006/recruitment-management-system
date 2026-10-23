import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { ForbiddenError } from '../../../../../libs/platform/errors/domain.error';

@Injectable()
export class OriginGuard implements CanActivate {
  private readonly allowedOrigins: string[];

  constructor(private readonly configService: ConfigService) {
    const webOrigin =
      this.configService.get<string>('environment.webOrigin') || 'http://127.0.0.1:5173';
    this.allowedOrigins =
      this.configService.get<string>('environment.nodeEnv') === 'production'
        ? [webOrigin]
        : [
            webOrigin,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:3000',
            'http://127.0.0.1:3000',
          ];
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const method = request.method.toUpperCase();

    // Safe read-only HTTP methods do not require Origin verification
    if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
      return true;
    }

    const origin = request.headers['origin'];
    if (!origin) {
      // In non-browser API test contexts or curl without origin, permit unless strictly production
      const nodeEnv = this.configService.get<string>('environment.nodeEnv');
      if (nodeEnv === 'production') {
        throw new ForbiddenError('Missing required Origin header');
      }
      return true;
    }

    const isAllowed = this.allowedOrigins.includes(origin);

    if (!isAllowed) {
      throw new ForbiddenError(`Origin ${origin} is not permitted`);
    }

    return true;
  }
}
