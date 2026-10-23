import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createTestApi } from '../../helpers/create-test-api';
import { SessionService } from '../../../apps/api/src/modules/identity/services/session.service';
import { SessionRules } from '../../../apps/api/src/modules/identity/rules/session.rules';

describe('Admin API guards and canonical PATCH', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const ids: string[] = [];
  beforeAll(async () => {
    app = await createTestApi();
    await prisma.$connect();
  });
  afterAll(async () => {
    await prisma.authSession.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userAccount.deleteMany({ where: { id: { in: ids } } });
    await app.close();
    await prisma.$disconnect();
  });
  async function credentials(role: string) {
    const user = await prisma.userAccount.create({
      data: {
        email: `${randomUUID()}@admin-api.example`,
        fullName: 'API actor',
        passwordHash: 'private-secret-hash',
        emailVerifiedAt: new Date(),
        roles: { create: { role } },
      },
    });
    ids.push(user.id);
    const token = randomUUID();
    const sessionId = randomUUID();
    const csrf = app.get(SessionService).deriveCsrfToken(sessionId);
    await prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenHash: SessionRules.hash(token),
        csrfHash: SessionRules.hash(csrf),
        expiresAt: new Date(Date.now() + 600000),
      },
    });
    return { user, cookie: `recruitment_session=${token}`, csrf };
  }
  it('requires authentication for admin lists', async () => {
    expect((await request(app.getHttpServer()).get('/api/admin/users')).status).toBe(401);
  });
  it('denies candidate despite valid session', async () => {
    const c = await credentials('CANDIDATE');
    expect(
      (await request(app.getHttpServer()).get('/api/admin/users').set('Cookie', c.cookie)).status,
    ).toBe(403);
  });
  it('lists allowlisted user data for a verified administrator', async () => {
    const c = await credentials('ADMIN');
    const r = await request(app.getHttpServer())
      .get('/api/admin/users?limit=1')
      .set('Cookie', c.cookie);
    expect(r.status).toBe(200);
    expect(JSON.stringify(r.body)).not.toContain('passwordHash');
    expect(JSON.stringify(r.body)).not.toContain('private-secret-hash');
  });
  it('validates canonical PATCH status and rejects absent CSRF', async () => {
    const c = await credentials('ADMIN');
    const r = await request(app.getHttpServer())
      .patch(`/api/admin/users/${c.user.id}`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', c.cookie)
      .send({ status: 'LOCKED', reason: 'test', version: 0 });
    expect(r.status).toBe(403);
  });
  it('validates PATCH status after authentication and CSRF', async () => {
    const c = await credentials('ADMIN');
    const r = await request(app.getHttpServer())
      .patch(`/api/admin/users/${c.user.id}`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', c.cookie)
      .set('X-CSRF-Token', c.csrf)
      .send({ status: 'DELETED', reason: 'test', version: 0 });
    expect(r.status).toBe(400);
  });
  it('fails closed canonical PATCH with absent BE3 providers and preserves target', async () => {
    const c = await credentials('ADMIN');
    const r = await request(app.getHttpServer())
      .patch(`/api/admin/users/${c.user.id}`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', c.cookie)
      .set('X-CSRF-Token', c.csrf)
      .send({ status: 'LOCKED', reason: 'test', version: 0 });
    expect(r.status).toBe(503);
    expect(await prisma.userAccount.findUnique({ where: { id: c.user.id } })).toMatchObject({
      status: 'ACTIVE',
      version: 0,
    });
  });
});
