import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { InterviewPolicy } from './interview.policy';
import type { Actor } from '../../../../../../libs/contracts/backend';

describe('InterviewPolicy', () => {
  let policy: InterviewPolicy;
  const recruiterActor: Actor = {
    userId: 'u1',
    roles: ['RECRUITER'],
    sessionId: 's1',
  };
  const adminActor: Actor = {
    userId: 'u_admin',
    roles: ['ADMIN'],
    sessionId: 's_admin',
  };
  const candidateActor: Actor = {
    userId: 'u_cand',
    roles: ['CANDIDATE'],
    sessionId: 's_cand',
  };

  beforeEach(() => {
    policy = new InterviewPolicy();
  });

  describe('assertCanPropose', () => {
    it('allows recruiter in company', () => {
      expect(() => policy.assertCanPropose(recruiterActor, true)).not.toThrow();
    });

    it('rejects user who is not recruiter in company', () => {
      expect(() => policy.assertCanPropose(recruiterActor, false)).toThrow(ForbiddenException);
    });
  });

  describe('assertCanRespond', () => {
    it('allows user responding for themselves', () => {
      expect(() => policy.assertCanRespond(candidateActor, 'u_cand')).not.toThrow();
    });

    it('rejects user responding for someone else', () => {
      expect(() => policy.assertCanRespond(candidateActor, 'other_user')).toThrow(ForbiddenException);
    });
  });

  describe('assertCanCancel', () => {
    it('allows recruiter in company', () => {
      expect(() => policy.assertCanCancel(recruiterActor, true)).not.toThrow();
    });

    it('allows admin even if not recruiter in company', () => {
      expect(() => policy.assertCanCancel(adminActor, false)).not.toThrow();
    });

    it('rejects regular candidate or outsider', () => {
      expect(() => policy.assertCanCancel(candidateActor, false)).toThrow(ForbiddenException);
    });
  });

  describe('assertCanJoin', () => {
    it('allows assigned participant', () => {
      expect(() => policy.assertCanJoin(candidateActor, true)).not.toThrow();
    });

    it('rejects non-participant', () => {
      expect(() => policy.assertCanJoin(candidateActor, false)).toThrow(ForbiddenException);
    });
  });

  describe('assertCanRead', () => {
    it('allows recruiter in company', () => {
      expect(() => policy.assertCanRead(recruiterActor, true, false)).not.toThrow();
    });

    it('allows participant', () => {
      expect(() => policy.assertCanRead(candidateActor, false, true)).not.toThrow();
    });

    it('allows admin', () => {
      expect(() => policy.assertCanRead(adminActor, false, false)).not.toThrow();
    });

    it('throws NotFoundException for outsider', () => {
      expect(() => policy.assertCanRead(candidateActor, false, false)).toThrow(NotFoundException);
    });
  });
});
