import request from 'supertest';
import { Controller, Get, Post, Body, INestApplication, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { IsString, MinLength } from 'class-validator';
import { configureApi } from '../../../apps/api/src/common/bootstrap/configure-api';
import { PublicRoute } from '../../../apps/api/src/common/decorators/public-route.decorator';
import { CurrentActor } from '../../../apps/api/src/common/decorators/actor.decorator';
import { NotFoundError } from '../../../libs/platform/errors/domain.error';
import type { Actor } from '../../../libs/contracts/backend';

class TestDto {
  @IsString()
  @MinLength(5)
  title!: string;
}

@Controller('test-probe')
class TestProbeController {
  @Get('public')
  @PublicRoute()
  getPublic(): { message: string } {
    return { message: 'hello public' };
  }

  @Post('public-post')
  @PublicRoute()
  postPublic(@Body() body: TestDto): { received: string } {
    return { received: body.title };
  }

  @Get('protected')
  getProtected(@CurrentActor() actor?: Actor): { userId: string } {
    return { userId: actor?.userId || 'unknown' };
  }

  @Get('not-found')
  @PublicRoute()
  throwNotFound(): void {
    throw new NotFoundError('Custom resource not found');
  }

  @Get('unexpected')
  @PublicRoute()
  throwUnexpected(): void {
    throw new Error('Database password was super_secret_pass');
  }
}

describe('BE1 API Bootstrap Contract & Security Envelope', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              environment: {
                nodeEnv: 'test',
                port: 3000,
                webOrigin: 'http://127.0.0.1:5173',
                sessionSecret: 'test_session_secret_min_32_chars!',
                csrfSecret: 'test_csrf_secret_min_32_chars!',
              },
            }),
          ],
        }),
      ],
      controllers: [TestProbeController],
    }).compile();

    app = moduleRef.createNestApplication();
    configureApi(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('prefixes routes with /api and wraps responses in data envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/test-probe/public');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      data: { message: 'hello public' },
    });
    expect(res.headers['x-trace-id']).toBeDefined();
  });

  it('sets security headers via Helmet', async () => {
    const res = await request(app.getHttpServer()).get('/api/test-probe/public');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
  });

  it('propagates caller X-Trace-Id if valid UUID', async () => {
    const customTraceId = '11111111-2222-4333-8444-555555555555';
    const res = await request(app.getHttpServer())
      .get('/api/test-probe/public')
      .set('X-Trace-Id', customTraceId);
    expect(res.status).toBe(200);
    expect(res.headers['x-trace-id']).toBe(customTraceId);
  });

  it('blocks unauthenticated access on protected endpoints with standard ApiError', async () => {
    const res = await request(app.getHttpServer()).get('/api/test-probe/protected');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
    expect(res.body.message).toBe('Session cookie required');
    expect(res.body.traceId).toBeDefined();
  });

  it('fails closed when session provider is unavailable even with valid-prefixed cookie', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/test-probe/protected')
      .set('Cookie', ['recruitment_session=valid-test-token']);
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('UNAUTHORIZED');
  });

  it('enforces ValidationPipe and maps validation errors into fieldErrors', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/test-probe/public-post')
      .set('Origin', 'http://127.0.0.1:5173')
      .send({ title: 'abc' }); // less than 5 chars
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
    expect(res.body.fieldErrors).toBeDefined();
    expect(res.body.traceId).toBeDefined();
  });

  it('rejects forbidden non-whitelisted properties in request body', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/test-probe/public-post')
      .set('Origin', 'http://127.0.0.1:5173')
      .send({ title: 'valid title', hackerField: 'injected' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('formats domain errors with custom code and message without stack trace', async () => {
    const res = await request(app.getHttpServer()).get('/api/test-probe/not-found');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      code: 'NOT_FOUND',
      message: 'Custom resource not found',
      traceId: expect.any(String),
    });
    expect(res.body.stack).toBeUndefined();
  });

  it('redacts internal server error details to prevent secret leakage', async () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    const res = await request(app.getHttpServer()).get('/api/test-probe/unexpected');
    expect(res.status).toBe(500);
    expect(res.body.code).toBe('INTERNAL_SERVER_ERROR');
    expect(res.body.message).toBe('An internal server error occurred');
    expect(JSON.stringify(res.body)).not.toContain('super_secret_pass');
    expect(res.body.traceId).toBeDefined();
    expect(log).toHaveBeenCalled();
    expect(JSON.stringify(log.mock.calls)).not.toContain('super_secret_pass');
    log.mockRestore();
  });

  it('rejects hostile origins on mutation requests', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/test-probe/public-post')
      .set('Origin', 'https://hostile-malicious-site.com')
      .send({ title: 'valid title' });
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('FORBIDDEN');
    expect(res.body.message).toContain(
      'Origin https://hostile-malicious-site.com is not permitted',
    );
  });

  it.each([
    'http://127.0.0.1:5173.evil.example',
    'http://localhost:5173@evil.example',
    'http://127.0.0.1:51730',
    'http://127.0.0.1:5173/evil',
    'null',
  ])('rejects origins that only resemble an allowlisted origin: %s', async (origin) => {
    const res = await request(app.getHttpServer())
      .post('/api/test-probe/public-post')
      .set('Origin', origin)
      .send({ title: 'valid title' });
    expect(res.status).toBe(403);
  });
});
