import { OwnerRules, MemberWithAccountInfo } from '../rules/owner.rules';
import { ConflictError } from '../../../../../../libs/platform/errors/domain.error';

describe('OwnerRules (Unit)', () => {
  const owner1: MemberWithAccountInfo = {
    userId: 'user-owner-1',
    role: 'OWNER',
    active: true,
    user: { status: 'ACTIVE', emailVerifiedAt: new Date() },
  };

  const owner2: MemberWithAccountInfo = {
    userId: 'user-owner-2',
    role: 'OWNER',
    active: true,
    user: { status: 'ACTIVE', emailVerifiedAt: new Date() },
  };

  const recruiter: MemberWithAccountInfo = {
    userId: 'user-recruiter-1',
    role: 'RECRUITER',
    active: true,
    user: { status: 'ACTIVE', emailVerifiedAt: new Date() },
  };

  describe('assertAvailableOwnerRemains', () => {
    it('allows demoting/removing an owner when another active owner remains', () => {
      const members = [owner1, owner2, recruiter];
      expect(() => OwnerRules.assertAvailableOwnerRemains(members, 'user-owner-1')).not.toThrow();
    });

    it('throws ConflictError when attempting to demote the sole remaining owner', () => {
      const members = [owner1, recruiter];
      expect(() => OwnerRules.assertAvailableOwnerRemains(members, 'user-owner-1')).toThrow(
        ConflictError,
      );
    });

    it('throws ConflictError if other owner has LOCKED account', () => {
      const lockedOwner: MemberWithAccountInfo = {
        userId: 'user-owner-locked',
        role: 'OWNER',
        active: true,
        user: { status: 'LOCKED', emailVerifiedAt: new Date() },
      };
      const members = [owner1, lockedOwner];
      expect(() => OwnerRules.assertAvailableOwnerRemains(members, 'user-owner-1')).toThrow(
        ConflictError,
      );
    });

    it('throws ConflictError if other owner is inactive', () => {
      const inactiveOwner: MemberWithAccountInfo = {
        userId: 'user-owner-inactive',
        role: 'OWNER',
        active: false,
        user: { status: 'ACTIVE', emailVerifiedAt: new Date() },
      };
      const members = [owner1, inactiveOwner];
      expect(() => OwnerRules.assertAvailableOwnerRemains(members, 'user-owner-1')).toThrow(
        ConflictError,
      );
    });
  });

  it('does not count unverified owners or missing account information', () => {
    const unverified = { ...owner2, user: { status: 'ACTIVE', emailVerifiedAt: null } };
    const unknown = { ...owner2, user: null };
    expect(OwnerRules.countAvailableOwners([unverified, unknown])).toBe(0);
    expect(() =>
      OwnerRules.assertAvailableOwnerRemains([owner1, unverified], owner1.userId),
    ).toThrow(ConflictError);
  });

  describe('countAvailableOwners', () => {
    it('correctly counts only active owners with active accounts', () => {
      const lockedOwner: MemberWithAccountInfo = {
        userId: 'user-owner-locked',
        role: 'OWNER',
        active: true,
        user: { status: 'LOCKED', emailVerifiedAt: new Date() },
      };
      const members = [owner1, owner2, recruiter, lockedOwner];
      expect(OwnerRules.countAvailableOwners(members)).toBe(2);
    });
  });
});
