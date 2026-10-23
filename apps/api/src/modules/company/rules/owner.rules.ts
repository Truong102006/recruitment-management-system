import { ConflictError } from '../../../../../../libs/platform/errors/domain.error';

export interface MemberWithAccountInfo {
  userId: string;
  role: string;
  active: boolean;
  user?: {
    status: string;
    emailVerifiedAt?: Date | string | null;
  } | null;
}

export class OwnerRules {
  /**
   * Asserts that at least one active, available OWNER remains in the company
   * after the target member is removed, deactivated, or demoted.
   */
  public static assertAvailableOwnerRemains(
    members: readonly MemberWithAccountInfo[],
    targetUserId: string,
  ): void {
    const remainingActiveOwners = members.filter((m) => {
      if (m.userId === targetUserId) {
        return false;
      }
      const isOwnerRole = m.role === 'OWNER';
      const isActiveMembership = m.active === true;
      const isActiveAccount = m.user?.status === 'ACTIVE' && m.user.emailVerifiedAt != null;
      return isOwnerRole && isActiveMembership && isActiveAccount;
    });

    if (remainingActiveOwners.length === 0) {
      throw new ConflictError(
        'Cannot remove, demote, or deactivate the last available company owner',
        'LAST_OWNER_REQUIRED',
      );
    }
  }

  /**
   * Counts currently available active owners in a member set.
   */
  public static countAvailableOwners(members: readonly MemberWithAccountInfo[]): number {
    return members.filter((m) => {
      const isOwnerRole = m.role === 'OWNER';
      const isActiveMembership = m.active === true;
      const isActiveAccount = m.user?.status === 'ACTIVE' && m.user.emailVerifiedAt != null;
      return isOwnerRole && isActiveMembership && isActiveAccount;
    }).length;
  }
}
