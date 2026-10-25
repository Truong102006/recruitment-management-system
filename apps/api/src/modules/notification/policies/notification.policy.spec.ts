import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { NotificationPolicy } from './notification.policy';
import type { Actor } from '../../../../../../libs/contracts/backend';

describe('NotificationPolicy', () => {
  let policy: NotificationPolicy;

  beforeEach(() => {
    policy = new NotificationPolicy();
  });

  describe('assertCanReadNotifications', () => {
    it('allows authenticated actor with valid userId', () => {
      const actor: Actor = { userId: 'u1', roles: ['CANDIDATE'], sessionId: 's1' };
      expect(() => policy.assertCanReadNotifications(actor)).not.toThrow();
    });

    it('rejects unauthenticated actor or missing userId', () => {
      expect(() => policy.assertCanReadNotifications({ userId: '', roles: [], sessionId: 's1' })).toThrow(UnauthorizedException);
      expect(() => policy.assertCanReadNotifications(null as unknown as Actor)).toThrow(UnauthorizedException);
    });
  });

  describe('assertCanManageEvents', () => {
    it('allows administrator', () => {
      const adminActor: Actor = { userId: 'admin1', roles: ['ADMIN'], sessionId: 's_admin' };
      expect(() => policy.assertCanManageEvents(adminActor)).not.toThrow();
    });

    it('rejects non-admin actor', () => {
      const recruiterActor: Actor = { userId: 'rec1', roles: ['RECRUITER'], sessionId: 's_rec' };
      expect(() => policy.assertCanManageEvents(recruiterActor)).toThrow(ForbiddenException);
    });
  });
});
