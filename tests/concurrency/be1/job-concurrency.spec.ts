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
  if (!cookieStr) {
    throw new Error('Empty cookie string');
  }
  return cookieStr.split(';')[0]!;
}

describe('Job Concurrency & Race Condition Tests (Phase 5)', () => {
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
        fullName: `User ${role} ${uniqueId}`,
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
      cookie,
      csrfToken: sessionRes.body.data.csrfToken,
    };
  }

  it('Concurrent job updates with identical version: exactly one succeeds, other gets 409', async () => {
    const recruiter = await createAndLoginUser(
      `recruiter-race-update-${uniqueId}@example.com`,
      'RECRUITER',
    );

    const compRes = await request(app.getHttpServer())
      .post('/api/companies')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        name: `Race Update Corp ${uniqueId}`,
        taxCode: `RACE-UP-${uniqueId}`,
        address: '100 Hai Ba Trung, HCMC',
      });
    const companyId = compRes.body.data.id;
    await prisma.company.update({
      where: { id: companyId },
      data: { approvalStatus: 'APPROVED' },
    });

    const job = await prisma.jobPost.create({
      data: {
        companyId,
        createdBy: recruiter.userId,
        title: 'Initial Title',
        description:
          'Initial description that exceeds 100 characters to pass publication validation criteria properly without errors.'.padEnd(
            120,
            '.',
          ),
        status: 'DRAFT',
        version: 0,
      },
    });

    // Fire 2 concurrent updates with version 0
    const [res1, res2] = await Promise.all([
      request(app.getHttpServer())
        .patch(`/api/jobs/${job.id}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({ version: 0, title: 'Title From Request 1' }),
      request(app.getHttpServer())
        .patch(`/api/jobs/${job.id}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({ version: 0, title: 'Title From Request 2' }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    expect(statuses).toEqual([200, 409]);

    const updatedJob = await prisma.jobPost.findUnique({ where: { id: job.id } });
    expect(updatedJob?.version).toBe(1);
  });

  it('Concurrent publish vs close race: exactly one state transition succeeds, other gets 409', async () => {
    const recruiter = await createAndLoginUser(
      `recruiter-race-pub-close-${uniqueId}@example.com`,
      'RECRUITER',
    );

    const compRes = await request(app.getHttpServer())
      .post('/api/companies')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        name: `Race Pub Close Corp ${uniqueId}`,
        taxCode: `RACE-PUB-CLOSE-${uniqueId}`,
        address: '200 Le Loi, HCMC',
      });
    const companyId = compRes.body.data.id;
    await prisma.company.update({
      where: { id: companyId },
      data: { approvalStatus: 'APPROVED' },
    });

    const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const job = await prisma.jobPost.create({
      data: {
        companyId,
        createdBy: recruiter.userId,
        title: 'Fullstack Dev Engineer',
        description:
          'Complete description exceeding 100 characters to satisfy all publication requirements easily and smoothly.'.padEnd(
            120,
            '.',
          ),
        location: 'HCMC',
        headcount: 2,
        jobType: 'FULL_TIME',
        workplaceMode: 'HYBRID',
        salaryMin: 1500,
        salaryMax: 3000,
        currency: 'USD',
        deadline: futureDeadline,
        status: 'DRAFT',
        version: 0,
      },
    });

    // Fire publish vs close concurrently with version 0
    const [pubRes, closeRes] = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/jobs/${job.id}/publish`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({ version: 0 }),
      request(app.getHttpServer())
        .post(`/api/jobs/${job.id}/close`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({ version: 0, reason: 'Canceling before publish' }),
    ]);

    const statuses = [pubRes.status, closeRes.status].sort();
    expect(statuses).toEqual([200, 409]);

    const finalJob = await prisma.jobPost.findUnique({ where: { id: job.id } });
    expect(finalJob?.version).toBe(1);
    expect(['PUBLISHED', 'CLOSED'].includes(finalJob?.status || '')).toBe(true);
  });
});
