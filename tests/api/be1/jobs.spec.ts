import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createTestApi } from '../../helpers/create-test-api';
import { RateLimiterService } from '../../../apps/api/src/common/services/rate-limiter.service';
import {
  PORTS,
  JobApplicationPort,
  JobVisibilityPort,
  JobReportingFactsPort,
} from '../../../libs/contracts/backend';
import { ManagedUnitOfWork, UNIT_OF_WORK } from '../../../libs/platform/database/unit-of-work';

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

describe('UC01, UC05: Jobs Publication, Search, and Skills (Phase 5 API Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = await createTestApi();
    prisma = new PrismaClient();
    await prisma.$connect();
  }, 30_000); // Nest/Prisma startup has its own budget; assertions retain Jest's default.

  beforeEach(() => {
    try {
      app.get(RateLimiterService).clear();
    } catch {}
  });

  afterAll(async () => {
    try {
      await app?.close();
    } finally {
      await prisma?.$disconnect();
    }
  });

  const uniqueId = Date.now();
  const validPassword = 'P@ssword12345!';

  it.each([
    'pageSize=51',
    'pageSize=false',
    'page=0',
    'salaryMin=abc',
    'skillMatchMode=NONE',
    'unexpected=true',
    'skillIds=invalid',
  ])('rejects malformed or excessive search query %s', async (query) => {
    const res = await request(app.getHttpServer()).get(`/api/jobs?${query}`);
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('VALIDATION_FAILED');
  });

  it('rejects body role/status spoofing and string numbers before job creation', async () => {
    const user = await createAndLoginUser(`dto-security-${uniqueId}@example.com`, 'RECRUITER');
    for (const extra of [
      { status: 'PUBLISHED' },
      { role: 'ADMIN' },
      { headcount: '3' },
      { skillIds: ['not-a-uuid'] },
    ]) {
      const res = await request(app.getHttpServer())
        .post('/api/jobs')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', user.cookie)
        .set('X-CSRF-Token', user.csrfToken)
        .send({ companyId: '10000000-0000-4000-8000-000000000001', ...extra });
      expect(res.status).toBe(400);
    }
  });

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

  it.each(['locked', 'unverified', 'inactive'] as const)(
    'blocks every job mutation with an %s sole OWNER without changing data or emitting events',
    async (ownerState) => {
      const recruiter = await createAndLoginUser(
        `owner-${ownerState}-${uniqueId}@example.com`,
        'RECRUITER',
      );
      const owner = await prisma.userAccount.create({
        data: {
          email: `owner-fixture-${ownerState}-${uniqueId}@example.com`,
          passwordHash: 'not-a-login-fixture',
          fullName: 'Owner fixture',
          status: ownerState === 'locked' ? 'LOCKED' : 'ACTIVE',
          emailVerifiedAt: ownerState === 'unverified' ? null : new Date(),
        },
      });
      const company = await prisma.company.create({
        data: {
          name: 'Owner availability company',
          taxCode: `OWNER-${ownerState.toUpperCase()}-${uniqueId}`,
          address: 'Fixture address',
          createdBy: recruiter.userId,
          approvalStatus: 'APPROVED',
          memberships: {
            create: [
              { userId: recruiter.userId, role: 'RECRUITER', permissions: ['RECRUITER'] },
              {
                userId: owner.id,
                role: 'OWNER',
                permissions: ['RECRUITER'],
                active: ownerState !== 'inactive',
              },
            ],
          },
        },
      });
      const draft = await prisma.jobPost.create({
        data: {
          companyId: company.id,
          createdBy: recruiter.userId,
          title: 'Existing draft title',
          status: 'DRAFT',
        },
      });
      const outbox = app.get<{ append: (...args: any[]) => Promise<void> }>(PORTS.outbox);
      const events = jest.spyOn(outbox, 'append');
      const server = app.getHttpServer();
      const mutate = (method: 'post' | 'patch', path: string) => {
        const api = request(server);
        return api[method](path)
          .set('Origin', 'http://127.0.0.1:5173')
          .set('Cookie', recruiter.cookie)
          .set('X-CSRF-Token', recruiter.csrfToken);
      };
      try {
        for (const res of [
          await mutate('post', '/api/jobs').send({
            companyId: company.id,
            title: 'New draft title',
          }),
          await mutate('patch', `/api/jobs/${draft.id}`).send({
            version: 0,
            title: 'Changed draft title',
          }),
          await mutate('post', `/api/jobs/${draft.id}/publish`).send({ version: 0 }),
          await mutate('post', `/api/jobs/${draft.id}/close`).send({
            version: 0,
            reason: 'Closing fixture',
          }),
        ])
          expect(res.status).toBe(409);
        expect(await prisma.jobPost.count({ where: { companyId: company.id } })).toBe(1);
        expect(await prisma.jobPost.findUnique({ where: { id: draft.id } })).toMatchObject({
          title: draft.title,
          version: 0,
          status: 'DRAFT',
          closedAt: null,
          publishedAt: null,
        });
        expect(events).not.toHaveBeenCalled();
        // Restoring an available OWNER unblocks mutations without recreating the company.
        await prisma.userAccount.update({
          where: { id: owner.id },
          data: { status: 'ACTIVE', emailVerifiedAt: new Date() },
        });
        await prisma.companyMembership.update({
          where: { companyId_userId: { companyId: company.id, userId: owner.id } },
          data: { active: true },
        });
        expect(
          (
            await mutate('post', '/api/jobs').send({
              companyId: company.id,
              title: 'Recovery draft title',
            })
          ).status,
        ).toBe(201);
      } finally {
        events.mockRestore();
      }
    },
  );

  it('normalizes create/update text before Unicode code-point boundaries at the HTTP and DB layers', async () => {
    const recruiter = await createAndLoginUser(`unicode-job-${uniqueId}@example.com`, 'RECRUITER');
    const company = await prisma.company.create({
      data: {
        name: 'Unicode company',
        taxCode: `UNICODE-${uniqueId}`,
        address: 'Fixture address',
        createdBy: recruiter.userId,
        approvalStatus: 'APPROVED',
        memberships: {
          create: { userId: recruiter.userId, role: 'OWNER', permissions: ['RECRUITER'] },
        },
      },
    });
    const server = app.getHttpServer();
    const mutate = (method: 'post' | 'patch', path: string) => {
      const api = request(server);
      return api[method](path)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', recruiter.cookie)
        .set('X-CSRF-Token', recruiter.csrfToken);
    };
    for (const title of ['😀'.repeat(5), '😀'.repeat(151), 'a\uFE0F'.repeat(76)]) {
      expect(
        (await mutate('post', '/api/jobs').send({ companyId: company.id, title })).status,
      ).toBe(400);
    }
    const created = await mutate('post', '/api/jobs').send({
      companyId: company.id,
      title: `  ${'😀'.repeat(150)}  `,
      description: `  ${'e\u0301'.repeat(100)}  `,
      location: '  HCM  ',
    });
    expect(created.status).toBe(201);
    const jobId = created.body.data.id;
    expect(await prisma.jobPost.findUnique({ where: { id: jobId } })).toMatchObject({
      title: '😀'.repeat(150),
      description: 'é'.repeat(100),
      location: 'HCM',
      version: 0,
    });
    const updated = await mutate('patch', `/api/jobs/${jobId}`).send({
      version: 0,
      title: `  ${'e\u0301'.repeat(150)}  `,
      description: '😀'.repeat(100),
      location: '  Đa\u0300 Na\u0306\u0303ng  ',
    });
    expect(updated.status).toBe(200);
    expect(await prisma.jobPost.findUnique({ where: { id: jobId } })).toMatchObject({
      title: 'é'.repeat(150),
      description: '😀'.repeat(100),
      location: 'Đà Nẵng',
      version: 1,
    });
    const closed = await mutate('post', `/api/jobs/${jobId}/close`).send({
      version: 1,
      reason: '  Đa\u0303 tuye\u0302\u0309n  ',
    });
    expect(closed.status).toBe(200);
    expect((await prisma.jobPost.findUniqueOrThrow({ where: { id: jobId } })).closeReason).toBe(
      'Đã tuyển',
    );

    // Pre-fix data can still exist in an older draft when publication happens.
    const legacy = await prisma.jobPost.create({
      data: {
        companyId: company.id,
        createdBy: recruiter.userId,
        title: `  ${'e\u0301'.repeat(10)}  `,
        description: `  ${'e\u0301'.repeat(100)}  `,
        location: '  Đa\u0300 Na\u0306\u0303ng  ',
        headcount: 1,
        jobType: 'FULL_TIME',
        workplaceMode: 'ON_SITE',
        deadline: new Date(Date.now() + 86_400_000),
        status: 'DRAFT',
      },
    });
    const publication = await mutate('post', `/api/jobs/${legacy.id}/publish`).send({ version: 0 });
    expect(publication.status).toBe(200);
    expect(await prisma.jobPost.findUniqueOrThrow({ where: { id: legacy.id } })).toMatchObject({
      title: 'é'.repeat(10),
      description: 'é'.repeat(100),
      location: 'Đà Nẵng',
      status: 'PUBLISHED',
      version: 1,
    });
  });

  it('GET /api/skills returns active skills catalog', async () => {
    // Seed skills if not exist
    const skill1 = await prisma.skill.upsert({
      where: { name: `TypeScript-${uniqueId}` },
      update: {},
      create: { name: `TypeScript-${uniqueId}`, category: 'Backend', active: true },
    });
    const skill2 = await prisma.skill.upsert({
      where: { name: `React-${uniqueId}` },
      update: {},
      create: { name: `React-${uniqueId}`, category: 'Frontend', active: true },
    });

    const res = await request(app.getHttpServer()).get('/api/skills');
    expect(res.status).toBe(200);
    const skills = res.body.data;
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.some((s: any) => s.id === skill1.id)).toBe(true);
    expect(skills.some((s: any) => s.id === skill2.id)).toBe(true);
  });

  it('End-to-end Job lifecycle: Draft -> Update -> Publish -> Public Search -> Published Update -> Close', async () => {
    // 1. Create recruiter and approved company
    const recruiter = await createAndLoginUser(
      `recruiter-job-${uniqueId}@example.com`,
      'RECRUITER',
    );

    const compRes = await request(app.getHttpServer())
      .post('/api/companies')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        name: `Tech Jobs Corp ${uniqueId}`,
        taxCode: `TAX-${uniqueId}`,
        address: '123 Nguyen Hue, D1, HCMC',
      });
    expect(compRes.status).toBe(201);
    const companyId = compRes.body.data.id;

    // Approve company
    await prisma.company.update({
      where: { id: companyId },
      data: { approvalStatus: 'APPROVED' },
    });

    // Seed skill
    const skill = await prisma.skill.upsert({
      where: { name: `NodeJS-${uniqueId}` },
      update: {},
      create: { name: `NodeJS-${uniqueId}`, category: 'Backend', active: true },
    });

    // 2. Create DRAFT job (POST /api/jobs)
    const futureDeadline = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const createJobRes = await request(app.getHttpServer())
      .post('/api/jobs')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        companyId,
        title: 'Senior Node.js Backend Engineer',
        description:
          'We are seeking an experienced Backend Engineer to lead our microservices architecture and cloud infrastructure.'.padEnd(
            120,
            '.',
          ),
        location: 'Ho Chi Minh City, Vietnam',
        headcount: 2,
        jobType: 'FULL_TIME',
        workplaceMode: 'HYBRID',
        salaryMin: 2000,
        salaryMax: 3500,
        currency: 'USD',
        deadline: futureDeadline,
        skillIds: [skill.id],
      });

    expect(createJobRes.status).toBe(201);
    expect(createJobRes.body.data.status).toBe('DRAFT');
    expect(createJobRes.body.data.version).toBe(0);
    expect(createJobRes.body.data.title).toBe('Senior Node.js Backend Engineer');
    const jobId = createJobRes.body.data.id;

    // 3. Recruiter company jobs list (GET /api/companies/:id/jobs)
    const listCompanyJobsRes = await request(app.getHttpServer())
      .get(`/api/companies/${companyId}/jobs`)
      .set('Cookie', [recruiter.cookie]);
    expect(listCompanyJobsRes.status).toBe(200);
    expect(listCompanyJobsRes.body.data.some((j: any) => j.id === jobId)).toBe(true);

    // 4. Recruiter company job detail (GET /api/companies/:id/jobs/:jobId)
    const detailCompanyJobRes = await request(app.getHttpServer())
      .get(`/api/companies/${companyId}/jobs/${jobId}`)
      .set('Cookie', [recruiter.cookie]);
    expect(detailCompanyJobRes.status).toBe(200);
    expect(detailCompanyJobRes.body.data.id).toBe(jobId);

    // 5. Public Search and Detail for DRAFT must hide draft
    const publicSearchDraftRes = await request(app.getHttpServer())
      .get('/api/jobs')
      .query({ q: 'Senior Node.js Backend Engineer' });
    expect(publicSearchDraftRes.status).toBe(200);
    expect(publicSearchDraftRes.body.data.some((j: any) => j.id === jobId)).toBe(false);

    const publicDetailDraftRes = await request(app.getHttpServer()).get(`/api/jobs/${jobId}`);
    expect(publicDetailDraftRes.status).toBe(404);

    // 6. Update DRAFT job (PATCH /api/jobs/:id)
    const updateDraftRes = await request(app.getHttpServer())
      .patch(`/api/jobs/${jobId}`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        version: 0,
        title: 'Lead Node.js Backend Architect',
        headcount: 3,
      });
    expect(updateDraftRes.status).toBe(200);
    expect(updateDraftRes.body.data.version).toBe(1);
    expect(updateDraftRes.body.data.title).toBe('Lead Node.js Backend Architect');
    expect(updateDraftRes.body.data.headcount).toBe(3);

    // 7. Publish Job (POST /api/jobs/:id/publish)
    const publishRes = await request(app.getHttpServer())
      .post(`/api/jobs/${jobId}/publish`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        version: 1,
      });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.data.status).toBe('PUBLISHED');
    expect(publishRes.body.data.version).toBe(2);
    expect(publishRes.body.data.publishedAt).toBeDefined();

    // 8. Public Search now finds PUBLISHED job (GET /api/jobs)
    const publicSearchRes = await request(app.getHttpServer())
      .get('/api/jobs')
      .query({ q: 'Node.js', jobType: 'FULL_TIME', workplaceMode: 'HYBRID' });
    expect(publicSearchRes.status).toBe(200);
    expect(publicSearchRes.body.data.some((j: any) => j.id === jobId)).toBe(true);

    // 9. Public Detail returns 200 (GET /api/jobs/:id)
    const publicDetailRes = await request(app.getHttpServer()).get(`/api/jobs/${jobId}`);
    expect(publicDetailRes.status).toBe(200);
    expect(publicDetailRes.body.data.title).toBe('Lead Node.js Backend Architect');
    expect(publicDetailRes.body.data.status).toBe('PUBLISHED');
    expect(publicDetailRes.body.data.acceptingApplications).toBe(true);
    expect(publicDetailRes.body.data.isClosed).toBe(false);

    // 10. Update on PUBLISHED job
    // Title change is rejected (409)
    const rejectTitleChangeRes = await request(app.getHttpServer())
      .patch(`/api/jobs/${jobId}`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        version: 2,
        title: 'Brand New Title Not Allowed',
      });
    expect(rejectTitleChangeRes.status).toBe(409);

    // Allowed fields update succeeds
    const updatePublishedRes = await request(app.getHttpServer())
      .patch(`/api/jobs/${jobId}`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        version: 2,
        location: 'Da Nang City, Vietnam',
        salaryMax: 4000,
      });
    expect(updatePublishedRes.status).toBe(200);
    expect(updatePublishedRes.body.data.version).toBe(3);
    expect(updatePublishedRes.body.data.location).toBe('Da Nang City, Vietnam');

    // 11. Close Job (POST /api/jobs/:id/close)
    const closeRes = await request(app.getHttpServer())
      .post(`/api/jobs/${jobId}/close`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        version: 3,
        reason: 'Hired successful candidates',
      });
    expect(closeRes.status).toBe(200);
    expect(closeRes.body.data.status).toBe('CLOSED');
    expect(closeRes.body.data.version).toBe(4);
    expect(closeRes.body.data.closeReason).toBe('Hired successful candidates');

    // 12. Public detail on CLOSED job returns 200 with isClosed label
    const publicDetailClosedRes = await request(app.getHttpServer()).get(`/api/jobs/${jobId}`);
    expect(publicDetailClosedRes.status).toBe(200);
    expect(publicDetailClosedRes.body.data.status).toBe('CLOSED');
    expect(publicDetailClosedRes.body.data.isClosed).toBe(true);
    expect(publicDetailClosedRes.body.data.acceptingApplications).toBe(false);

    // 13. Reopening CLOSED job is rejected (409)
    const reopenRes = await request(app.getHttpServer())
      .post(`/api/jobs/${jobId}/publish`)
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({ version: 4 });
    expect(reopenRes.status).toBe(409);
  });

  it('Verifies JobApplicationPort, JobVisibilityPort, and JobReportingFactsPort under database transactions', async () => {
    const recruiter = await createAndLoginUser(
      `recruiter-ports-${uniqueId}@example.com`,
      'RECRUITER',
    );
    const candidate = await createAndLoginUser(
      `candidate-ports-${uniqueId}@example.com`,
      'CANDIDATE',
    );

    const compRes = await request(app.getHttpServer())
      .post('/api/companies')
      .set('Origin', 'http://127.0.0.1:5173')
      .set('Cookie', [recruiter.cookie])
      .set('X-CSRF-Token', recruiter.csrfToken)
      .send({
        name: `Ports Test Corp ${uniqueId}`,
        taxCode: `PORTS-TAX-${uniqueId}`,
        address: '456 Le Duan, HCMC',
      });
    const companyId = compRes.body.data.id;
    await prisma.company.update({
      where: { id: companyId },
      data: { approvalStatus: 'APPROVED' },
    });

    // Create published job
    const futureDeadline = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000);
    const job = await prisma.jobPost.create({
      data: {
        companyId,
        createdBy: recruiter.userId,
        title: 'Fullstack Developer',
        description:
          'Complete fullstack job description with more than 100 characters to pass validation rules without issues.'.padEnd(
            120,
            '.',
          ),
        location: 'HCMC',
        headcount: 1,
        jobType: 'FULL_TIME',
        workplaceMode: 'ON_SITE',
        status: 'PUBLISHED',
        deadline: futureDeadline,
        publishedAt: new Date(),
        version: 0,
      },
    });

    const jobAppPort: JobApplicationPort = app.get(PORTS.jobApplication);
    const jobVisPort: JobVisibilityPort = app.get(PORTS.jobVisibility);
    const jobFactsPort: JobReportingFactsPort = app.get(PORTS.jobReportingFacts);
    const uow: ManagedUnitOfWork<any> = app.get(UNIT_OF_WORK);

    // Candidate lockForSubmission succeeds under transaction
    await uow.run(async (tx) => {
      const eligibility = await jobAppPort.lockForSubmission(job.id, candidate.userId, tx);
      expect(eligibility.jobId).toBe(job.id);
      expect(eligibility.companyId).toBe(companyId);
    });

    // Recruiter applying to own company fails (ConflictError)
    await expect(
      uow.run(async (tx) => {
        await jobAppPort.lockForSubmission(job.id, recruiter.userId, tx);
      }),
    ).rejects.toThrow();

    // Visibility Port
    await uow.run(async (tx) => {
      const vis = await jobVisPort.getPublicOrPlaceholder(
        job.id,
        { userId: candidate.userId, roles: ['CANDIDATE'], sessionId: 's' },
        tx,
      );
      expect(vis.available).toBe(true);
      if (vis.available) {
        expect(vis.acceptingApplications).toBe(true);
      }
    });

    // Reporting Facts Port
    await uow.run(async (tx) => {
      const facts = await jobFactsPort.getJobFacts(companyId, tx);
      expect(facts.totalJobs).toBeGreaterThanOrEqual(1);
      expect(facts.publishedJobs).toBeGreaterThanOrEqual(1);
    });
  });
});
