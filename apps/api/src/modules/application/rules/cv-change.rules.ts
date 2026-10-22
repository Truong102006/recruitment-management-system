import type { ApplicationStatus } from '../../../../../../libs/contracts/public';
import { ApplicationRuleError, assertExpectedVersion, nextVersion } from './application-rule.error';
import { normalizeRequiredText } from './text.rules';

interface CvChangeApplication {
  readonly applicationId: string;
  readonly candidateId: string;
  readonly status: ApplicationStatus;
  readonly version: number;
  readonly currentCvVersionId: string;
}

/** Only pass a value returned by CvSelectionPort.requireReady in the current tx. */
interface ReadyCvSelection {
  readonly cvId: string;
  readonly candidateId: string;
}

function conflict(): never {
  throw new ApplicationRuleError('STATE_CONFLICT', 'CV change is not allowed');
}

function assertSelectedCvOwner(
  application: CvChangeApplication,
  selectedCv: ReadyCvSelection,
): void {
  if (selectedCv.candidateId !== application.candidateId) {
    throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'CV was not found');
  }
}

export type CvChangeRequestDecision =
  | {
      readonly kind: 'DIRECT_REPLACE';
      readonly newCvId: string;
      readonly nextApplicationVersion: number;
    }
  | { readonly kind: 'CREATE_REQUEST'; readonly newCvId: string; readonly baseCvId: string };

/** BR07–BR08. Creating a PENDING request does not itself replace the submitted CV. */
export function decideCvChangeRequest(input: {
  readonly application: CvChangeApplication;
  readonly expectedVersion: number;
  readonly selectedCv: ReadyCvSelection;
  readonly hasPendingRequest: boolean;
}): CvChangeRequestDecision {
  const { application, selectedCv } = input;
  assertExpectedVersion(input.expectedVersion, application.version);
  assertSelectedCvOwner(application, selectedCv);
  if (selectedCv.cvId === application.currentCvVersionId || input.hasPendingRequest)
    return conflict();
  if (application.status === 'SUBMITTED') {
    return {
      kind: 'DIRECT_REPLACE',
      newCvId: selectedCv.cvId,
      nextApplicationVersion: nextVersion(application.version),
    };
  }
  if (application.status === 'SCREENING') {
    return {
      kind: 'CREATE_REQUEST',
      newCvId: selectedCv.cvId,
      baseCvId: application.currentCvVersionId,
    };
  }
  return conflict();
}

interface CvChangeRequestState {
  readonly applicationId: string;
  readonly candidateId: string;
  readonly status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  readonly version: number;
  readonly baseCvVersionId: string;
  readonly newCvId: string;
}

export type CvChangeReviewDecision =
  | {
      readonly kind: 'APPROVE';
      readonly newCurrentCvId: string;
      readonly nextApplicationVersion: number;
      readonly nextRequestVersion: number;
    }
  | { readonly kind: 'REJECT'; readonly reason: string; readonly nextRequestVersion: number };

/** Recruiter scope must be checked with BE1 before calling this on locked rows. */
export function decideCvChangeReview(input: {
  readonly application: CvChangeApplication;
  readonly request: CvChangeRequestState;
  readonly applicationVersion: number;
  readonly requestVersion: number;
  readonly decision: 'APPROVE' | 'REJECT';
  readonly selectedCv?: ReadyCvSelection;
  readonly reason?: string;
}): CvChangeReviewDecision {
  assertExpectedVersion(input.applicationVersion, input.application.version);
  assertExpectedVersion(input.requestVersion, input.request.version);
  if (
    input.application.status !== 'SCREENING' ||
    input.request.status !== 'PENDING' ||
    input.request.applicationId !== input.application.applicationId ||
    input.request.candidateId !== input.application.candidateId ||
    input.request.baseCvVersionId !== input.application.currentCvVersionId ||
    input.request.newCvId === input.application.currentCvVersionId
  )
    return conflict();

  const nextRequestVersion = nextVersion(input.request.version);
  if (input.decision === 'REJECT') {
    return { kind: 'REJECT', reason: normalizeRequiredText(input.reason), nextRequestVersion };
  }
  if (input.decision !== 'APPROVE' || input.selectedCv?.cvId !== input.request.newCvId)
    return conflict();
  assertSelectedCvOwner(input.application, input.selectedCv);
  return {
    kind: 'APPROVE',
    newCurrentCvId: input.request.newCvId,
    nextApplicationVersion: nextVersion(input.application.version),
    nextRequestVersion,
  };
}
