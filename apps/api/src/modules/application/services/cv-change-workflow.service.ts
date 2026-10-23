import { randomUUID } from 'node:crypto';
import type {
  Actor,
  CompanyAccessPort,
  CvSelectionPort,
  IdentityCandidatePort,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import type {
  UnitOfWork,
  TransactionContext,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { IdempotencyStore } from '../../../../../../libs/platform/idempotency/idempotency-store';
import { IdempotencyError } from '../../../../../../libs/platform/idempotency/sql-idempotency-store';
import { hashRequest } from '../../../../../../libs/platform/idempotency/request-hash';
import type { ApplicationWriteRepository } from '../repositories/application.repository';
import type {
  ApplicationWorkflowRepository,
  ApplicationRow,
} from '../repositories/application-workflow.repository';
import {
  assertCandidateOwnership,
  assertRecruiterCompanyScope,
} from '../policies/application.policy';
import { ApplicationRuleError } from '../rules/application-rule.error';
import { decideCvChangeRequest, decideCvChangeReview } from '../rules/cv-change.rules';

function validKey(key: string): void {
  if (typeof key !== 'string' || key.length < 1 || key.length > 100 || key.trim() !== key)
    throw new ApplicationRuleError('VALIDATION_FAILED', 'Invalid idempotency key');
}
function assertSameScope(initial: ApplicationRow, locked: ApplicationRow): void {
  if (initial.candidateId !== locked.candidateId || initial.companyId !== locked.companyId)
    throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application scope changed');
}

export class CvChangeWorkflowService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly identity: IdentityCandidatePort,
    private readonly company: CompanyAccessPort,
    private readonly cvs: CvSelectionPort,
    private readonly repository: ApplicationWorkflowRepository,
    private readonly writer: ApplicationWriteRepository,
    private readonly idempotency: IdempotencyStore,
    private readonly outbox: OutboxPort,
  ) {}

  async requestChange(
    actor: Actor,
    applicationId: string,
    newCvId: string,
    version: number,
    key: string,
  ) {
    validKey(key);
    return this.uow.run(async (tx) => {
      const candidate = await this.identity.assertActiveCandidate(actor, tx);
      const initial = await this.repository.scope(applicationId, tx);
      if (!initial) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
      assertCandidateOwnership(actor.userId, candidate.userId, initial.candidateId);
      const claimRequest = {
        userId: actor.userId,
        operation: 'application.cv_change',
        key,
        requestHash: hashRequest('application.cv_change', applicationId, { newCvId, version }),
      };
      const claim = await this.idempotency.claim(claimRequest, tx);
      if (claim.kind === 'conflict') throw new IdempotencyError('KEY_CONFLICT');
      if (claim.kind === 'in_progress') throw new IdempotencyError('REQUEST_IN_PROGRESS');
      if (claim.kind === 'replay')
        return {
          kind: claim.responseCode === 202 ? ('request' as const) : ('direct' as const),
          id: claim.resourceId,
          replay: true,
        };

      const company = await this.repository.lockCompany(initial.companyId, tx);
      if (company.approvalStatus !== 'APPROVED')
        throw new ApplicationRuleError('STATE_CONFLICT', 'Company is unavailable');
      const application = await this.repository.lockApplication(applicationId, tx);
      assertSameScope(initial, application);
      const pending = await this.repository.pendingCvRequest(applicationId, tx);
      const selectedCv = await this.cvs.requireReady(candidate.userId, newCvId, tx);
      const decision = decideCvChangeRequest({
        application: {
          applicationId,
          candidateId: application.candidateId,
          status: application.status,
          version: application.version,
          currentCvVersionId: application.currentCvVersionId,
        },
        expectedVersion: version,
        selectedCv,
        hasPendingRequest: pending !== null,
      });

      if (decision.kind === 'DIRECT_REPLACE') {
        await this.repository.replaceCv(
          applicationId,
          application.version,
          application.currentCvVersionId,
          decision.newCvId,
          tx,
        );
        await this.appendCvHistory(application, decision.newCvId, actor.userId, tx);
        await this.appendEvent(
          'application.cv_replaced',
          applicationId,
          decision.nextApplicationVersion,
          tx,
        );
        await this.idempotency.complete(
          claimRequest,
          { resourceId: applicationId, responseCode: 200 },
          tx,
        );
        return { kind: 'direct' as const, id: applicationId, replay: false };
      }
      const requestId = randomUUID();
      await this.repository.createCvRequest(
        {
          id: requestId,
          applicationId,
          candidateId: candidate.userId,
          newCvId: decision.newCvId,
          baseCvId: decision.baseCvId,
          applicationVersion: application.version,
        },
        tx,
      );
      await this.appendEvent(
        'application.cv_change_requested',
        applicationId,
        application.version,
        tx,
      );
      await this.idempotency.complete(
        claimRequest,
        { resourceId: requestId, responseCode: 202 },
        tx,
      );
      return { kind: 'request' as const, id: requestId, replay: false };
    });
  }

  async reviewChange(
    actor: Actor,
    requestId: string,
    applicationVersion: number,
    requestVersion: number,
    decision: 'APPROVE' | 'REJECT',
    reason?: string,
  ) {
    return this.uow.run(async (tx) => {
      const initialRequest = await this.repository.cvRequest(requestId, tx);
      if (!initialRequest)
        throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'CV request not found');
      const initial = await this.repository.scope(initialRequest.applicationId, tx);
      if (!initial) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
      await this.repository.lockUsers([actor.userId, initial.candidateId], tx);
      const grant = await this.company.assertRecruiter(actor, initial.companyId, tx);
      assertRecruiterCompanyScope(initial.companyId, grant);
      const application = await this.repository.lockApplication(initial.id, tx);
      assertSameScope(initial, application);
      const pending = await this.repository.pendingCvRequest(initial.id, tx);
      if (!pending || pending.id !== requestId)
        throw new ApplicationRuleError('STATE_CONFLICT', 'CV request is no longer pending');
      const selectedCv =
        decision === 'APPROVE'
          ? await this.cvs.requireReady(application.candidateId, pending.newCvId, tx)
          : undefined;
      const resolved = decideCvChangeReview({
        application: {
          applicationId: application.id,
          candidateId: application.candidateId,
          status: application.status,
          version: application.version,
          currentCvVersionId: application.currentCvVersionId,
        },
        request: pending,
        applicationVersion,
        requestVersion,
        decision,
        ...(selectedCv ? { selectedCv } : {}),
        ...(reason === undefined ? {} : { reason }),
      });
      if (resolved.kind === 'REJECT') {
        await this.repository.decideCvRequest(
          requestId,
          pending.version,
          'REJECTED',
          actor.userId,
          resolved.reason,
          tx,
        );
        await this.appendEvent(
          'application.cv_change_rejected',
          application.id,
          application.version,
          tx,
        );
        return {
          status: 'REJECTED' as const,
          applicationVersion: application.version,
          requestVersion: resolved.nextRequestVersion,
        };
      }
      await this.repository.replaceCv(
        application.id,
        application.version,
        application.currentCvVersionId,
        resolved.newCurrentCvId,
        tx,
      );
      await this.repository.decideCvRequest(
        requestId,
        pending.version,
        'APPROVED',
        actor.userId,
        null,
        tx,
      );
      await this.appendCvHistory(application, resolved.newCurrentCvId, actor.userId, tx);
      await this.appendEvent(
        'application.cv_replaced',
        application.id,
        resolved.nextApplicationVersion,
        tx,
      );
      return {
        status: 'APPROVED' as const,
        applicationVersion: resolved.nextApplicationVersion,
        requestVersion: resolved.nextRequestVersion,
      };
    });
  }

  private async appendCvHistory(
    application: ApplicationRow,
    newCvId: string,
    actorId: string,
    tx: TransactionContext,
  ) {
    await this.writer.appendHistory(
      {
        id: randomUUID(),
        applicationId: application.id,
        candidateId: application.candidateId,
        actorId,
        actorType: 'USER',
        eventType: 'CV_REPLACED',
        fromStatus: application.status,
        toStatus: application.status,
        oldCvId: application.currentCvVersionId,
        newCvId,
        reason: null,
        publicMessage: null,
        aggregateVersion: application.version + 1,
      },
      tx,
    );
  }
  private async appendEvent(
    eventType:
      | 'application.cv_replaced'
      | 'application.cv_change_requested'
      | 'application.cv_change_rejected',
    applicationId: string,
    aggregateVersion: number,
    tx: TransactionContext,
  ) {
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
