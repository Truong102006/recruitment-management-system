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

describe('UC11: Company, Memberships, and Owner Operations (Phase 4)', () => {
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
    // 1. Register
    const regRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .set('Origin', 'http://127.0.0.1:5173')
      .send({
        email,
        password: validPassword,
        fullName: `User ${role} ${uniqueId}`,
        role,
      });

    // 2. Login
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

    // 3. Get session and CSRF token
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

  describe('POST /api/companies (Company Registration)', () => {
    it('creates a new company in PENDING status with creator as OWNER', async () => {
      const recruiter = await createAndLoginUser(
        `recruiter_create_${uniqueId}@example.com`,
        'RECRUITER',
      );
      const taxCode = `TAX-${uniqueId.toString().slice(-8)}`;

      const res = await request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({
          name: 'Tech Innovations JSC',
          taxCode,
          address: '456 Le Loi, District 1, HCMC',
          website: 'https://techinnovations.vn',
          description: 'Software development and AI solutions',
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        name: 'Tech Innovations JSC',
        taxCode,
        address: '456 Le Loi, District 1, HCMC',
        approvalStatus: 'PENDING',
        version: 0,
      });
      expect(res.body.data.id).toBeDefined();

      // Verify membership in DB
      const membership = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId: res.body.data.id,
            userId: recruiter.userId,
          },
        },
      });
      expect(membership).toBeDefined();
      expect(membership?.role).toBe('OWNER');
      expect(membership?.active).toBe(true);
    });

    it('rejects company registration from candidate with 403 Forbidden', async () => {
      const candidate = await createAndLoginUser(
        `cand_no_company_${uniqueId}@example.com`,
        'CANDIDATE',
      );

      const res = await request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [candidate.cookie])
        .set('X-CSRF-Token', candidate.csrfToken)
        .send({
          name: 'Illegal Candidate Company',
          taxCode: `TAX-${(uniqueId + 1).toString().slice(-8)}`,
          address: '789 Candidate Way',
        });

      expect(res.status).toBe(403);
    });

    it('rejects duplicate tax code with 409 Conflict', async () => {
      const recruiter = await createAndLoginUser(
        `recruiter_dup_${uniqueId}@example.com`,
        'RECRUITER',
      );
      const taxCode = `DUP-${uniqueId.toString().slice(-8)}`;

      const firstRes = await request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({
          name: 'First Company',
          taxCode,
          address: 'Address 1',
        });
      expect(firstRes.status).toBe(201);

      const secondRes = await request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({
          name: 'Second Company with Duplicate Tax Code',
          taxCode,
          address: 'Address 2',
        });

      expect(secondRes.status).toBe(409);
      expect(secondRes.body.code).toBe('TAX_CODE_ALREADY_EXISTS');
    });

    it('rejects invalid tax code with 400 Validation Error', async () => {
      const recruiter = await createAndLoginUser(
        `recruiter_bad_tax_${uniqueId}@example.com`,
        'RECRUITER',
      );

      const res = await request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [recruiter.cookie])
        .set('X-CSRF-Token', recruiter.csrfToken)
        .send({
          name: 'Bad Tax Company',
          taxCode: '123', // shorter than 8 chars
          address: 'Address',
        });

      expect(res.status).toBe(400);
    });
  });

  describe('Company Details and Updates (GET / PATCH / Resubmit)', () => {
    let owner: any;
    let outsider: any;
    let companyId: string;
    const taxCode = `DETAIL-${uniqueId.toString().slice(-8)}`;

    beforeAll(async () => {
      owner = await createAndLoginUser(`owner_details_${uniqueId}@example.com`, 'RECRUITER');
      outsider = await createAndLoginUser(`outsider_${uniqueId}@example.com`, 'RECRUITER');

      const res = await request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          name: 'Alpha Corporation',
          taxCode,
          address: '100 Nguyen Hue, District 1, HCMC',
        });

      companyId = res.body.data.id;
    });

    it('owner can view company details via GET /api/companies/:id', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${companyId}`)
        .set('Cookie', [owner.cookie]);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: companyId,
        name: 'Alpha Corporation',
        taxCode,
        approvalStatus: 'PENDING',
      });
    });

    it('outsider receives 404 Not Found when trying to view unapproved company', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${companyId}`)
        .set('Cookie', [outsider.cookie]);

      expect(res.status).toBe(404);
    });

    it('owner can update company information via PATCH /api/companies/:id with optimistic lock', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/companies/${companyId}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          name: 'Alpha Global Corporation',
          address: '200 Nguyen Hue, District 1, HCMC',
          website: 'https://alphaglobal.com',
          description: 'Global tech enterprise',
          version: 0,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Alpha Global Corporation');
      expect(res.body.data.version).toBe(1);

      // Stale version update fails
      const staleRes = await request(app.getHttpServer())
        .patch(`/api/companies/${companyId}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          name: 'Stale Update',
          version: 0,
        });

      expect(staleRes.status).toBe(409);
    });

    it('resubmitting a PENDING company returns 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/companies/${companyId}/resubmit`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          version: 1,
        });

      expect(res.status).toBe(409);
    });

    it('resubmitting a REJECTED company succeeds and transitions to PENDING', async () => {
      // Manually set status to REJECTED in DB for testing resubmit
      await prisma.company.update({
        where: { id: companyId },
        data: {
          approvalStatus: 'REJECTED',
          rejectionReason: 'Invalid documentation',
          version: { increment: 1 },
        },
      });

      const res = await request(app.getHttpServer())
        .post(`/api/companies/${companyId}/resubmit`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          name: 'Alpha Corporation Fixed',
          address: 'Fixed Address 123',
          version: 2,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.approvalStatus).toBe('PENDING');
      expect(res.body.data.rejectionReason).toBeNull();
      expect(res.body.data.version).toBe(3);
    });
  });

  describe('Company Memberships (Members list, Add, Update, Transfer Owner)', () => {
    let owner: any;
    let memberCandidate: any;
    let memberInterviewer: any;
    let companyId: string;
    let companyVersion = 0;

    beforeAll(async () => {
      owner = await createAndLoginUser(`owner_mems_${uniqueId}@example.com`, 'RECRUITER');
      memberCandidate = await createAndLoginUser(`cand_mem_${uniqueId}@example.com`, 'CANDIDATE');
      memberInterviewer = await createAndLoginUser(
        `interviewer_mem_${uniqueId}@example.com`,
        'CANDIDATE',
      );

      const res = await request(app.getHttpServer())
        .post('/api/companies')
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          name: 'Beta Software Systems',
          taxCode: `BETA-${uniqueId.toString().slice(-8)}`,
          address: '123 Tech Park',
        });

      companyId = res.body.data.id;
      companyVersion = res.body.data.version;
    });

    it('lists members for company via GET /api/companies/:id/members', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/companies/${companyId}/members`)
        .set('Cookie', [owner.cookie]);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].role).toBe('OWNER');
    });

    it('owner adds a new member with RECRUITER role', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/companies/${companyId}/members`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          email: memberCandidate.email,
          role: 'RECRUITER',
          permissions: ['RECRUITER'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        userId: memberCandidate.userId,
        email: memberCandidate.email,
        role: 'RECRUITER',
        active: true,
      });

      companyVersion++;
    });

    it('adding a member as INTERVIEWER grants global INTERVIEWER role in user_role table', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/companies/${companyId}/members`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          email: memberInterviewer.email,
          role: 'INTERVIEWER',
          permissions: ['INTERVIEWER'],
        });

      expect(res.status).toBe(201);
      expect(res.body.data.role).toBe('INTERVIEWER');

      // Verify target user has INTERVIEWER role in database
      const userRoles = await prisma.userRole.findMany({
        where: { userId: memberInterviewer.userId },
      });
      const roles = userRoles.map((r) => r.role);
      expect(roles).toContain('INTERVIEWER');

      companyVersion++;
    });

    it('rejects adding member with unknown email with 404', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/companies/${companyId}/members`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          email: 'unknown_nonexistent@example.com',
          role: 'RECRUITER',
        });

      expect(res.status).toBe(404);
    });

    it('rejects adding an already active member with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/companies/${companyId}/members`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          email: memberCandidate.email,
          role: 'RECRUITER',
        });

      expect(res.status).toBe(409);
    });

    it('rejects demoting or deactivating the last remaining OWNER', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/companies/${companyId}/members/${owner.userId}`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          role: 'RECRUITER',
          version: 0,
          companyVersion,
        });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe('LAST_OWNER_REQUIRED');
    });

    it('transfers company ownership atomically to another member', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/companies/${companyId}/transfer-owner`)
        .set('Origin', 'http://127.0.0.1:5173')
        .set('Cookie', [owner.cookie])
        .set('X-CSRF-Token', owner.csrfToken)
        .send({
          targetUserId: memberCandidate.userId,
          targetMemberVersion: 0,
          companyVersion,
        });

      expect(res.status).toBe(200);

      // Verify in DB that roles swapped
      const newOwnerMem = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId: memberCandidate.userId,
          },
        },
      });
      expect(newOwnerMem?.role).toBe('OWNER');

      const oldOwnerMem = await prisma.companyMembership.findUnique({
        where: {
          companyId_userId: {
            companyId,
            userId: owner.userId,
          },
        },
      });
      expect(oldOwnerMem?.role).toBe('RECRUITER');
    });
  });
});
