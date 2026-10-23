import { PrismaClient, Prisma } from '@prisma/client';
import { ManagedUnitOfWork } from '../../../libs/platform/database/unit-of-work';
import { PrismaService } from '../../../apps/api/src/common/prisma/prisma.service';
import { PrismaUserRepository } from '../../../apps/api/src/modules/identity/repositories/prisma-user.repository';
import { PrismaAuthTokenRepository } from '../../../apps/api/src/modules/identity/repositories/prisma-auth-token.repository';
import { PrismaSessionRepository } from '../../../apps/api/src/modules/identity/repositories/prisma-session.repository';
import { AuthTokenService } from '../../../apps/api/src/modules/identity/services/auth-token.service';
import { RateLimiterService } from '../../../apps/api/src/common/services/rate-limiter.service';
import { TokenRules } from '../../../apps/api/src/modules/identity/rules/token.rules';
import { randomUUID } from 'node:crypto';
import { SessionService } from '../../../apps/api/src/modules/identity/services/session.service';
import { SessionRules } from '../../../apps/api/src/modules/identity/rules/session.rules';
import * as bcrypt from 'bcryptjs';
import { PrismaJobRepository } from '../../../apps/api/src/modules/job/repositories/prisma-job.repository';
import { PrismaCompanyRepository } from '../../../apps/api/src/modules/company/repositories/prisma-company.repository';
import { PrismaCompanyMembershipRepository } from '../../../apps/api/src/modules/company/repositories/prisma-company-membership.repository';
import { JobApplicationAdapter } from '../../../apps/api/src/modules/job/ports/job-application.adapter';

describe('UC04 durable verification and transactional rollback (PostgreSQL)', () => {
  const db = new PrismaClient();
  const uow = new ManagedUnitOfWork<Prisma.TransactionClient>({
    transaction: (work) => db.$transaction(work),
  });
  const users = new PrismaUserRepository(db as PrismaService, uow);
  const tokens = new PrismaAuthTokenRepository(db as PrismaService, uow);
  const service = new AuthTokenService(
    users,
    tokens,
    new PrismaSessionRepository(db as PrismaService, uow),
    new RateLimiterService(),
    uow,
  );
  const ids: string[] = [];
  const companies: string[] = [];
  afterAll(async () => {
    await db.jobPost.deleteMany({ where: { companyId: { in: companies } } });
    await db.companyMembership.deleteMany({ where: { companyId: { in: companies } } });
    await db.company.deleteMany({ where: { id: { in: companies } } });
    await db.authSession.deleteMany({ where: { userId: { in: ids } } });
    await db.authToken.deleteMany({ where: { userId: { in: ids } } });
    await db.userAccount.deleteMany({ where: { id: { in: ids } } });
    await db.$disconnect();
  });
  async function fixture() {
    const user = await db.userAccount.create({
      data: {
        email: `verification-${randomUUID()}@example.com`,
        fullName: 'Verification test',
        passwordHash: 'unused',
      },
    });
    ids.push(user.id);
    const raw = randomUUID();
    const token = await db.authToken.create({
      data: {
        userId: user.id,
        purpose: 'VERIFY_EMAIL',
        tokenHash: TokenRules.hashToken(raw),
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    return { user, token, raw };
  }
  it('keeps verification after consumed token cleanup and rejects replay', async () => {
    const { user, token, raw } = await fixture();
    await service.verifyEmail(raw);
    const verified = await db.userAccount.findUniqueOrThrow({ where: { id: user.id } });
    expect(verified.emailVerifiedAt).toBeInstanceOf(Date);
    await expect(service.verifyEmail(raw)).rejects.toThrow('TOKEN_INVALID_OR_EXPIRED');
    await db.authToken.delete({ where: { id: token.id } });
    expect(
      (await db.userAccount.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt,
    ).toEqual(verified.emailVerifiedAt);
  });
  it('rolls back token consumption and verification timestamp when persistence fails', async () => {
    const { user, token, raw } = await fixture();
    const original = users.markEmailVerified.bind(users);
    const fault = jest.spyOn(users, 'markEmailVerified').mockImplementation(async (...args) => {
      await original(...args);
      throw new Error('injected verification persistence fault');
    });
    try {
      await expect(service.verifyEmail(raw)).rejects.toThrow(
        'injected verification persistence fault',
      );
    } finally {
      fault.mockRestore();
    }
    expect(
      (await db.authToken.findUniqueOrThrow({ where: { id: token.id } })).consumedAt,
    ).toBeNull();
    expect(
      (await db.userAccount.findUniqueOrThrow({ where: { id: user.id } })).emailVerifiedAt,
    ).toBeNull();
  });

  it('persists the session identifier used to derive the CSRF hash', async () => {
    const { user } = await fixture();
    const password = 'SessionTest123!';
    await db.userAccount.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(password, 10) },
    });
    const sessions = new SessionService(
      users,
      new PrismaSessionRepository(db as PrismaService, uow),
      new RateLimiterService(),
      uow,
    );
    const login = await sessions.login({ email: user.email, password });
    const validated = await sessions.validateSession(login.sessionToken);
    expect(validated).not.toBeNull();
    expect(validated!.csrfToken).toBe(login.csrfToken);
    expect(validated!.session.csrfHash).toBe(SessionRules.hash(validated!.csrfToken));
  });

  it('rejects a token whose deadline passes while blocked behind a real row lock', async () => {
    const { user, token, raw } = await fixture();
    let release!: () => void;
    let locked!: () => void;
    const ready = new Promise<void>((resolve) => {
      locked = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const blocker = db.$transaction(async (client) => {
      await client.$queryRaw`SELECT id FROM user_account WHERE id = ${user.id}::uuid FOR UPDATE`;
      locked();
      await gate;
    });
    await ready;
    const attempt = service.verifyEmail(raw).then(
      () => 'accepted',
      (err: Error) => err.message,
    );
    let waiting = false;
    try {
      for (let i = 0; i < 100; i++) {
        const rows = await db.$queryRaw<
          { waiting: boolean }[]
        >`SELECT EXISTS (SELECT 1 FROM pg_stat_activity WHERE datname = current_database() AND wait_event_type = 'Lock' AND query LIKE '%user_account%' AND pid <> pg_backend_pid()) AS waiting`;
        if (rows[0]?.waiting) {
          waiting = true;
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      expect(waiting).toBe(true);
      await db.authToken.update({
        where: { id: token.id },
        data: { expiresAt: new Date(Date.now() - 1) },
      });
    } finally {
      release();
      await blocker;
    }
    expect(await attempt).toBe('TOKEN_INVALID_OR_EXPIRED');
    expect(
      (await db.authToken.findUniqueOrThrow({ where: { id: token.id } })).consumedAt,
    ).toBeNull();
  });

  it('uses PostgreSQL time for job submission despite a stale application clock', async () => {
    const { user } = await fixture();
    await db.userAccount.update({ where: { id: user.id }, data: { emailVerifiedAt: new Date() } });
    const company = await db.company.create({
      data: {
        name: 'Clock fixture',
        taxCode: randomUUID(),
        address: 'Test address',
        createdBy: user.id,
        approvalStatus: 'APPROVED',
        memberships: { create: { userId: user.id, role: 'OWNER' } },
      },
    });
    companies.push(company.id);
    const job = await db.jobPost.create({
      data: {
        companyId: company.id,
        createdBy: user.id,
        status: 'PUBLISHED',
        title: 'Test engineer',
        description: 'Test job',
        location: 'Test',
        headcount: 1,
        jobType: 'FULL_TIME',
        workplaceMode: 'ON_SITE',
        deadline: new Date(Date.now() - 1000),
        publishedAt: new Date(),
      },
    });
    const adapter = new JobApplicationAdapter(
      new PrismaJobRepository(db as PrismaService, uow),
      new PrismaCompanyRepository(db as PrismaService, uow),
      new PrismaCompanyMembershipRepository(db as PrismaService, uow),
    );
    jest.useFakeTimers({
      doNotFake: ['nextTick', 'setImmediate', 'setTimeout', 'clearTimeout', 'performance'],
    });
    jest.setSystemTime(new Date('2020-01-01T00:00:00Z'));
    try {
      await expect(
        uow.run((tx) => adapter.lockForSubmission(job.id, randomUUID(), tx)),
      ).rejects.toThrow('deadline has passed');
    } finally {
      jest.useRealTimers();
    }
  });
});
