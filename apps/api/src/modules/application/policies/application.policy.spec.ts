import { ApplicationRuleError } from '../rules/application-rule.error';
import { assertCandidateOwnership, assertRecruiterCompanyScope } from './application.policy';

function codeOf(work: () => unknown): string {
  try {
    work();
    return 'NO_ERROR';
  } catch (error) {
    if (!(error instanceof ApplicationRuleError)) throw error;
    return error.code;
  }
}

describe('scope checks after BE1 verified actor/membership', () => {
  it('allows only the verified candidate to access their application', () => {
    expect(
      codeOf(() => assertCandidateOwnership('candidate-1', 'candidate-1', 'candidate-1')),
    ).toBe('NO_ERROR');
    expect(
      codeOf(() => assertCandidateOwnership('actor-other', 'candidate-1', 'candidate-1')),
    ).toBe('ACTION_FORBIDDEN');
    expect(
      codeOf(() => assertCandidateOwnership('candidate-1', 'candidate-1', 'candidate-2')),
    ).toBe('RESOURCE_NOT_FOUND');
  });

  it('requires a current recruiter grant for the application company', () => {
    expect(
      codeOf(() =>
        assertRecruiterCompanyScope('company-1', { companyId: 'company-1', permission: 'OWNER' }),
      ),
    ).toBe('NO_ERROR');
    expect(
      codeOf(() =>
        assertRecruiterCompanyScope('company-1', {
          companyId: 'company-1',
          permission: 'RECRUITER',
        }),
      ),
    ).toBe('NO_ERROR');
    expect(
      codeOf(() =>
        assertRecruiterCompanyScope('company-1', { companyId: 'company-1', permission: 'VIEWER' }),
      ),
    ).toBe('ACTION_FORBIDDEN');
    expect(
      codeOf(() =>
        assertRecruiterCompanyScope('company-2', { companyId: 'company-1', permission: 'OWNER' }),
      ),
    ).toBe('RESOURCE_NOT_FOUND');
  });
});
