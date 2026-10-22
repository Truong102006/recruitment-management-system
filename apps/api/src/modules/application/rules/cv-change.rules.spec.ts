import type { ApplicationStatus } from '../../../../../../libs/contracts/public';
import { ApplicationRuleError } from './application-rule.error';
import { decideCvChangeRequest, decideCvChangeReview } from './cv-change.rules';

const application = (status: ApplicationStatus = 'SUBMITTED', version = 3) => ({
  applicationId: 'application-1',
  candidateId: 'candidate-1',
  status,
  version,
  currentCvVersionId: 'cv-old',
});
const selectedCv = { cvId: 'cv-new', candidateId: 'candidate-1' };
const request = {
  applicationId: 'application-1',
  candidateId: 'candidate-1',
  status: 'PENDING' as const,
  version: 2,
  baseCvVersionId: 'cv-old',
  newCvId: 'cv-new',
};

function codeOf(work: () => unknown): string {
  try {
    work();
    return 'NO_ERROR';
  } catch (error) {
    if (!(error instanceof ApplicationRuleError)) throw error;
    return error.code;
  }
}

describe('CV change — BR07/BR08, TC10–TC13, TC37–TC40', () => {
  it('replaces current CV directly in SUBMITTED without changing the original in this plan', () => {
    expect(
      decideCvChangeRequest({
        application: application(),
        expectedVersion: 3,
        selectedCv,
        hasPendingRequest: false,
      }),
    ).toEqual({
      kind: 'DIRECT_REPLACE',
      newCvId: 'cv-new',
      nextApplicationVersion: 4,
    });
  });

  it('creates a pending request in SCREENING with the current CV as its base', () => {
    expect(
      decideCvChangeRequest({
        application: application('SCREENING'),
        expectedVersion: 3,
        selectedCv,
        hasPendingRequest: false,
      }),
    ).toEqual({
      kind: 'CREATE_REQUEST',
      newCvId: 'cv-new',
      baseCvId: 'cv-old',
    });
  });

  it.each([
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'INTERVIEWED',
    'HIRED',
    'REJECTED',
    'WITHDRAWN',
  ] as const)('forbids a CV change in %s', (status) => {
    expect(
      codeOf(() =>
        decideCvChangeRequest({
          application: application(status),
          expectedVersion: 3,
          selectedCv,
          hasPendingRequest: false,
        }),
      ),
    ).toBe('STATE_CONFLICT');
  });

  it('rejects a different candidate CV, same current CV, duplicate pending request and stale version', () => {
    const base = {
      application: application('SCREENING'),
      expectedVersion: 3,
      selectedCv,
      hasPendingRequest: false,
    };
    expect(
      codeOf(() =>
        decideCvChangeRequest({ ...base, selectedCv: { ...selectedCv, candidateId: 'other' } }),
      ),
    ).toBe('RESOURCE_NOT_FOUND');
    expect(
      codeOf(() =>
        decideCvChangeRequest({ ...base, selectedCv: { ...selectedCv, cvId: 'cv-old' } }),
      ),
    ).toBe('STATE_CONFLICT');
    expect(codeOf(() => decideCvChangeRequest({ ...base, hasPendingRequest: true }))).toBe(
      'STATE_CONFLICT',
    );
    expect(codeOf(() => decideCvChangeRequest({ ...base, expectedVersion: 2 }))).toBe(
      'VERSION_CONFLICT',
    );
  });

  it('approves only the pending request on the same application/base and rechecks READY selection', () => {
    const input = {
      application: application('SCREENING'),
      request,
      applicationVersion: 3,
      requestVersion: 2,
      decision: 'APPROVE' as const,
      selectedCv,
    };
    expect(decideCvChangeReview(input)).toEqual({
      kind: 'APPROVE',
      newCurrentCvId: 'cv-new',
      nextApplicationVersion: 4,
      nextRequestVersion: 3,
    });
    expect(codeOf(() => decideCvChangeReview({ ...input, selectedCv: undefined }))).toBe(
      'STATE_CONFLICT',
    );
    expect(
      codeOf(() =>
        decideCvChangeReview({ ...input, selectedCv: { ...selectedCv, candidateId: 'other' } }),
      ),
    ).toBe('RESOURCE_NOT_FOUND');
    expect(
      codeOf(() =>
        decideCvChangeReview({ ...input, request: { ...request, baseCvVersionId: 'stale' } }),
      ),
    ).toBe('STATE_CONFLICT');
    expect(
      codeOf(() => decideCvChangeReview({ ...input, request: { ...request, newCvId: 'cv-old' } })),
    ).toBe('STATE_CONFLICT');
    expect(
      codeOf(() =>
        decideCvChangeReview({
          ...input,
          request: { ...request, applicationId: 'another-application' },
        }),
      ),
    ).toBe('STATE_CONFLICT');
    expect(
      codeOf(() =>
        decideCvChangeReview({
          ...input,
          request: { ...request, candidateId: 'another-candidate' },
        }),
      ),
    ).toBe('STATE_CONFLICT');
  });

  it('rejects with a reason without requiring the proposed CV to remain READY', () => {
    const input = {
      application: application('SCREENING'),
      request,
      applicationVersion: 3,
      requestVersion: 2,
      decision: 'REJECT' as const,
    };
    expect(decideCvChangeReview({ ...input, reason: '  Không đạt  ' })).toEqual({
      kind: 'REJECT',
      reason: 'Không đạt',
      nextRequestVersion: 3,
    });
    expect(codeOf(() => decideCvChangeReview(input))).toBe('VALIDATION_FAILED');
    expect(codeOf(() => decideCvChangeReview({ ...input, reason: '  ' }))).toBe(
      'VALIDATION_FAILED',
    );
  });

  it('prevents a second decision or a decision after review, and checks both versions', () => {
    const input = {
      application: application('SCREENING'),
      request,
      applicationVersion: 3,
      requestVersion: 2,
      decision: 'APPROVE' as const,
      selectedCv,
    };
    expect(
      codeOf(() => decideCvChangeReview({ ...input, application: application('SHORTLISTED') })),
    ).toBe('STATE_CONFLICT');
    expect(
      codeOf(() =>
        decideCvChangeReview({ ...input, request: { ...request, status: 'APPROVED' as const } }),
      ),
    ).toBe('STATE_CONFLICT');
    expect(codeOf(() => decideCvChangeReview({ ...input, applicationVersion: 2 }))).toBe(
      'VERSION_CONFLICT',
    );
    expect(codeOf(() => decideCvChangeReview({ ...input, requestVersion: 1 }))).toBe(
      'VERSION_CONFLICT',
    );
  });
});
