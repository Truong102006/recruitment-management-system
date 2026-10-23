import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ApiExceptionFilter } from '../filters/api-exception.filter';
import { TraceInterceptor } from '../interceptors/trace.interceptor';
import { ResponseInterceptor } from '../interceptors/response.interceptor';
import { OriginGuard } from '../guards/origin.guard';
import { SessionGuard, SESSION_SERVICE_TOKEN } from '../guards/session.guard';
import { CsrfGuard } from '../guards/csrf.guard';

export function configureApi(app: INestApplication): void {
  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  const webOrigin = configService.get<string>('environment.webOrigin') || 'http://127.0.0.1:5173';

  // Global API Prefix
  app.setGlobalPrefix('api');

  // Security Headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  // Cookie Parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin:
      configService.get<string>('environment.nodeEnv') === 'production'
        ? [webOrigin]
        : [webOrigin, 'http://127.0.0.1:5173', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Trace-Id',
      'Idempotency-Key',
    ],
    exposedHeaders: ['X-Trace-Id', 'Set-Cookie'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: false,
      },
    }),
  );

  // Global Filters
  app.useGlobalFilters(new ApiExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(new TraceInterceptor(), new ResponseInterceptor());

  // Optional session service resolution
  let sessionService;
  try {
    sessionService = app.get(SESSION_SERVICE_TOKEN, { strict: false });
  } catch {
    sessionService = undefined;
  }

  // Global Guards
  app.useGlobalGuards(
    new OriginGuard(configService),
    new SessionGuard(reflector, sessionService),
    new CsrfGuard(reflector),
  );

  // Enable shutdown hooks
  app.enableShutdownHooks();
}
