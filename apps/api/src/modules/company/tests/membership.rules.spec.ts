import { MembershipRules } from '../rules/membership.rules';
import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';

describe('MembershipRules (Unit)', () => {
  describe('validateAddRole', () => {
    it('accepts RECRUITER and INTERVIEWER', () => {
      expect(() => MembershipRules.validateAddRole('RECRUITER')).not.toThrow();
      expect(() => MembershipRules.validateAddRole('INTERVIEWER')).not.toThrow();
    });

    it('rejects OWNER or ADMIN or invalid roles', () => {
      expect(() => MembershipRules.validateAddRole('OWNER')).toThrow(ValidationError);
      expect(() => MembershipRules.validateAddRole('ADMIN')).toThrow(ValidationError);
      expect(() => MembershipRules.validateAddRole('CANDIDATE')).toThrow(ValidationError);
    });
  });

  describe('validatePermissions', () => {
    it('accepts RECRUITER and INTERVIEWER permissions', () => {
      expect(() => MembershipRules.validatePermissions(['RECRUITER', 'INTERVIEWER'])).not.toThrow();
    });

    it('rejects arbitrary or ADMIN permissions', () => {
      expect(() => MembershipRules.validatePermissions(['ADMIN'])).toThrow(ValidationError);
      expect(() => MembershipRules.validatePermissions(['SUPERUSER'])).toThrow(ValidationError);
    });
  });

  describe('sanitizePermissions', () => {
    it('automatically includes base role permission', () => {
      expect(MembershipRules.sanitizePermissions('RECRUITER')).toEqual(['RECRUITER']);
      expect(MembershipRules.sanitizePermissions('INTERVIEWER')).toEqual(['INTERVIEWER']);
    });

    it('unions additional valid permissions without duplicates', () => {
      const perms = MembershipRules.sanitizePermissions('RECRUITER', ['INTERVIEWER', 'RECRUITER']);
      expect(perms).toContain('RECRUITER');
      expect(perms).toContain('INTERVIEWER');
      expect(perms.length).toBe(2);
    });
  });
});
