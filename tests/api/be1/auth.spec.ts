import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createTestApi } from '../../helpers/create-test-api';
import { TokenRules } from '../../../apps/api/src/modules/identity/rules/token.rules';
import { RateLimiterService } from '../../../apps/api/src/common/services/rate-limiter.service';

function extractCookie(res: request.Response): string {
  const raw = res.header['set-cookie'] as string[] | string | undefined;
  if (!raw) {
    throw new Error('Missing set-cookie header');
  }
  const cookieStr = Array.isArray(raw) ? raw[0] : raw;
  if (!cookieStr) {
    throw new Error('Empty cookie string');
  }
  return cookieStr.split(';')[0]!;
}

describe('UC04: Authentication, Sessions, and Tokens API (Phase 3)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = await createTestApi();
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  beforeEach(() => {
    try {
      app.get(RateLimiterService).clear();
    } catch {}
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  const uniqueId = Date.now();
  const testCandidateEmail = `candidate_${uniqueId}@example.com`;
  const testRecruiterEmail = `recruiter_${uniqueId}@example.com`;
  const validPassword = 'P@ssword12345!';

  describe('POST /api/auth/register', () => {
    it('creates new candidate user with 201 Created and requiresVerification=true', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: `  ${testCandidateEmail}  `,
          password: validPassword,
          fullName: 'Nguyễn Văn Candidate',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        email: testCandidateEmail,
        fullName: 'Nguyễn Văn Candidate',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
        requiresVerification: true,
      });
      expect(res.body.data.userId).toBeDefined();

      // Verify in DB
      const user = await prisma.userAccount.findUnique({
        where: { email: testCandidateEmail },
        include: { roles: true, tokens: true },
      });
      expect(user).not.toBeNull();
      expect(user?.roles.map((r) => r.role)).toEqual(['CANDIDATE']);
      expect(user?.tokens.some((t) => t.purpose === 'VERIFY_EMAIL')).toBe(true);
    });

    it('creates recruiter user when role is RECRUITER', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: testRecruiterEmail,
          password: validPassword,
          fullName: 'Trần Tuyển Dụng',
          role: 'RECRUITER',
        });

      expect(res.status).toBe(201);
      expect(res.body.data.roles).toEqual(expect.arrayContaining(['CANDIDATE', 'RECRUITER']));
    });

    it('rejects password shorter than 10 characters with 400', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: `short_${uniqueId}@example.com`,
          password: 'short',
          fullName: 'Short Pass',
        });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('VALIDATION_FAILED');
    });

    it('handles duplicate email registration silently with 202 Accepted', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: testCandidateEmail.toUpperCase(),
          password: validPassword,
          fullName: 'Duplicate Candidate',
        });

      expect(res.status).toBe(202);
    });
  });

  describe('POST /api/auth/login and Session Management', () => {
    let sessionCookie: string;
    let csrfToken: string;

    it('authenticates user and returns 200 with Set-Cookie', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: testCandidateEmail,
          password: validPassword,
        });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        email: testCandidateEmail,
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
      });

      expect(res.headers['set-cookie']).toBeDefined();
      sessionCookie = extractCookie(res);
    });

    it('rejects login with wrong password with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: testCandidateEmail,
          password: 'wrong_password_123',
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('rejects login for non-existent user with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: 'nonexistent_user@example.com',
          password: validPassword,
        });

      expect(res.status).toBe(401);
      expect(res.body.code).toBe('UNAUTHORIZED');
    });

    it('retrieves current authenticated session via GET /api/auth/session', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', [sessionCookie]);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        email: testCandidateEmail,
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
      });
      expect(res.body.data.csrfToken).toBeDefined();
      csrfToken = res.body.data.csrfToken;
    });

    it('rejects GET /api/auth/session without session cookie with 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/auth/session');
      expect(res.status).toBe(401);
    });

    it('logs out and revokes session via POST /api/auth/logout', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [sessionCookie])
        .set('X-CSRF-Token', csrfToken);

      expect(res.status).toBe(204);

      // Session is now revoked
      const afterLogout = await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', [sessionCookie]);

      expect(afterLogout.status).toBe(401);
    });
  });

  describe('CSRF and Origin Protection', () => {
    let sessionCookie: string;
    let csrfToken: string;

    beforeAll(async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          email: testCandidateEmail,
          password: validPassword,
        });

      sessionCookie = extractCookie(loginRes);
      const sessionRes = await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', [sessionCookie]);
      csrfToken = sessionRes.body.data.csrfToken;
      expect(csrfToken).toBeDefined();
    });

    it('blocks authenticated mutation without X-CSRF-Token header with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [sessionCookie]);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('blocks authenticated mutation with invalid X-CSRF-Token header with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [sessionCookie])
        .set('X-CSRF-Token', 'invalid_csrf_token_xyz');

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN');
    });

    it('blocks mutation with unauthorized Origin header with 403', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://evil-attacker.com')
        .send({
          email: testCandidateEmail,
          password: validPassword,
        });

      expect(res.status).toBe(403);
    });
  });

  describe('Email Verification & Password Reset Workflow', () => {
    it('verifies email with active token and prevents reuse', async () => {
      // Find token from DB
      const user = await prisma.userAccount.findUnique({
        where: { email: testCandidateEmail },
        include: { tokens: true },
      });
      const verifyTokenRecord = user?.tokens.find((t) => t.purpose === 'VERIFY_EMAIL');
      expect(verifyTokenRecord).toBeDefined();

      // Create a known raw token
      const rawToken = TokenRules.generateRawToken();
      const tokenHash = TokenRules.hashToken(rawToken);
      await prisma.authToken.create({
        data: {
          userId: user!.id,
          purpose: 'VERIFY_EMAIL',
          tokenHash,
          expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
        },
      });

      // 1. Verify email
      const verifyRes = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ token: rawToken });

      expect(verifyRes.status).toBe(200);

      // 2. Re-verify with same token should fail with 409
      const reuseRes = await request(app.getHttpServer())
        .post('/api/auth/verify-email')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ token: rawToken });

      expect(reuseRes.status).toBe(409);
      expect(reuseRes.body.code).toBe('CONFLICT');
    });

    it('resends verification email with 202 Accepted and invalidates previous token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/auth/resend-verification')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: testCandidateEmail });

      expect(res.status).toBe(202);

      const user = await prisma.userAccount.findUnique({
        where: { email: testCandidateEmail },
        include: { tokens: true },
      });
      const activeVerifyTokens = user?.tokens.filter(
        (t) => t.purpose === 'VERIFY_EMAIL' && !t.consumedAt && !t.invalidatedAt,
      );
      expect(activeVerifyTokens?.length).toBe(1);
    });

    it('completes password reset flow and revokes all active sessions', async () => {
      // 1. Login to establish active session
      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: testCandidateEmail, password: validPassword });

      const oldSessionCookie = extractCookie(loginRes);

      // 2. Request forgot password
      const forgotRes = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: testCandidateEmail });

      expect(forgotRes.status).toBe(202);

      // 3. Create known reset token
      const user = await prisma.userAccount.findUnique({
        where: { email: testCandidateEmail },
      });
      const rawResetToken = TokenRules.generateRawToken();
      const tokenHash = TokenRules.hashToken(rawResetToken);
      await prisma.authToken.create({
        data: {
          userId: user!.id,
          purpose: 'RESET_PASSWORD',
          tokenHash,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        },
      });

      // 4. Reset password
      const newPassword = 'NewStrongP@ssword999!';
      const resetRes = await request(app.getHttpServer())
        .post('/api/auth/reset-password')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({
          token: rawResetToken,
          newPassword,
        });

      expect(resetRes.status).toBe(200);

      // 5. Old session must be revoked
      const checkOldSession = await request(app.getHttpServer())
        .get('/api/auth/session')
        .set('Cookie', [oldSessionCookie]);
      expect(checkOldSession.status).toBe(401);

      // 6. Old password must fail
      const oldLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: testCandidateEmail, password: validPassword });
      expect(oldLogin.status).toBe(401);

      // 7. New password succeeds
      const newLogin = await request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Origin', 'http://127.0.0.1:5173')
        .send({ email: testCandidateEmail, password: newPassword });
      expect(newLogin.status).toBe(200);
    });
  });
});
