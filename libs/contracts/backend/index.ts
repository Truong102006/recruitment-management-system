import type { TransactionContext as Tx } from '../../platform/database/unit-of-work';
import type {
  ApplicationStatus,
  CandidateProfileDto,
  CandidateSnapshot,
  ResultStatus,
} from '../public';
export type { TransactionContext } from '../../platform/database/unit-of-work';
export type { Be2Event, Be2EventPayloads } from './events';

export interface Actor {
  readonly userId: string;
  readonly sessionId: string;
  readonly roles: readonly ('CANDIDATE' | 'RECRUITER' | 'INTERVIEWER' | 'ADMIN')[];
}
export interface ApplicationContext {
  readonly applicationId: string;
  readonly candidateId: string;
  readonly jobId: string;
  readonly companyId: string;
  readonly status: ApplicationStatus;
  readonly version: number;
}
export interface ApplicationMutation {
  readonly applicationId: string;
  readonly status: ApplicationStatus;
  readonly version: number;
}
export interface VersionedApplicationCommand {
  readonly applicationId: string;
  readonly expectedVersion: number;
  readonly actor: Actor;
}

/** Produced by BE3 from locked rows, never accepted in an HTTP request. */
export interface InterviewEvidence {
  readonly applicationId: string;
  readonly transactionId: string;
  readonly proposedCount: number;
  readonly confirmedCount: number;
  readonly completedCount: number;
  readonly noShowCount: number;
  readonly missingEvaluationCount: number;
}

// BE2 owns these providers. Every implementation rechecks state/authority in the caller's tx.
export interface ApplicationPort {
  getSchedulingContext(applicationId: string, actor: Actor, tx: Tx): Promise<ApplicationContext>;
  onInterviewConfirmed(
    input: VersionedApplicationCommand & { readonly interviewId: string },
    tx: Tx,
  ): Promise<ApplicationMutation>;
  onInterviewsCancelled(
    input: VersionedApplicationCommand & {
      readonly interviewIds: readonly string[];
      readonly evidence: InterviewEvidence;
    },
    tx: Tx,
  ): Promise<ApplicationMutation>;
  markInterviewed(
    input: VersionedApplicationCommand & { readonly evidence: InterviewEvidence },
    tx: Tx,
  ): Promise<ApplicationMutation>;
}
export interface ApplicationResultPort {
  publish(
    input: VersionedApplicationCommand & {
      readonly result: ResultStatus;
      readonly publicMessage: string;
      readonly internalReason?: string;
      readonly idempotencyKey: string;
      readonly evidence: InterviewEvidence;
    },
    tx: Tx,
  ): Promise<ApplicationMutation & { readonly resultPublishedAt: string }>;
}
export interface ApplicationConflictPort {
  hasOpenApplication(candidateId: string, companyId: string, tx: Tx): Promise<boolean>;
}
export interface CandidateProfilePort {
  /** Identity calls this in the same tx as granting CANDIDATE. */
  ensureForCandidate(userId: string, tx: Tx): Promise<void>;
  /** Name/email come from BE1's locked identity check; BE2 adds its profile fields. */
  getSubmissionSnapshot(
    candidateId: string,
    identity: { readonly name: string; readonly email: string },
    tx: Tx,
  ): Promise<CandidateSnapshot>;
}
export interface CvSelectionPort {
  requireReady(
    candidateId: string,
    cvId: string,
    tx: Tx,
  ): Promise<{
    readonly cvId: string;
    readonly candidateId: string;
    readonly storageVersionId: string;
    readonly checksumSha256: string;
  }>;
}

// Required BE1 providers. These are interface boundaries, not BE1 implementations.
export interface IdentityCandidatePort {
  /** For submit/upload: ACTIVE + CANDIDATE + verified; never trust actor.roles alone. */
  assertActiveCandidate(
    actor: Actor,
    tx: Tx,
  ): Promise<{ readonly userId: string; readonly name: string; readonly email: string }>;
  updateCandidateName(actor: Actor, name: string, tx: Tx): Promise<void>;
}
export interface CompanyAccessPort {
  assertRecruiter(
    actor: Actor,
    companyId: string,
    tx: Tx,
  ): Promise<{
    readonly companyId: string;
    readonly permission: 'OWNER' | 'RECRUITER';
    readonly membershipId: string;
  }>;
}
export interface JobApplicationPort {
  /** Acquire locks in the global plan; verify deadline at DB clock after locking. */
  lockForSubmission(
    jobId: string,
    candidateId: string,
    tx: Tx,
  ): Promise<{ readonly jobId: string; readonly companyId: string; readonly deadline: string }>;
}
export interface JobVisibilityPort {
  getPublicOrPlaceholder(
    jobId: string,
    actor: Actor,
    tx: Tx,
  ): Promise<
    | { readonly available: true; readonly jobId: string; readonly acceptingApplications: boolean }
    | { readonly available: false; readonly jobId: string }
  >;
}
export interface SkillCatalogPort {
  assertActiveSkills(skillIds: readonly string[], tx: Tx): Promise<readonly string[]>;
}

// Required BE3 providers. Workflows must gather all lock IDs before locking rows.
export interface InterviewLifecyclePort {
  getLockScope(
    applicationId: string,
  ): Promise<{ readonly userIds: readonly string[]; readonly interviewIds: readonly string[] }>;
  /**
   * WITHDRAWN cancels PROPOSED/CONFIRMED, preserving COMPLETED/NO_SHOW.
   * RESULT_REJECTED rejects while CONFIRMED remains; cancels only PROPOSED.
   * Reservations, room revocation state and outbox are updated in the same tx.
   */
  cancelOpenForApplication(
    input: {
      readonly applicationId: string;
      readonly actor: Actor;
      readonly reason: 'WITHDRAWN' | 'RESULT_REJECTED';
    },
    tx: Tx,
  ): Promise<{ readonly cancelledInterviewIds: readonly string[] }>;
  getEvidence(applicationId: string, tx: Tx): Promise<InterviewEvidence>;
}
export interface OutboxPort {
  append(event: import('./events').Be2Event, tx: Tx): Promise<void>;
}

/** Tokens are stable for Nest useFactory/useExisting bindings; interfaces alone erase at runtime. */
export const PORTS = Object.freeze({
  application: Symbol.for('rms.ApplicationPort.v1'),
  applicationResult: Symbol.for('rms.ApplicationResultPort.v1'),
  applicationConflict: Symbol.for('rms.ApplicationConflictPort.v1'),
  candidateProfile: Symbol.for('rms.CandidateProfilePort.v1'),
  cvSelection: Symbol.for('rms.CvSelectionPort.v1'),
  identityCandidate: Symbol.for('rms.IdentityCandidatePort.v1'),
  companyAccess: Symbol.for('rms.CompanyAccessPort.v1'),
  jobApplication: Symbol.for('rms.JobApplicationPort.v1'),
  jobVisibility: Symbol.for('rms.JobVisibilityPort.v1'),
  skillCatalog: Symbol.for('rms.SkillCatalogPort.v1'),
  interviewLifecycle: Symbol.for('rms.InterviewLifecyclePort.v1'),
  outbox: Symbol.for('rms.OutboxPort.v1'),
});

// Keeps profile HTTP types discoverable without duplicating them in backend modules.
export type { CandidateProfileDto };
