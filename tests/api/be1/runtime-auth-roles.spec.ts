import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import { AppModule } from '../../../apps/api/src/app.module';
import { configureApi } from '../../../apps/api/src/common/bootstrap/configure-api';
import { TokenEncryption, EncryptedEnvelope } from '../../../libs/platform/crypto/token-encryption';

describe('Real AppModule auth and role integration without port doubles', () => {
  let app: INestApplication;
  const db = new PrismaClient();
  const prefix = `runtime-${randomUUID()}`;
  const email = `${prefix}@example.test`;
  const password = 'Runtime-Test-Password!123';
  const origin = 'http://127.0.0.1:5173';
  let userId: string;
  let cookie: string;
  let csrfToken: string;
  let companyId: string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    configureApi(app);
    await app.init();
  }, 30000);

  afterAll(async () => {
    const users = await db.userAccount.findMany({ where: { email: { startsWith: prefix } } });
    const ids = users.map((u) => u.id);
    if (companyId) {
      await db.companyMembership.deleteMany({ where: { companyId } });
      await db.company.delete({ where: { id: companyId } });
    }
    await db.outboxEvent.deleteMany({
      where: { aggregateId: { in: [...ids, ...(companyId ? [companyId] : [])] } },
    });
    await db.candidateProfile.deleteMany({ where: { userId: { in: ids } } });
    await db.authSession.deleteMany({ where: { userId: { in: ids } } });
    await db.authToken.deleteMany({ where: { userId: { in: ids } } });
    await db.userRole.deleteMany({ where: { userId: { in: ids } } });
    await db.userAccount.deleteMany({ where: { id: { in: ids } } });
    await app?.close();
    await db.$disconnect();
  });

  it('registers through real Outbox and creates a candidate profile in the same database', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('Origin', origin)
      .send({ email, password, fullName: 'Runtime Recruiter', role: 'RECRUITER' });
    expect(response.status).toBe(201);
    expect(response.body.data.roles).toEqual(['CANDIDATE', 'RECRUITER']);
    userId = response.body.data.userId;
    expect(await db.candidateProfile.findUnique({ where: { userId } })).not.toBeNull();
    expect(
      await db.outboxEvent.count({
        where: { aggregateId: userId, eventType: 'auth.verification_requested' },
      }),
    ).toBe(1);
  });

  it('rejects public self-assignment of ADMIN/INTERVIEWER and unknown role fields', async () => {
    for (const payload of [{ role: 'ADMIN' }, { role: 'INTERVIEWER' }, { roles: ['ADMIN'] }]) {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .set('Origin', origin)
        .send({
          email: `${prefix}-bad@example.test`,
          password,
          fullName: 'Escalation Probe',
          ...payload,
        });
      expect(response.status).toBe(400);
    }
  });

  it('verifies the encrypted registration token once and rejects its replay', async () => {
    const event = await db.outboxEvent.findFirstOrThrow({
      where: { aggregateId: userId, eventType: 'auth.verification_requested' },
    });
    const payload = event.payload as { encryptedEnvelope: string; tokenId: string };
    const token = new TokenEncryption().decrypt(
      JSON.parse(payload.encryptedEnvelope) as EncryptedEnvelope,
      { tokenId: payload.tokenId, userId, purpose: 'VERIFY_EMAIL', eventId: event.id },
    );
    const response = await request(app.getHttpServer())
      .post('/api/auth/verify-email')
      .set('Origin', origin)
      .send({ token });
    expect(response.status).toBe(200);
    expect(
      (await db.userAccount.findUniqueOrThrow({ where: { id: userId } })).emailVerifiedAt,
    ).not.toBeNull();
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/verify-email')
          .set('Origin', origin)
          .send({ token })
      ).status,
    ).toBe(409);
  });

  it('silently accepts duplicate registration and rejects incorrect login password', async () => {
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/register')
          .set('Origin', origin)
          .send({ email, password, fullName: 'Duplicate' })
      ).status,
    ).toBe(202);
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/login')
          .set('Origin', origin)
          .send({ email, password: 'IncorrectPassword123!' })
      ).status,
    ).toBe(401);
  });

  it('logs in with an HttpOnly cookie and reads session roles plus CSRF', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Origin', origin)
      .send({ email, password });
    expect(login.status).toBe(200);
    const setCookie = login.headers['set-cookie'] as unknown as string[];
    expect(setCookie[0]).toContain('HttpOnly');
    cookie = setCookie[0]!.split(';')[0]!;
    const session = await request(app.getHttpServer())
      .get('/api/auth/session')
      .set('Cookie', cookie);
    expect(session.status).toBe(200);
    expect(session.body.data.roles).toEqual(['CANDIDATE', 'RECRUITER']);
    csrfToken = session.body.data.csrfToken;
    expect(csrfToken).toBeTruthy();
  });

  it('denies admin API to the recruiter and admits authenticated notification reads', async () => {
    expect(
      (await request(app.getHttpServer()).get('/api/admin/users').set('Cookie', cookie)).status,
    ).toBe(403);
    expect(
      (await request(app.getHttpServer()).get('/api/notifications').set('Cookie', cookie)).status,
    ).toBe(200);
    expect((await request(app.getHttpServer()).get('/api/admin/users')).status).toBe(401);
  });

  it('lists only current active memberships and never invents OWNER membership', async () => {
    const empty = await request(app.getHttpServer()).get('/api/companies').set('Cookie', cookie);
    expect(empty.status).toBe(200);
    expect(empty.body.data).toEqual([]);
    const company = await db.company.create({
      data: {
        name: 'Runtime Company',
        taxCode: prefix,
        address: 'Runtime test address',
        approvalStatus: 'APPROVED',
        createdBy: userId,
        memberships: {
          create: { userId, role: 'RECRUITER', permissions: ['RECRUITER'], active: true },
        },
      },
    });
    companyId = company.id;
    const own = await request(app.getHttpServer()).get('/api/companies').set('Cookie', cookie);
    expect(own.body.data).toEqual([
      expect.objectContaining({
        company: expect.objectContaining({ id: companyId }),
        role: 'RECRUITER',
      }),
    ]);
    await db.companyMembership.update({
      where: { companyId_userId: { companyId, userId } },
      data: { active: false },
    });
    const inactive = await request(app.getHttpServer()).get('/api/companies').set('Cookie', cookie);
    expect(inactive.body.data).toEqual([]);
  });

  it('requires CSRF for logout and revokes the old session after successful logout', async () => {
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Origin', origin)
          .set('Cookie', cookie)
      ).status,
    ).toBe(403);
    expect(
      (
        await request(app.getHttpServer())
          .post('/api/auth/logout')
          .set('Origin', origin)
          .set('Cookie', cookie)
          .set('X-CSRF-Token', csrfToken)
      ).status,
    ).toBe(204);
    expect(
      (await request(app.getHttpServer()).get('/api/auth/session').set('Cookie', cookie)).status,
    ).toBe(401);
  });
});
