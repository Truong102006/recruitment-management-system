import { CompanyMembershipService } from '../services/company-membership.service';
import type { Actor } from '../../../../../../libs/contracts/backend';

const actor: Actor = { userId: 'z-actor', sessionId: 'session', roles: ['RECRUITER'] };
describe('Membership account lock plan', () => {
  it('locks accounts in sorted order before company, then rechecks current actor', async () => {
    const order: string[] = [];
    const users = {
      findByIdWithLock: jest.fn(async (id: string) => {
        order.push(id);
        return { id, status: 'ACTIVE', emailVerifiedAt: new Date() };
      }),
    };
    const company = {
      findByIdWithLock: jest.fn(async () => {
        order.push('company');
        return null;
      }),
    };
    const uow = { run: async (fn: (tx: unknown) => Promise<unknown>) => fn({}) };
    const service = new CompanyMembershipService(
      company as never,
      {} as never,
      users as never,
      uow as never,
      { append: jest.fn() },
      { hasOpenApplication: jest.fn() },
      { assertNoUnresolvedProposedOrConfirmed: jest.fn() },
    );
    await expect(
      service.updateMember(actor, 'company', 'a-target', { version: 0, companyVersion: 0 }),
    ).rejects.toMatchObject({ statusCode: 404 });
    expect(order).toEqual(['a-target', 'z-actor', 'company']);
  });
  it('rejects a stale actor that was locked after the session guard', async () => {
    const users = {
      findByIdWithLock: jest
        .fn()
        .mockResolvedValue({ status: 'LOCKED', emailVerifiedAt: new Date() }),
    };
    const company = { findByIdWithLock: jest.fn() };
    const uow = { run: async (fn: (tx: unknown) => Promise<unknown>) => fn({}) };
    const service = new CompanyMembershipService(
      company as never,
      {} as never,
      users as never,
      uow as never,
      { append: jest.fn() },
      { hasOpenApplication: jest.fn() },
      { assertNoUnresolvedProposedOrConfirmed: jest.fn() },
    );
    await expect(
      service.transferOwner(actor, 'company', {
        targetUserId: 'a-target',
        targetMemberVersion: 0,
        companyVersion: 0,
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(company.findByIdWithLock).not.toHaveBeenCalled();
  });
});
