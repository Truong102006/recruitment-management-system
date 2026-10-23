import { Prisma } from '@prisma/client';
import { IdentityAdminAdapter } from '../../identity/ports/identity-admin.adapter';
import { PrismaUserRepository } from '../../identity/repositories/prisma-user.repository';
import { PrismaSessionRepository } from '../../identity/repositories/prisma-session.repository';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
function fixture(adminCount: number, role = 'ADMIN') {
  const client = {
    $executeRaw: jest.fn(),
    userAccount: {
      findUnique: jest.fn().mockResolvedValue({ emailVerifiedAt: new Date() }),
      count: jest.fn().mockResolvedValue(adminCount),
    },
    authToken: { updateMany: jest.fn() },
  };
  const uow = new ManagedUnitOfWork<Prisma.TransactionClient>({
    transaction: (work) => work(client as unknown as Prisma.TransactionClient),
  });
  const users = {
    findByIdWithLock: jest
      .fn()
      .mockResolvedValue({ id: 'target', status: 'ACTIVE', roles: [{ role }] }),
    updateStatus: jest.fn(),
  };
  const sessions = { revokeAllForUser: jest.fn() };
  const adapter = new IdentityAdminAdapter(
    users as unknown as PrismaUserRepository,
    sessions as unknown as PrismaSessionRepository,
    uow,
  );
  return { client, uow, users, sessions, adapter };
}
describe('Last available ADMIN invariant', () => {
  it('rejects the last verified active administrator before revoking anything', async () => {
    const f = fixture(1);
    await expect(
      f.uow.run((tx) => f.adapter.lockUser('target', 'security', 'actor', tx)),
    ).rejects.toMatchObject({ code: 'LAST_ADMIN' });
    expect(f.users.updateStatus).not.toHaveBeenCalled();
    expect(f.sessions.revokeAllForUser).not.toHaveBeenCalled();
  });
  it('allows locking an administrator while another verified admin remains', async () => {
    const f = fixture(2);
    await f.uow.run((tx) => f.adapter.lockUser('target', 'security', 'actor', tx));
    expect(f.sessions.revokeAllForUser).toHaveBeenCalledTimes(1);
    expect(f.client.authToken.updateMany).toHaveBeenCalledTimes(1);
    expect(f.client.$executeRaw.mock.invocationCallOrder[0]).toBeLessThan(
      f.users.findByIdWithLock.mock.invocationCallOrder[0]!,
    );
  });
  it('allows security lock of candidate independently of administrator count', async () => {
    const f = fixture(0, 'CANDIDATE');
    await f.uow.run((tx) => f.adapter.lockUser('target', 'security', 'actor', tx));
    expect(f.users.updateStatus).toHaveBeenCalled();
    expect(f.client.userAccount.count).not.toHaveBeenCalled();
  });
});
