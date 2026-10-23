import { randomUUID } from 'node:crypto';
import type {
  Actor,
  ApplicationConflictPort,
  ApplicationContext,
  ApplicationMutation,
  ApplicationPort,
  ApplicationResultPort,
  CompanyAccessPort,
  InterviewEvidence,
  OutboxPort,
  VersionedApplicationCommand,
} from '../../../../../../libs/contracts/backend';
import type { ResultStatus } from '../../../../../../libs/contracts/public';
import type { TransactionContext as Tx } from '../../../../../../libs/platform/database/unit-of-work';
import type { IdempotencyStore } from '../../../../../../libs/platform/idempotency/idempotency-store';
import { IdempotencyError } from '../../../../../../libs/platform/idempotency/sql-idempotency-store';
import { hashRequest } from '../../../../../../libs/platform/idempotency/request-hash';
import type { ApplicationWriteRepository } from '../repositories/application.repository';
import type {
  ApplicationRow,
  ApplicationWorkflowRepository,
} from '../repositories/application-workflow.repository';
import { ApplicationRuleError } from '../rules/application-rule.error';
import { decideApplicationTransition } from '../rules/application-transition.rules';

type Decision = ReturnType<typeof decideApplicationTransition>;
type Event = 'application.status_changed' | 'application.result_published';

/** Caller owns the transaction and locks BE3 rows in the documented order. */
export class Be2ApplicationPorts
  implements ApplicationPort, ApplicationResultPort, ApplicationConflictPort
{
  constructor(
    private readonly repository: ApplicationWorkflowRepository,
    private readonly writer: ApplicationWriteRepository,
    private readonly company: CompanyAccessPort,
    private readonly idempotency: IdempotencyStore,
    private readonly outbox: OutboxPort,
  ) {}

  async hasOpenApplication(candidateId: string, companyId: string, tx: Tx): Promise<boolean> {
    return this.repository.hasOpenApplication(candidateId, companyId, tx);
  }

  async getSchedulingContext(
    applicationId: string,
    actor: Actor,
    tx: Tx,
  ): Promise<ApplicationContext> {
    const row = await this.authorized(applicationId, actor, tx);
    if (row.status !== 'SHORTLISTED' && row.status !== 'INTERVIEW_SCHEDULED')
      throw new ApplicationRuleError('STATE_CONFLICT', 'Application cannot be scheduled');
    return {
      applicationId,
      candidateId: row.candidateId,
      jobId: row.jobId,
      companyId: row.companyId,
      status: row.status,
      version: row.version,
    };
  }

  async onInterviewConfirmed(
    input: VersionedApplicationCommand & { readonly interviewId: string },
    tx: Tx,
  ): Promise<ApplicationMutation> {
    if (!input.interviewId)
      throw new ApplicationRuleError('VALIDATION_FAILED', 'Interview ID required');
    return this.transition(
      input,
      tx,
      'INTERVIEW_CONFIRMED',
      undefined,
      undefined,
      'INTERVIEW_CONFIRMED',
    );
  }

  async onInterviewsCancelled(
    input: VersionedApplicationCommand & {
      readonly interviewIds: readonly string[];
      readonly evidence: InterviewEvidence;
    },
    tx: Tx,
  ): Promise<ApplicationMutation> {
    if (new Set(input.interviewIds).size !== input.interviewIds.length)
      throw new ApplicationRuleError('VALIDATION_FAILED', 'Duplicate interview ID');
    return this.transition(
      input,
      tx,
      'INTERVIEWS_CANCELLED',
      input.evidence,
      input.interviewIds.length,
      'INTERVIEW_CANCELLED',
    );
  }

  async markInterviewed(
    input: VersionedApplicationCommand & { readonly evidence: InterviewEvidence },
    tx: Tx,
  ): Promise<ApplicationMutation> {
    return this.transition(
      input,
      tx,
      'MARK_INTERVIEWED',
      input.evidence,
      undefined,
      'STATUS_CHANGE',
    );
  }

  async publish(
    input: VersionedApplicationCommand & {
      readonly result: ResultStatus;
      readonly publicMessage: string;
      readonly internalReason?: string;
      readonly idempotencyKey: string;
      readonly evidence: InterviewEvidence;
    },
    tx: Tx,
  ): Promise<ApplicationMutation & { readonly resultPublishedAt: string }> {
    if (
      !input.idempotencyKey ||
      input.idempotencyKey.length > 100 ||
      input.idempotencyKey.trim() !== input.idempotencyKey
    )
      throw new ApplicationRuleError('VALIDATION_FAILED', 'Invalid idempotency key');
    // Authorization is mandatory even for a replay; never disclose a result after access revocation.
    const scope = await this.authorized(input.applicationId, input.actor, tx);
    const request = {
      userId: input.actor.userId,
      operation: 'application.publish-result',
      key: input.idempotencyKey,
      requestHash: hashRequest('application.publish-result', input.applicationId, {
        result: input.result,
        publicMessage: input.publicMessage,
        internalReason: input.internalReason ?? null,
      }),
    };
    const claim = await this.idempotency.claim(request, tx);
    if (claim.kind === 'conflict') throw new IdempotencyError('KEY_CONFLICT');
    if (claim.kind === 'in_progress') throw new IdempotencyError('REQUEST_IN_PROGRESS');
    if (claim.kind === 'replay') {
      if (claim.resourceId !== input.applicationId)
        throw new ApplicationRuleError('STATE_CONFLICT', 'Result replay scope changed');
      const at = await this.repository.publishedAt(input.applicationId, tx);
      const current = await this.repository.scope(input.applicationId, tx);
      if (!at || !current || (current.status !== 'HIRED' && current.status !== 'REJECTED'))
        throw new ApplicationRuleError('STATE_CONFLICT', 'Published result missing');
      return {
        applicationId: input.applicationId,
        status: current.status,
        version: current.version,
        resultPublishedAt: at.toISOString(),
      };
    }
    const row = await this.repository.lockApplication(input.applicationId, tx);
    this.recheck(scope, row);
    const decision = decideApplicationTransition(
      { applicationId: row.id, status: row.status, version: row.version },
      {
        kind: 'PUBLISH_RESULT',
        expectedVersion: input.expectedVersion,
        result: input.result,
        publicMessage: input.publicMessage,
        internalReason: input.internalReason,
        evidence: input.evidence,
        transactionId: tx.id,
      },
    );
    if (!decision.publication)
      throw new ApplicationRuleError('STATE_CONFLICT', 'Publication missing');
    if (decision.cancelPendingCvChange) await this.repository.cancelPendingCv(row.id, tx);
    const at = await this.repository.publishResult(
      row.id,
      row.version,
      row.status,
      decision.toStatus as 'HIRED' | 'REJECTED',
      decision.publication.publicMessage,
      tx,
    );
    await this.history(
      row,
      input.actor.userId,
      'RESULT_PUBLISHED',
      decision,
      decision.publication.internalReason ?? null,
      decision.publication.publicMessage,
      tx,
    );
    await this.event('application.result_published', row.id, decision.nextVersion, tx);
    await this.idempotency.complete(request, { resourceId: row.id, responseCode: 200 }, tx);
    return {
      applicationId: row.id,
      status: decision.toStatus,
      version: decision.nextVersion,
      resultPublishedAt: at.toISOString(),
    };
  }

  private async transition(
    input: VersionedApplicationCommand,
    tx: Tx,
    kind: 'INTERVIEW_CONFIRMED' | 'INTERVIEWS_CANCELLED' | 'MARK_INTERVIEWED',
    evidence?: InterviewEvidence,
    cancelledCount?: number,
    historyType: 'INTERVIEW_CONFIRMED' | 'INTERVIEW_CANCELLED' | 'STATUS_CHANGE' = 'STATUS_CHANGE',
  ): Promise<ApplicationMutation> {
    const scope = await this.authorized(input.applicationId, input.actor, tx);
    const row = await this.repository.lockApplication(input.applicationId, tx);
    this.recheck(scope, row);
    const state = { applicationId: row.id, status: row.status, version: row.version };
    const command =
      kind === 'INTERVIEW_CONFIRMED'
        ? ({ kind, expectedVersion: input.expectedVersion } as const)
        : kind === 'INTERVIEWS_CANCELLED'
          ? ({
              kind,
              expectedVersion: input.expectedVersion,
              evidence: evidence!,
              transactionId: tx.id,
              cancelledCount: cancelledCount!,
            } as const)
          : ({
              kind,
              expectedVersion: input.expectedVersion,
              evidence: evidence!,
              transactionId: tx.id,
            } as const);
    const decision = decideApplicationTransition(state, command);
    if (decision.cancelPendingCvChange) await this.repository.cancelPendingCv(row.id, tx);
    await this.repository.changeStatus(row.id, row.version, row.status, decision.toStatus, tx);
    await this.history(row, input.actor.userId, historyType, decision, null, null, tx);
    await this.event('application.status_changed', row.id, decision.nextVersion, tx);
    return { applicationId: row.id, status: decision.toStatus, version: decision.nextVersion };
  }

  private async authorized(applicationId: string, actor: Actor, tx: Tx): Promise<ApplicationRow> {
    const row = await this.repository.scope(applicationId, tx);
    if (!row) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
    const grant = await this.company.assertRecruiter(actor, row.companyId, tx);
    if (grant.companyId !== row.companyId)
      throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
    return row;
  }
  private recheck(initial: ApplicationRow, locked: ApplicationRow): void {
    if (initial.candidateId !== locked.candidateId || initial.companyId !== locked.companyId)
      throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application scope changed');
  }
  private async history(
    row: ApplicationRow,
    actorId: string,
    eventType: 'INTERVIEW_CONFIRMED' | 'INTERVIEW_CANCELLED' | 'STATUS_CHANGE' | 'RESULT_PUBLISHED',
    decision: Decision,
    reason: string | null,
    publicMessage: string | null,
    tx: Tx,
  ): Promise<void> {
    await this.writer.appendHistory(
      {
        id: randomUUID(),
        applicationId: row.id,
        candidateId: row.candidateId,
        actorId,
        actorType: 'USER',
        eventType,
        fromStatus: row.status,
        toStatus: decision.toStatus,
        oldCvId: null,
        newCvId: null,
        reason,
        publicMessage,
        aggregateVersion: decision.nextVersion,
      },
      tx,
    );
  }
  private async event(
    eventType: Event,
    applicationId: string,
    aggregateVersion: number,
    tx: Tx,
  ): Promise<void> {
    await this.outbox.append(
      {
        eventId: randomUUID(),
        eventType,
        schemaVersion: 1,
        aggregateId: applicationId,
        aggregateVersion,
        occurredAt: new Date().toISOString(),
        payload: { applicationId },
      },
      tx,
    );
  }
}
