import { CompanyAdminAdapter } from '../ports/company-admin.adapter';
import { OwnerRecoveryService } from '../services/owner-recovery.service';
import type { Tx } from '../../../../../../libs/contracts/backend';

const tx = {} as Tx;
describe('Company moderation and recovery invariants', () => {
  const repo = {
    findByIdWithLock: jest.fn(),
    updateStatus: jest.fn(),
    incrementVersion: jest.fn(),
  };
  const members = {
    countAvailableOwners: jest.fn(),
    lockRecoveryAccount: jest.fn(),
    findUniqueWithLock: jest.fn(),
    updateRoleAndStatus: jest.fn(),
  };
  const outbox = { append: jest.fn() };
  beforeEach(() => {
    jest.resetAllMocks();
    repo.findByIdWithLock.mockResolvedValue({
      id: 'company',
      version: 3,
      approvalStatus: 'PENDING',
    });
    repo.updateStatus.mockResolvedValue({ version: 4 });
    members.countAvailableOwners.mockResolvedValue(1);
    members.lockRecoveryAccount.mockResolvedValue(true);
    members.findUniqueWithLock.mockResolvedValue({ active: true, version: 2 });
  });
  const adapter = () => new CompanyAdminAdapter(repo as never, outbox, members as never);
  it('approves pending company and appends its event in the caller transaction', async () => {
    await adapter().reviewCompany('company', 'APPROVED', 'Reviewed', 3, tx);
    expect(repo.updateStatus).toHaveBeenCalledWith('company', 3, 'APPROVED', 'Reviewed', tx);
    expect(outbox.append).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'company.reviewed', aggregateVersion: 4 }),
      tx,
    );
  });
  it.each(['APPROVED', 'REJECTED', 'SUSPENDED'])(
    'rejects direct review from %s',
    async (status) => {
      repo.findByIdWithLock.mockResolvedValue({ version: 3, approvalStatus: status });
      await expect(
        adapter().reviewCompany('company', 'APPROVED', 'Reviewed', 3, tx),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(repo.updateStatus).not.toHaveBeenCalled();
    },
  );
  it('rejects approval without a verified available owner', async () => {
    members.countAvailableOwners.mockResolvedValue(0);
    await expect(
      adapter().reviewCompany('company', 'APPROVED', undefined, 3, tx),
    ).rejects.toMatchObject({ code: 'OWNER_UNAVAILABLE' });
  });
  it('requires reason for rejection and suspension', async () => {
    await expect(
      adapter().reviewCompany('company', 'REJECTED', undefined, 3, tx),
    ).rejects.toMatchObject({ statusCode: 400 });
    await expect(adapter().suspendCompany('company', ' ', 3, tx)).rejects.toMatchObject({
      statusCode: 400,
    });
  });
  it('does not mutate without outbox binding or on stale version', async () => {
    await expect(
      new CompanyAdminAdapter(repo as never).reviewCompany('company', 'APPROVED', undefined, 3, tx),
    ).rejects.toMatchObject({ statusCode: 503 });
    await expect(
      adapter().reviewCompany('company', 'APPROVED', undefined, 2, tx),
    ).rejects.toMatchObject({ code: 'STALE_VERSION' });
    expect(repo.updateStatus).not.toHaveBeenCalled();
  });
  it('propagates outbox failure for caller rollback', async () => {
    outbox.append.mockRejectedValue(new Error('event unavailable'));
    await expect(adapter().reviewCompany('company', 'APPROVED', undefined, 3, tx)).rejects.toThrow(
      'event unavailable',
    );
  });
  it('unsuspends without touching jobs or memberships', async () => {
    repo.findByIdWithLock.mockResolvedValue({ version: 3, approvalStatus: 'SUSPENDED' });
    await adapter().unsuspendCompany('company', 3, tx);
    expect(members.updateRoleAndStatus).not.toHaveBeenCalled();
    expect(outbox.append).toHaveBeenCalledTimes(1);
  });
  it('recovery locks account before company and rejects unavailable account', async () => {
    members.lockRecoveryAccount.mockResolvedValue(false);
    const service = new OwnerRecoveryService(repo as never, members as never, outbox);
    await expect(
      service.recoverOwner('company', 'target', 2, 3, 'Lost access', 'admin', tx),
    ).rejects.toMatchObject({ code: 'OWNER_UNAVAILABLE' });
    expect(members.lockRecoveryAccount.mock.invocationCallOrder[0]).toBeLessThan(
      repo.findByIdWithLock.mock.invocationCallOrder[0]!,
    );
    expect(members.updateRoleAndStatus).not.toHaveBeenCalled();
  });
});
