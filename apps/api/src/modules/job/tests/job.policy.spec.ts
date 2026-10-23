import { JobPolicy } from '../policies/job.policy';
import { ForbiddenError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';
import { Actor } from '../../../../../../libs/contracts/backend';

describe('JobPolicy', () => {
  const recruiterActor: Actor = {
    userId: 'u-recruiter',
    sessionId: 's-1',
    roles: ['RECRUITER'],
  };

  const adminActor: Actor = {
    userId: 'u-admin',
    sessionId: 's-2',
    roles: ['ADMIN'],
  };

  const interviewerActor: Actor = {
    userId: 'u-interviewer',
    sessionId: 's-3',
    roles: ['INTERVIEWER'],
  };

  describe('assertCanManageCompanyJobs', () => {
    it('rejects ADMIN without membership', () => {
      expect(() =>
        JobPolicy.assertCanManageCompanyJobs(adminActor, null, { approvalStatus: 'PENDING' }),
      ).toThrow(NotFoundError);
    });

    it('allows active OWNER or RECRUITER for an APPROVED company', () => {
      expect(() =>
        JobPolicy.assertCanManageCompanyJobs(
          recruiterActor,
          { role: 'RECRUITER', active: true },
          { approvalStatus: 'APPROVED' },
        ),
      ).not.toThrow();

      expect(() =>
        JobPolicy.assertCanManageCompanyJobs(
          recruiterActor,
          { role: 'OWNER', active: true },
          { approvalStatus: 'APPROVED' },
        ),
      ).not.toThrow();
    });

    it('conceals company from inactive member', () => {
      expect(() =>
        JobPolicy.assertCanManageCompanyJobs(
          recruiterActor,
          { role: 'RECRUITER', active: false },
          { approvalStatus: 'APPROVED' },
        ),
      ).toThrow(NotFoundError);
    });

    it('throws ForbiddenError if member is INTERVIEWER', () => {
      expect(() =>
        JobPolicy.assertCanManageCompanyJobs(
          interviewerActor,
          { role: 'INTERVIEWER', active: true },
          { approvalStatus: 'APPROVED' },
        ),
      ).toThrow(ForbiddenError);
    });

    it('throws ForbiddenError if company is not APPROVED', () => {
      expect(() =>
        JobPolicy.assertCanManageCompanyJobs(
          recruiterActor,
          { role: 'RECRUITER', active: true },
          { approvalStatus: 'PENDING' },
        ),
      ).toThrow(ForbiddenError);

      expect(() =>
        JobPolicy.assertCanManageCompanyJobs(
          recruiterActor,
          { role: 'RECRUITER', active: true },
          { approvalStatus: 'SUSPENDED' },
        ),
      ).toThrow(ForbiddenError);
    });
  });

  describe('assertCanReadCompanyJobs', () => {
    it('requires membership even for ADMIN', () => {
      expect(() => JobPolicy.assertCanReadCompanyJobs(adminActor, null)).toThrow(NotFoundError);
      expect(() =>
        JobPolicy.assertCanReadCompanyJobs(recruiterActor, { role: 'RECRUITER', active: true }),
      ).not.toThrow();
      expect(() =>
        JobPolicy.assertCanReadCompanyJobs(interviewerActor, { role: 'INTERVIEWER', active: true }),
      ).not.toThrow();
    });

    it('conceals company from inactive member', () => {
      expect(() =>
        JobPolicy.assertCanReadCompanyJobs(recruiterActor, { role: 'RECRUITER', active: false }),
      ).toThrow(NotFoundError);
    });
  });
});
