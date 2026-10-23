import { ForbiddenError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';
import type { Actor } from '../../../../../../libs/contracts/backend';

export class CompanyPolicy {
  /**
   * Asserts actor has read access to the company and its members.
   * Outsiders get 404 to avoid leaking company existence.
   */
  public static assertMemberReadAccess(
    actor: Actor,
    membership?: { active: boolean } | null,
  ): void {
    if (!membership || !membership.active) {
      throw new NotFoundError('Company not found or access denied', 'COMPANY_NOT_FOUND');
    }
  }

  /**
   * Asserts actor is an active OWNER of the company through active membership.
   */
  public static assertOwnerAccess(
    actor: Actor,
    membership?: { role: string; active: boolean } | null,
  ): void {
    if (!membership || !membership.active) {
      throw new NotFoundError('Company not found or access denied', 'COMPANY_NOT_FOUND');
    }
    if (membership.role !== 'OWNER') {
      throw new ForbiddenError(
        'Only company owners can perform this action',
        'OWNER_PERMISSION_REQUIRED',
      );
    }
  }

  /**
   * Operational context (A14): for job posting, applicant management, etc.
   * Requires:
   * 1. Company is APPROVED.
   * 2. Membership is active with role OWNER or RECRUITER (or permission RECRUITER).
   * 3. At least one active owner is available in the company.
   */
  public static assertOperationalAccess(
    company: { id: string; approvalStatus: string },
    membership: { role: string; active: boolean; permissions?: string[] },
    availableOwnerCount: number,
  ): void {
    if (company.approvalStatus !== 'APPROVED') {
      throw new ForbiddenError(
        `Company operational access denied: company status is ${company.approvalStatus}`,
        'COMPANY_NOT_APPROVED',
      );
    }

    if (!membership.active) {
      throw new ForbiddenError('Membership is inactive', 'MEMBERSHIP_INACTIVE');
    }

    const hasRecruiterRole =
      membership.role === 'OWNER' ||
      membership.role === 'RECRUITER' ||
      (membership.permissions && membership.permissions.includes('RECRUITER'));

    if (!hasRecruiterRole) {
      throw new ForbiddenError('Recruiter permission required', 'RECRUITER_ROLE_REQUIRED');
    }

    if (availableOwnerCount < 1) {
      throw new ForbiddenError(
        'Company operational access denied: no active owner available',
        'NO_AVAILABLE_OWNER',
      );
    }
  }
}
