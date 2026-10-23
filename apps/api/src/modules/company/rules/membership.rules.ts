import { ValidationError } from '../../../../../../libs/platform/errors/domain.error';
import type { MembershipRole, MemberPermission } from '../../../../../../libs/contracts/public';

export class MembershipRules {
  public static readonly ALLOWED_ADD_ROLES: readonly ('RECRUITER' | 'INTERVIEWER')[] = [
    'RECRUITER',
    'INTERVIEWER',
  ];

  public static readonly ALLOWED_PERMISSIONS: readonly MemberPermission[] = [
    'RECRUITER',
    'INTERVIEWER',
  ];

  public static validateAddRole(role: string): asserts role is 'RECRUITER' | 'INTERVIEWER' {
    if (!(this.ALLOWED_ADD_ROLES as readonly string[]).includes(role)) {
      throw new ValidationError(
        `Invalid membership role: ${role}. Only RECRUITER or INTERVIEWER can be added.`,
      );
    }
  }

  public static validatePermissions(permissions: readonly string[]): void {
    for (const p of permissions) {
      if (!(this.ALLOWED_PERMISSIONS as readonly string[]).includes(p)) {
        throw new ValidationError(`Invalid permission: ${p}. Must be RECRUITER or INTERVIEWER.`);
      }
    }
  }

  public static sanitizePermissions(
    role: MembershipRole,
    permissions?: readonly MemberPermission[],
  ): MemberPermission[] {
    const list = new Set<MemberPermission>();
    if (role === 'RECRUITER') {
      list.add('RECRUITER');
    }
    if (role === 'INTERVIEWER') {
      list.add('INTERVIEWER');
    }
    if (permissions) {
      for (const p of permissions) {
        if (this.ALLOWED_PERMISSIONS.includes(p)) {
          list.add(p);
        }
      }
    }
    return Array.from(list);
  }
}
