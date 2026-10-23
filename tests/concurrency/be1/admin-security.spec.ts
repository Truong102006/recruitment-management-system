import { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { createTestApi } from '../../helpers/create-test-api';
import { AdminService } from '../../../apps/api/src/modules/admin/admin.service';
import { IdentityAdminAdapter } from '../../../apps/api/src/modules/identity/ports/identity-admin.adapter';
import { PrismaUserRepository } from '../../../apps/api/src/modules/identity/repositories/prisma-user.repository';
import { PrismaCompanyRepository } from '../../../apps/api/src/modules/company/repositories/prisma-company.repository';
import { OwnerRecoveryService } from '../../../apps/api/src/modules/company/services/owner-recovery.service';
import { Actor, CompanyAdminPort, JobAdminPort } from '../../../libs/contracts/backend';
import { ManagedUnitOfWork, UNIT_OF_WORK } from '../../../libs/platform/database/unit-of-work';
import { Prisma } from '@prisma/client';

describe('Admin PostgreSQL serialization and rollback (external BE3 ports are test doubles)', () => {
  let app: INestApplication;
  const prisma = new PrismaClient();
  const ids: string[] = [];
  beforeAll(async () => {
    app = await createTestApi();
    await prisma.$connect();
  });
  afterAll(async () => {
    await prisma.authSession.deleteMany({ where: { userId: { in: ids } } });
    await prisma.authToken.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
    await prisma.userAccount.deleteMany({ where: { id: { in: ids } } });
    await app.close();
    await prisma.$disconnect();
  });
  async function admin(): Promise<Actor> {
    const user = await prisma.userAccount.create({
      data: {
        email: `${randomUUID()}@admin-test.example`,
        fullName: 'Admin test',
        passwordHash: 'not-a-login-hash',
        emailVerifiedAt: new Date(),
        roles: { create: { role: 'ADMIN' } },
      },
    });
    ids.push(user.id);
    return { userId: user.id, sessionId: randomUUID(), roles: ['ADMIN'] };
  }
  function service(auditFailure = false) {
    return new AdminService(
      app.get<ManagedUnitOfWork<Prisma.TransactionClient>>(UNIT_OF_WORK),
      app.get(IdentityAdminAdapter),
      app.get(PrismaUserRepository),
      app.get(PrismaCompanyRepository),
      app.get(OwnerRecoveryService),
      {} as CompanyAdminPort,
      {} as JobAdminPort,
      {
        revokeForUser: async () => ({ revokedInterviewsCount: 0, currentGeneration: 1 }),
        revokeForCompany: async () => ({ revokedInterviewsCount: 0, currentGeneration: 1 }),
      },
      undefined,
      { append: async () => {} },
      {
        write: async () => {
          if (auditFailure) throw new Error('injected audit failure');
        },
      },
    );
  }
  it('serializes two administrators locking each other and rechecks the waiting actor', async () => {
    const a = await admin();
    const b = await admin();
    const workflow = service();
    const results = await Promise.allSettled([
      workflow.mutate(a, 'users', b.userId, 'lock', { version: 0, reason: 'security A' }),
      workflow.mutate(b, 'users', a.userId, 'lock', { version: 0, reason: 'security B' }),
    ]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
    expect(
      await prisma.userAccount.count({
        where: { id: { in: [a.userId, b.userId] }, status: 'ACTIVE' },
      }),
    ).toBe(1);
  });
  it('rolls back account, sessions and unused token invalidation on audit failure', async () => {
    const actor = await admin();
    const target = await admin();
    const session = await prisma.authSession.create({
      data: {
        userId: target.userId,
        tokenHash: randomUUID(),
        csrfHash: 'hash',
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    const token = await prisma.authToken.create({
      data: {
        userId: target.userId,
        purpose: 'RESET_PASSWORD',
        tokenHash: randomUUID(),
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    await expect(
      service(true).mutate(actor, 'users', target.userId, 'lock', {
        version: 0,
        reason: 'security',
      }),
    ).rejects.toThrow('injected audit failure');
    expect(await prisma.userAccount.findUnique({ where: { id: target.userId } })).toMatchObject({
      status: 'ACTIVE',
      version: 0,
    });
    expect(await prisma.authSession.findUnique({ where: { id: session.id } })).toMatchObject({
      revokedAt: null,
    });
    expect(await prisma.authToken.findUnique({ where: { id: token.id } })).toMatchObject({
      invalidatedAt: null,
    });
  });
});
