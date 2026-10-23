import { randomUUID } from 'node:crypto';
import type { CandidateSnapshot } from '../../../../../../libs/contracts/public';
import type { OutboxPort } from '../../../../../../libs/contracts/backend';
import type {
  UnitOfWork,
  TransactionContext,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { IdempotencyStore } from '../../../../../../libs/platform/idempotency/idempotency-store';
import { IdempotencyError } from '../../../../../../libs/platform/idempotency/sql-idempotency-store';
import { hashRequest } from '../../../../../../libs/platform/idempotency/request-hash';
import type { ApplicationWriteRepository } from '../repositories/application.repository';
import { ApplicationRuleError } from '../rules/application-rule.error';

export interface VerifiedSubmission {
  readonly candidateId: string;
  readonly cvId: string;
  readonly snapshot: CandidateSnapshot;
}

/**
 * Internal persistence slice, not an HTTP use case. Authorization runs for
 * replay; new-submission eligibility and READY CV are checked only for a claim.
 */
export interface SubmissionPersistenceCommand {
  readonly candidateId: string;
  readonly jobId: string;
  readonly cvId: string;
  readonly coverLetter?: string | null;
  readonly idempotencyKey: string;
  readonly authorize: (tx: TransactionContext) => Promise<{ readonly candidateId: string }>;
  readonly verifyNew: (tx: TransactionContext) => Promise<VerifiedSubmission>;
}

export type SubmissionPersistenceResult =
  | { readonly kind: 'created'; readonly applicationId: string }
  | { readonly kind: 'replay'; readonly applicationId: string };

function normalizeCoverLetter(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Cover letter must be text');
  }
  const text = value.trim().normalize('NFC');
  if ([...text].length > 3000) {
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Cover letter is too long');
  }
  return text || null;
}

export class SubmitApplicationPersistenceService {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly idempotency: IdempotencyStore,
    private readonly applications: ApplicationWriteRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(input: SubmissionPersistenceCommand): Promise<SubmissionPersistenceResult> {
    const coverLetter = normalizeCoverLetter(input.coverLetter);
    const request = {
      userId: input.candidateId,
      operation: 'application.submit',
      key: input.idempotencyKey,
      requestHash: hashRequest('application.submit', input.jobId, {
        cvId: input.cvId,
        coverLetter,
      }),
    };
    return this.unitOfWork.run(async (tx) => {
      // Current authorization is still required for replay, even after job closure.
      const authorized = await input.authorize(tx);
      if (authorized.candidateId !== input.candidateId) {
        throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Submission scope changed');
      }
      const claim = await this.idempotency.claim(request, tx);
      if (claim.kind === 'conflict') throw new IdempotencyError('KEY_CONFLICT');
      if (claim.kind === 'in_progress') throw new IdempotencyError('REQUEST_IN_PROGRESS');
      if (claim.kind === 'replay') {
        return { kind: 'replay', applicationId: claim.resourceId };
      }

      const verified = await input.verifyNew(tx);
      if (verified.candidateId !== input.candidateId || verified.cvId !== input.cvId) {
        throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Submission scope changed');
      }
      const applicationId = randomUUID();
      await this.applications.createSubmitted(
        {
          id: applicationId,
          jobId: input.jobId,
          candidateId: input.candidateId,
          cvId: input.cvId,
          snapshot: verified.snapshot,
          coverLetter,
        },
        tx,
      );
      await this.applications.appendHistory(
        {
          id: randomUUID(),
          applicationId,
          candidateId: input.candidateId,
          actorId: input.candidateId,
          actorType: 'USER',
          eventType: 'SUBMIT',
          fromStatus: null,
          toStatus: 'SUBMITTED',
          oldCvId: null,
          newCvId: input.cvId,
          reason: null,
          publicMessage: null,
          aggregateVersion: 0,
        },
        tx,
      );
      await this.outbox.append(
        {
          eventId: randomUUID(),
          eventType: 'application.submitted',
          schemaVersion: 1,
          aggregateId: applicationId,
          aggregateVersion: 0,
          occurredAt: new Date().toISOString(),
          payload: { applicationId },
        },
        tx,
      );
      await this.idempotency.complete(
        request,
        { resourceId: applicationId, responseCode: 201 },
        tx,
      );
      return { kind: 'created', applicationId };
    });
  }
}
