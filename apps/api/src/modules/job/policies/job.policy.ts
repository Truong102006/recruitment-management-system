import { ForbiddenError, NotFoundError } from '../../../../../../libs/platform/errors/domain.error';
import { Actor } from '../../../../../../libs/contracts/backend';

export class JobPolicy {
  public static assertCanManageCompanyJobs(
    _actor: Actor,
    membership: { role: string; active: boolean } | null,
    company: { approvalStatus: string } | null,
  ): void {
    if (!membership || !membership.active) {
      throw new NotFoundError('Company not found');
    }

    if (membership.role !== 'OWNER' && membership.role !== 'RECRUITER') {
      throw new ForbiddenError('Only OWNER or RECRUITER can manage job posts for this company.');
    }

    if (!company) {
      throw new ForbiddenError('Company not found.');
    }

    if (company.approvalStatus !== 'APPROVED') {
      throw new ForbiddenError(
        `Company is not approved (current status: ${company.approvalStatus}). Operational recruiting is not permitted.`,
      );
    }
  }

  public static assertCanReadCompanyJobs(
    _actor: Actor,
    membership: { role: string; active: boolean } | null,
  ): void {
    if (!membership || !membership.active) {
      throw new NotFoundError('Company not found');
    }

    if (
      membership.role !== 'OWNER' &&
      membership.role !== 'RECRUITER' &&
      membership.role !== 'INTERVIEWER'
    ) {
      throw new ForbiddenError('You are not authorized to view internal company jobs.');
    }
  }
}
