import { CompanyPolicy } from '../policies/company.policy';
import { ForbiddenError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';
import type { Actor } from '../../../../../../libs/contracts/backend';

describe('CompanyPolicy (Unit)', () => {
  const memberActor: Actor = {
    userId: 'user-recruiter-1',
    sessionId: 'session-1',
    roles: ['RECRUITER'],
  };

  const adminActor: Actor = {
    userId: 'user-admin-1',
    sessionId: 'session-admin',
    roles: ['ADMIN'],
  };

  const outsiderActor: Actor = {
    userId: 'user-outsider-1',
    sessionId: 'session-outsider',
    roles: ['CANDIDATE'],
  };

  describe('assertMemberReadAccess', () => {
    it('allows active members and requires membership for administrators', () => {
      expect(() =>
        CompanyPolicy.assertMemberReadAccess(memberActor, { active: true }),
      ).not.toThrow();
      expect(() => CompanyPolicy.assertMemberReadAccess(adminActor, null)).toThrow(NotFoundError);
    });

    it('throws NotFoundError for non-members or inactive members', () => {
      expect(() => CompanyPolicy.assertMemberReadAccess(outsiderActor, null)).toThrow(
        NotFoundError,
      );
      expect(() => CompanyPolicy.assertMemberReadAccess(memberActor, { active: false })).toThrow(
        NotFoundError,
      );
    });
  });

  describe('assertOwnerAccess', () => {
    it('allows OWNER membership and requires membership for administrators', () => {
      expect(() =>
        CompanyPolicy.assertOwnerAccess(memberActor, {
          role: 'OWNER',
          active: true,
        }),
      ).not.toThrow();
      expect(() => CompanyPolicy.assertOwnerAccess(adminActor, null)).toThrow(NotFoundError);
    });

    it('throws ForbiddenError for non-owner members', () => {
      expect(() =>
        CompanyPolicy.assertOwnerAccess(memberActor, {
          role: 'RECRUITER',
          active: true,
        }),
      ).toThrow(ForbiddenError);
    });

    it('throws NotFoundError for non-members', () => {
      expect(() => CompanyPolicy.assertOwnerAccess(outsiderActor, null)).toThrow(NotFoundError);
    });
  });

  describe('assertOperationalAccess', () => {
    const approvedCompany = { id: 'comp-1', approvalStatus: 'APPROVED' };
    const pendingCompany = { id: 'comp-2', approvalStatus: 'PENDING' };

    it('allows operational access when company is APPROVED and has active owner', () => {
      expect(() =>
        CompanyPolicy.assertOperationalAccess(
          approvedCompany,
          { role: 'RECRUITER', active: true, permissions: ['RECRUITER'] },
          1,
        ),
      ).not.toThrow();
    });

    it('throws ForbiddenError if company is not APPROVED', () => {
      expect(() =>
        CompanyPolicy.assertOperationalAccess(
          pendingCompany,
          { role: 'RECRUITER', active: true },
          1,
        ),
      ).toThrow(ForbiddenError);
    });

    it('throws ForbiddenError if no active owner is available', () => {
      expect(() =>
        CompanyPolicy.assertOperationalAccess(
          approvedCompany,
          { role: 'RECRUITER', active: true },
          0,
        ),
      ).toThrow(ForbiddenError);
    });

    it('throws ForbiddenError if membership is inactive', () => {
      expect(() =>
        CompanyPolicy.assertOperationalAccess(
          approvedCompany,
          { role: 'RECRUITER', active: false },
          1,
        ),
      ).toThrow(ForbiddenError);
    });
  });
});
