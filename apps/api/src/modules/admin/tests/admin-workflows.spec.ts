import { AdminService } from '../admin.service';
import { Actor } from '../../../../../../libs/contracts/backend';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import { Prisma } from '@prisma/client';
import { IdentityAdminAdapter } from '../../identity/ports/identity-admin.adapter';
import { PrismaUserRepository } from '../../identity/repositories/prisma-user.repository';
import { PrismaCompanyRepository } from '../../company/repositories/prisma-company.repository';
import { OwnerRecoveryService } from '../../company/services/owner-recovery.service';

const actor: Actor = { userId: 'admin', sessionId: 'session', roles: ['ADMIN'] };
function fixture(
  options: { audit?: boolean; security?: boolean; outbox?: boolean; interviews?: boolean } = {},
) {
  const client = {
    userAccount: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
    },
    company: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
    jobPost: { findMany: jest.fn().mockResolvedValue([]), count: jest.fn().mockResolvedValue(0) },
  };
  const companies = {
    findById: jest.fn().mockResolvedValue({ id: 'company', approvalStatus: 'PENDING', version: 3 }),
  };
  const recovery = { listEligibleOwners: jest.fn().mockResolvedValue([]), recoverOwner: jest.fn() };
  const interviews = {
    securityCancel: jest.fn().mockResolvedValue({ cancelled: true, currentVersion: 4 }),
  };
  const uow = new ManagedUnitOfWork<Prisma.TransactionClient>({
    transaction: (work) => work(client as unknown as Prisma.TransactionClient),
  });
  const identity = {
    serialize: jest.fn(),
    assertAdmin: jest.fn(),
    lockUser: jest.fn(),
    unlockUser: jest.fn(),
  };
  const users = { findByIdWithLock: jest.fn().mockResolvedValue({ id: 'user', version: 3 }) };
  const company = {
    suspendCompany: jest.fn(),
    reviewCompany: jest.fn(),
    unsuspendCompany: jest.fn(),
  };
  const jobs = { closeJob: jest.fn() };
  const security = { revokeForUser: jest.fn(), revokeForCompany: jest.fn() };
  const audit = { write: jest.fn() };
  const outbox = { append: jest.fn() };
  const service = new AdminService(
    uow,
    identity as unknown as IdentityAdminAdapter,
    users as unknown as PrismaUserRepository,
    companies as unknown as PrismaCompanyRepository,
    recovery as unknown as OwnerRecoveryService,
    company,
    jobs,
    options.security === false ? undefined : security,
    options.interviews === true ? interviews : undefined,
    options.outbox === false ? undefined : outbox,
    options.audit === false ? undefined : audit,
  );
  return {
    service,
    identity,
    users,
    company,
    jobs,
    security,
    audit,
    outbox,
    companies,
    recovery,
    interviews,
    client,
  };
}
describe('Admin security workflows', () => {
  it('returns company and location fields required by the admin jobs table', async () => {
    const f = fixture();
    f.client.jobPost.findMany.mockResolvedValueOnce([
      {
        id: 'job-1',
        companyId: 'company-1',
        company: { name: 'Example Company' },
        title: 'Engineer',
        location: 'Hanoi',
        workplaceMode: 'HYBRID',
        status: 'PUBLISHED',
        version: 2,
        closeReason: null,
      },
    ]);

    await expect(f.service.read(actor, 'jobs')).resolves.toMatchObject({
      items: [
        {
          id: 'job-1',
          companyName: 'Example Company',
          location: 'Hanoi',
          workplaceMode: 'HYBRID',
        },
      ],
    });
    expect(f.client.jobPost.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        select: expect.objectContaining({
          company: { select: { name: true } },
          location: true,
          workplaceMode: true,
        }),
      }),
    );
  });
  it('rejects unknown actions rather than performing unlock or unsuspend', async () => {
    const f = fixture();
    await expect(
      f.service.mutate(actor, 'users', 'user', 'unknown', { version: 3, reason: 'security' }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(f.identity.unlockUser).not.toHaveBeenCalled();
  });
  it('fails closed before changes when audit is unavailable', async () => {
    const f = fixture({ audit: false });
    await expect(
      f.service.mutate(actor, 'jobs', 'job', 'close', { version: 3, reason: 'moderation' }),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(f.jobs.closeJob).not.toHaveBeenCalled();
  });
  it('revalidates actor after advisory serialization', async () => {
    const f = fixture();
    f.identity.assertAdmin.mockRejectedValue(new Error('locked actor'));
    await expect(
      f.service.mutate(actor, 'users', 'user', 'lock', { version: 3, reason: 'security' }),
    ).rejects.toThrow('locked actor');
    expect(f.identity.lockUser).not.toHaveBeenCalled();
    expect(f.identity.serialize.mock.invocationCallOrder[0]).toBeLessThan(
      f.identity.assertAdmin.mock.invocationCallOrder[0]!,
    );
  });
  it('rejects stale version without session or video changes', async () => {
    const f = fixture();
    await expect(
      f.service.mutate(actor, 'users', 'user', 'lock', { version: 2, reason: 'security' }),
    ).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(f.identity.lockUser).not.toHaveBeenCalled();
    expect(f.security.revokeForUser).not.toHaveBeenCalled();
  });
  it('requires security provider before suspension', async () => {
    const f = fixture({ security: false });
    await expect(
      f.service.mutate(actor, 'companies', 'company', 'suspend', {
        version: 3,
        reason: 'security',
      }),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(f.company.suspendCompany).not.toHaveBeenCalled();
  });
  it('shares transaction for state, revoke, outbox and audit', async () => {
    const f = fixture();
    await expect(
      f.service.mutate(actor, 'users', 'user', 'lock', { version: 3, reason: 'security' }),
    ).resolves.toMatchObject({ version: 4, revocationStatus: 'PENDING' });
    const tx = f.identity.lockUser.mock.calls[0][3];
    expect(f.security.revokeForUser).toHaveBeenCalledWith('user', tx);
    expect(f.outbox.append.mock.calls[0][1]).toBe(tx);
    expect(f.audit.write.mock.calls[0][1]).toBe(tx);
  });
  it('unlock does not recreate old sessions or video grants', async () => {
    const f = fixture();
    await f.service.mutate(actor, 'users', 'user', 'unlock', { version: 3, reason: 'recovered' });
    expect(f.identity.unlockUser).toHaveBeenCalled();
    expect(f.security.revokeForUser).not.toHaveBeenCalled();
    expect(f.outbox.append).not.toHaveBeenCalled();
  });
});

describe('Admin moderation boundaries', () => {
  it.each(['approve', 'reject', 'unsuspend'] as const)(
    'delegates %s with expected version and one audit',
    async (action) => {
      const f = fixture();
      await f.service.mutate(actor, 'companies', 'company', action, {
        version: 3,
        reason: 'review',
      });
      if (action === 'unsuspend')
        expect(f.company.unsuspendCompany).toHaveBeenCalledWith('company', 3, expect.anything());
      else
        expect(f.company.reviewCompany).toHaveBeenCalledWith(
          'company',
          action === 'approve' ? 'APPROVED' : 'REJECTED',
          'review',
          3,
          expect.anything(),
        );
      expect(f.audit.write).toHaveBeenCalledTimes(1);
    },
  );
  it('suspends and revokes company access within the same transaction', async () => {
    const f = fixture();
    const result = await f.service.mutate(actor, 'companies', 'company', 'suspend', {
      version: 3,
      reason: 'security',
    });
    expect(result.revocationStatus).toBe('PENDING');
    expect(f.security.revokeForCompany).toHaveBeenCalledWith(
      'company',
      f.company.suspendCompany.mock.calls[0][3],
    );
  });
  it('requires outbox independently of audit', async () => {
    const f = fixture({ outbox: false });
    await expect(
      f.service.mutate(actor, 'jobs', 'job', 'close', { version: 3, reason: 'review' }),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(f.jobs.closeJob).not.toHaveBeenCalled();
  });
  it('closes a job once through owning port', async () => {
    const f = fixture();
    await f.service.mutate(actor, 'jobs', 'job', 'close', { version: 3, reason: 'review' });
    expect(f.jobs.closeJob).toHaveBeenCalledWith('job', 'review', 3, expect.anything());
    expect(f.audit.write).toHaveBeenCalledTimes(1);
  });
  it('fails closed for missing interview provider', async () => {
    const f = fixture();
    await expect(
      f.service.mutate(actor, 'interviews', 'interview', 'security-cancel', {
        version: 3,
        reason: 'security',
      }),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(f.audit.write).not.toHaveBeenCalled();
  });
  it('delegates interview security cancellation and returns pending acknowledgement', async () => {
    const f = fixture({ interviews: true });
    await expect(
      f.service.mutate(actor, 'interviews', 'interview', 'security-cancel', {
        version: 3,
        reason: 'security',
      }),
    ).resolves.toMatchObject({ revocationStatus: 'PENDING' });
    expect(f.interviews.securityCancel).toHaveBeenCalledWith(
      'interview',
      'security',
      3,
      expect.anything(),
    );
  });
  it('does not lock account without a security provider', async () => {
    const f = fixture({ security: false });
    await expect(
      f.service.mutate(actor, 'users', 'target', 'lock', { version: 3, reason: 'security' }),
    ).rejects.toMatchObject({ statusCode: 503 });
    expect(f.identity.lockUser).not.toHaveBeenCalled();
  });
  it('reports deleted user without mutation', async () => {
    const f = fixture();
    f.users.findByIdWithLock.mockResolvedValue(null);
    await expect(
      f.service.mutate(actor, 'users', 'target', 'lock', { version: 3, reason: 'security' }),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
  it('locks sorted actor and recovery target before checking actor authority', async () => {
    const f = fixture();
    await f.service.mutate(
      { ...actor, userId: 'z-admin' },
      'companies',
      'company',
      'recover-owner',
      {
        version: 3,
        companyVersion: 3,
        targetUserId: 'a-member',
        targetMemberVersion: 1,
        reason: 'recovery',
      },
    );
    expect(f.users.findByIdWithLock.mock.calls.map((call) => call[0])).toEqual([
      'a-member',
      'z-admin',
    ]);
    expect(f.users.findByIdWithLock.mock.invocationCallOrder[1]!).toBeLessThan(
      f.identity.assertAdmin.mock.invocationCallOrder[0]!,
    );
    expect(f.recovery.recoverOwner).toHaveBeenCalledWith(
      'company',
      'a-member',
      1,
      3,
      'recovery',
      'z-admin',
      expect.anything(),
    );
  });
  it('locks sorted actor and user target before authorization', async () => {
    const f = fixture();
    await f.service.mutate({ ...actor, userId: 'z-admin' }, 'users', 'a-target', 'unlock', {
      version: 3,
      reason: 'recovery',
    });
    expect(f.users.findByIdWithLock.mock.calls.slice(0, 2).map((call) => call[0])).toEqual([
      'a-target',
      'z-admin',
    ]);
    expect(f.identity.serialize.mock.invocationCallOrder[0]!).toBeLessThan(
      f.users.findByIdWithLock.mock.invocationCallOrder[0]!,
    );
  });
  it('rejects incomplete recovery target before owning command', async () => {
    const f = fixture();
    await expect(
      f.service.mutate(actor, 'companies', 'company', 'recover-owner', {
        version: 3,
        reason: 'recovery',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(f.recovery.recoverOwner).not.toHaveBeenCalled();
  });
  it.each([
    ['REJECTED', 'PENDING', 'reject'],
    ['SUSPENDED', 'APPROVED', 'suspend'],
    ['APPROVED', 'SUSPENDED', 'unsuspend'],
    ['APPROVED', 'PENDING', 'approve'],
  ] as const)('resolves decision %s from %s to command %s', async (status, current, command) => {
    const f = fixture();
    f.companies.findById.mockResolvedValue({ id: 'company', approvalStatus: current, version: 3 });
    const spy = jest.spyOn(f.service, 'mutate').mockResolvedValue({ id: 'company', version: 4 });
    await f.service.decideCompany(actor, 'company', { status, reason: 'review', version: 3 });
    expect(spy).toHaveBeenCalledWith(actor, 'companies', 'company', command, {
      status,
      reason: 'review',
      version: 3,
    });
  });
  it('returns not found for absent company', async () => {
    const f = fixture();
    f.companies.findById.mockResolvedValue(null);
    await expect(f.service.companyDetail(actor, 'company')).rejects.toMatchObject({
      statusCode: 404,
    });
  });
  it('delegates minimal eligible owners query in transaction', async () => {
    const f = fixture();
    await expect(f.service.eligibleOwners(actor, 'company')).resolves.toEqual([]);
    expect(f.recovery.listEligibleOwners).toHaveBeenCalledWith('company', expect.anything());
  });
  it.each(['users', 'companies', 'jobs'] as const)(
    'filters and paginates %s with matching count query',
    async (resource) => {
      const f = fixture();
      await expect(f.service.read(actor, resource, 2, 10, 'ACTIVE')).resolves.toEqual({
        items: [],
        total: 0,
        page: 2,
        limit: 10,
      });
      const model =
        resource === 'users'
          ? f.client.userAccount
          : resource === 'companies'
            ? f.client.company
            : f.client.jobPost;
      expect(model.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
          where: resource === 'companies' ? { approvalStatus: 'ACTIVE' } : { status: 'ACTIVE' },
        }),
      );
      expect(model.count).toHaveBeenCalledWith({
        where: resource === 'companies' ? { approvalStatus: 'ACTIVE' } : { status: 'ACTIVE' },
      });
    },
  );
  it.each(['users', 'companies', 'jobs'] as const)(
    'supports unfiltered default paging %s',
    async (resource) => {
      const f = fixture();
      await expect(f.service.read(actor, resource)).resolves.toMatchObject({ page: 1, limit: 20 });
    },
  );
});
