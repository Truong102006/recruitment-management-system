import { ApplicationRuleError } from '../rules/application-rule.error';

/** Call BE1's assertActiveCandidate first; this only compares trusted identities. */
export function assertCandidateOwnership(
  actorUserId: string,
  verifiedCandidateUserId: string,
  applicationCandidateId: string,
): void {
  if (actorUserId !== verifiedCandidateUserId) {
    throw new ApplicationRuleError('ACTION_FORBIDDEN', 'Candidate identity is not verified');
  }
  if (applicationCandidateId !== verifiedCandidateUserId) {
    throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application was not found');
  }
}

/** Call BE1's assertRecruiter first; it checks current membership/company under locks. */
export function assertRecruiterCompanyScope(
  applicationCompanyId: string,
  grant: { readonly companyId: string; readonly permission: string },
): void {
  if (grant.permission !== 'OWNER' && grant.permission !== 'RECRUITER') {
    throw new ApplicationRuleError('ACTION_FORBIDDEN', 'Recruiter action is not allowed');
  }
  if (applicationCompanyId !== grant.companyId) {
    throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application was not found');
  }
}
