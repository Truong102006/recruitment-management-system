import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createTestApi } from '../../helpers/create-test-api';
import { RateLimiterService } from '../../../apps/api/src/common/services/rate-limiter.service';

function extractCookie(res: request.Response): string {
  const raw = res.header['set-cookie'] as string[] | string | undefined;
  if (!raw) {
    throw new Error('Missing set-cookie header');
  }
  const cookieStr = Array.isArray(raw) ? raw[0] : raw;
  return cookieStr!.split(';')[0]!;
}

describe('Company Concurrency & Race Condition Tests (Phase 4)', () => {
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
  const validPassword = 'P@ssword12345!';

  async function createAndLoginUser(email: string, role: 'RECRUITER' | 'CANDIDATE') {
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('Origin', 'http://127.0.0.1:5173')
      .send({
        email,
        password: validPassword,
        fullName: `User ${role} ${Date.now()}`,
        role,
      });

    expect(regRes.status).toBe(201);
    await prisma.userAccount.update({
      where: { id: regRes.body.data.userId },
      data: { emailVerifiedAt: new Date() },
    });

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .set('Origin', 'http://127.0.0.1:5173')
      .send({
        email,
        password: validPassword,
      });

    const cookie = extractCookie(loginRes);

    const sessionRes = await request(app.getHttpServer())
      .get('/api/auth/session')
      .set('Cookie', [cookie]);

    return {
      userId: regRes.body.data.userId,
      email,
      cookie,
      csrfToken: sessionRes.body.data.csrfToken,
    };
  }

  it('Race 1: Concurrent creation with identical tax code results in exactly 1 success and 1 conflict', async () => {
    const user1 = await createAndLoginUser(`concurr_reg1_${uniqueId}@example.com`, 'RECRUITER');
    const user2 = await createAndLoginUser(`concurr_reg2_${uniqueId}@example.com`, 'RECRUITER');
    const taxCode = `RACE1-${uniqueId.toString().slice(-8)}`;

    const results = await Promise.all([
      request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [user1.cookie])
        .set('X-CSRF-Token', user1.csrfToken)
        .send({
          name: 'Race Company 1',
          taxCode,
          address: 'Address 1',
        }),
      request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [user2.cookie])
        .set('X-CSRF-Token', user2.csrfToken)
        .send({
          name: 'Race Company 2',
          taxCode,
          address: 'Address 2',
        }),
    ]);

    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([201, 409]);

    const count = await prisma.company.count({ where: { taxCode } });
    expect(count).toBe(1);
  });

  it('Race 2: Concurrent updates with the same expectedVersion on company results in 1 success and 1 stale version 409', async () => {
    const owner = await createAndLoginUser(`concurr_upd_${uniqueId}@example.com`, 'RECRUITER');
    const taxCode = `RACE2-${uniqueId.toString().slice(-8)}`;

    const createRes = await request(app.getHttpServer())
      .post('/api/companies')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [owner.cookie])
      .set('X-CSRF-Token', owner.csrfToken)
      .send({
        name: 'Optimistic Lock Company',
        taxCode,
        address: 'Initial Address',
      });

    const companyId = createRes.body.data.id;

    const results = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/companies/${companyId}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          name: 'Parallel Update A',
          version: 0,
        }),
      request(app.getHttpServer())
        .patch(`/api/companies/${companyId}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          name: 'Parallel Update B',
          version: 0,
        }),
    ]);

    const statuses = results.map((r) => r.status).sort();
    expect(statuses).toEqual([200, 409]);

    const updated = await prisma.company.findUnique({ where: { id: companyId } });
    expect(updated?.version).toBe(1);
  });

  it('Race 3: Two owners demoting each other concurrently ensures at least 1 owner remains', async () => {
    const owner1 = await createAndLoginUser(`concurr_own1_${uniqueId}@example.com`, 'RECRUITER');
    const owner2 = await createAndLoginUser(`concurr_own2_${uniqueId}@example.com`, 'RECRUITER');
    const taxCode = `RACE3-${uniqueId.toString().slice(-8)}`;

    const createRes = await request(app.getHttpServer())
      .post('/api/companies')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [owner1.cookie])
      .set('X-CSRF-Token', owner1.csrfToken)
      .send({
        name: 'Dual Owner Company',
        taxCode,
        address: 'Dual Street',
      });

    const companyId = createRes.body.data.id;

    // Add owner2 as RECRUITER first
    await request(app.getHttpServer())
      .post(`/api/companies/${companyId}/members`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [owner1.cookie])
      .set('X-CSRF-Token', owner1.csrfToken)
      .send({
        email: owner2.email,
        role: 'RECRUITER',
      });

    // Promote owner2 to second OWNER directly in DB to test dual-owner race
    await prisma.companyMembership.update({
      where: {
        companyId_userId: { companyId, userId: owner2.userId },
      },
      data: {
        role: 'OWNER',
        version: { increment: 1 },
      },
    });

    const comp = await prisma.company.findUnique({ where: { id: companyId } });
    const currentCompVer = comp!.version;

    // Both try to demote each other concurrently
    const results = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/companies/${companyId}/members/${owner2.userId}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner1.cookie])
        .set('X-CSRF-Token', owner1.csrfToken)
        .send({
          role: 'RECRUITER',
          version: 1,
          companyVersion: currentCompVer,
        }),
      request(app.getHttpServer())
        .patch(`/api/companies/${companyId}/members/${owner1.userId}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner2.cookie])
        .set('X-CSRF-Token', owner2.csrfToken)
        .send({
          role: 'RECRUITER',
          version: 0,
          companyVersion: currentCompVer,
        }),
    ]);

    const statuses = results.map((r) => r.status).sort();
    // One succeeds (200), other fails (either 409 stale version or 409 LAST_OWNER_REQUIRED)
    expect(statuses[0]).toBe(200);
    expect(statuses[1]).toBe(409);

    // Assert DB invariant: at least 1 OWNER remains!
    const activeOwners = await prisma.companyMembership.count({
      where: {
        companyId,
        role: 'OWNER',
        active: true,
      },
    });
    expect(activeOwners).toBeGreaterThanOrEqual(1);
  });
});
