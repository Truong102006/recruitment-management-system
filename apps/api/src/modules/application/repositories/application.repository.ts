import type { CandidateSnapshot, ApplicationStatus } from '../../../../../../libs/contracts/public';
import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';

export interface SubmittedApplication {
  readonly id: string;
  readonly jobId: string;
  readonly candidateId: string;
  readonly cvId: string;
  readonly snapshot: CandidateSnapshot;
  readonly coverLetter: string | null;
}

export interface NewApplicationHistory {
  readonly id: string;
  readonly applicationId: string;
  readonly candidateId: string;
  readonly actorId: string | null;
  readonly actorType: 'USER' | 'SYSTEM';
  readonly eventType:
    | 'SUBMIT'
    | 'STATUS_CHANGE'
    | 'CV_REPLACED'
    | 'RESULT_PUBLISHED'
    | 'INTERVIEW_CONFIRMED'
    | 'INTERVIEW_CANCELLED'
    | 'WITHDRAW';
  readonly fromStatus: ApplicationStatus | null;
  readonly toStatus: ApplicationStatus;
  readonly oldCvId: string | null;
  readonly newCvId: string | null;
  readonly reason: string | null;
  readonly publicMessage: string | null;
  readonly aggregateVersion: number;
}

/** Write methods require a caller-owned transaction and already-verified authority. */
export interface ApplicationWriteRepository {
  createSubmitted(record: SubmittedApplication, tx: TransactionContext): Promise<void>;
  appendHistory(record: NewApplicationHistory, tx: TransactionContext): Promise<void>;
}
