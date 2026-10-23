import type { InterviewEvidence } from '../../../../../../libs/contracts/backend';
import type { ApplicationStatus, ResultStatus } from '../../../../../../libs/contracts/public';
import { ApplicationRuleError, assertExpectedVersion, nextVersion } from './application-rule.error';
import { normalizeRequiredText } from './text.rules';

export interface ApplicationState {
  readonly applicationId: string;
  readonly status: ApplicationStatus;
  readonly version: number;
}

type EvidenceCommand = {
  readonly evidence: InterviewEvidence;
  readonly transactionId: string;
};

export type ApplicationTransitionCommand =
  | {
      readonly kind: 'REVIEW';
      readonly target: 'SCREENING' | 'SHORTLISTED';
      readonly expectedVersion: number;
    }
  | { readonly kind: 'INTERVIEW_CONFIRMED'; readonly expectedVersion: number }
  | ({
      readonly kind: 'INTERVIEWS_CANCELLED';
      readonly expectedVersion: number;
      readonly cancelledCount: number;
    } & EvidenceCommand)
  | ({ readonly kind: 'MARK_INTERVIEWED'; readonly expectedVersion: number } & EvidenceCommand)
  | ({
      readonly kind: 'PUBLISH_RESULT';
      readonly expectedVersion: number;
      readonly result: ResultStatus;
      readonly publicMessage: string;
      readonly internalReason?: string;
    } & EvidenceCommand)
  | { readonly kind: 'WITHDRAW'; readonly expectedVersion: number };

export interface ApplicationTransitionDecision {
  readonly fromStatus: ApplicationStatus;
  readonly toStatus: ApplicationStatus;
  readonly nextVersion: number;
  readonly cancelPendingCvChange: boolean;
  /** The withdraw workflow must call BE3 in this same transaction before persisting. */
  readonly cancelOpenInterviews: boolean;
  readonly publication?: { readonly publicMessage: string; readonly internalReason?: string };
}

export function isTerminalApplicationStatus(status: ApplicationStatus): boolean {
  return status === 'HIRED' || status === 'REJECTED' || status === 'WITHDRAWN';
}

function conflict(): never {
  throw new ApplicationRuleError('STATE_CONFLICT', 'Application transition is not allowed');
}

function assertEvidence(state: ApplicationState, input: EvidenceCommand): InterviewEvidence {
  const evidence = input.evidence;
  if (
    evidence.applicationId !== state.applicationId ||
    evidence.transactionId !== input.transactionId
  ) {
    return conflict();
  }
  for (const count of [
    evidence.proposedCount,
    evidence.confirmedCount,
    evidence.completedCount,
    evidence.noShowCount,
    evidence.missingEvaluationCount,
  ]) {
    if (!Number.isSafeInteger(count) || count < 0) return conflict();
  }
  return evidence;
}

/** Pure plan only. Services still recheck scope/version under DB locks and write atomically. */
export function decideApplicationTransition(
  state: ApplicationState,
  command: ApplicationTransitionCommand,
): ApplicationTransitionDecision {
  assertExpectedVersion(command.expectedVersion, state.version);
  if (isTerminalApplicationStatus(state.status)) return conflict();

  let toStatus: ApplicationStatus;
  let publication: ApplicationTransitionDecision['publication'];
  let cancelOpenInterviews = false;

  switch (command.kind) {
    case 'REVIEW':
      if (state.status === 'SUBMITTED' && command.target === 'SCREENING') toStatus = 'SCREENING';
      else if (state.status === 'SCREENING' && command.target === 'SHORTLISTED')
        toStatus = 'SHORTLISTED';
      else return conflict();
      break;
    case 'INTERVIEW_CONFIRMED':
      if (state.status !== 'SHORTLISTED' && state.status !== 'INTERVIEW_SCHEDULED')
        return conflict();
      toStatus = 'INTERVIEW_SCHEDULED';
      break;
    case 'INTERVIEWS_CANCELLED': {
      if (
        state.status !== 'INTERVIEW_SCHEDULED' ||
        !Number.isSafeInteger(command.cancelledCount) ||
        command.cancelledCount < 1
      )
        return conflict();
      const evidence = assertEvidence(state, command);
      toStatus =
        evidence.confirmedCount === 0 && evidence.completedCount === 0 && evidence.noShowCount === 0
          ? 'SHORTLISTED'
          : 'INTERVIEW_SCHEDULED';
      break;
    }
    case 'MARK_INTERVIEWED': {
      if (state.status !== 'INTERVIEW_SCHEDULED') return conflict();
      const evidence = assertEvidence(state, command);
      if (
        evidence.completedCount < 1 ||
        evidence.missingEvaluationCount !== 0 ||
        evidence.proposedCount !== 0 ||
        evidence.confirmedCount !== 0
      )
        return conflict();
      toStatus = 'INTERVIEWED';
      break;
    }
    case 'PUBLISH_RESULT': {
      if (command.result === 'HIRED' && state.status !== 'INTERVIEWED') return conflict();
      if (command.result !== 'HIRED' && command.result !== 'REJECTED') return conflict();
      const evidence = assertEvidence(state, command);
      if (
        evidence.proposedCount !== 0 ||
        (command.result === 'HIRED' && evidence.confirmedCount !== 0)
      )
        return conflict();
      if (
        command.result === 'HIRED' &&
        (evidence.completedCount < 1 || evidence.missingEvaluationCount !== 0)
      )
        return conflict();
      const publicMessage = normalizeRequiredText(command.publicMessage, 3000);
      const internalReason =
        command.result === 'REJECTED'
          ? normalizeRequiredText(command.internalReason)
          : command.internalReason === undefined
            ? undefined
            : normalizeRequiredText(command.internalReason);
      publication = { publicMessage, ...(internalReason === undefined ? {} : { internalReason }) };
      toStatus = command.result;
      break;
    }
    case 'WITHDRAW':
      toStatus = 'WITHDRAWN';
      cancelOpenInterviews = true;
      break;
  }

  return {
    fromStatus: state.status,
    toStatus,
    nextVersion: nextVersion(state.version),
    cancelPendingCvChange: state.status === 'SCREENING' && toStatus !== 'SCREENING',
    cancelOpenInterviews,
    ...(publication === undefined ? {} : { publication }),
  };
}
