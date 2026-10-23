import { randomUUID } from 'node:crypto';
import type {
  Actor,
  CompanyAccessPort,
  IdentityCandidatePort,
  InterviewLifecyclePort,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import type {
  UnitOfWork,
  TransactionContext,
} from '../../../../../../libs/platform/database/unit-of-work';
import type { ApplicationWriteRepository } from '../repositories/application.repository';
import type {
  ApplicationRow,
  ApplicationWorkflowRepository,
} from '../repositories/application-workflow.repository';
import {
  assertCandidateOwnership,
  assertRecruiterCompanyScope,
} from '../policies/application.policy';
import { ApplicationRuleError } from '../rules/application-rule.error';
import { decideApplicationTransition } from '../rules/application-transition.rules';

function requireScope(row: ApplicationRow | null): ApplicationRow {
  if (!row) throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application not found');
  return row;
}
function recheckScope(initial: ApplicationRow, locked: ApplicationRow): void {
  if (initial.candidateId !== locked.candidateId || initial.companyId !== locked.companyId)
    throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Application scope changed');
}

/** BE3 is required for withdraw; never record WITHDRAWN without cancelling open interviews. */
export class ReviewApplicationWorkflowService {
  constructor(
    private readonly uow: UnitOfWork,
    private readonly identity: IdentityCandidatePort,
    private readonly company: CompanyAccessPort,
    private readonly interviews: InterviewLifecyclePort,
    private readonly repository: ApplicationWorkflowRepository,
    private readonly writer: ApplicationWriteRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async review(
    actor: Actor,
    applicationId: string,
    status: 'SCREENING' | 'SHORTLISTED',
    version: number,
  ) {
    return this.uow.run(async (tx) => {
      const initial = requireScope(await this.repository.scope(applicationId, tx));
      await this.repository.lockUsers([actor.userId, initial.candidateId], tx);
      const grant = await this.company.assertRecruiter(actor, initial.companyId, tx);
      assertRecruiterCompanyScope(initial.companyId, grant);
      const locked = await this.repository.lockApplication(applicationId, tx);
      recheckScope(initial, locked);
      const decision = decideApplicationTransition(
        { applicationId, status: locked.status, version: locked.version },
        { kind: 'REVIEW', target: status, expectedVersion: version },
      );
      if (decision.cancelPendingCvChange) await this.repository.cancelPendingCv(applicationId, tx);
      await this.repository.changeStatus(
        applicationId,
        locked.version,
        locked.status,
        decision.toStatus,
        tx,
      );
      await this.appendHistory(
        locked,
        actor.userId,
        'STATUS_CHANGE',
        decision.toStatus,
        decision.nextVersion,
        tx,
      );
      await this.appendEvent('application.status_changed', applicationId, decision.nextVersion, tx);
      return { applicationId, status: decision.toStatus, version: decision.nextVersion };
    });
  }

  async withdraw(actor: Actor, applicationId: string, version: number) {
    // BE3 discovers participants before locks; it rechecks this scope inside cancelOpenForApplication.
    const interviewScope = await this.interviews.getLockScope(applicationId);
    return this.uow.run(async (tx) => {
      const initial = requireScope(await this.repository.scope(applicationId, tx));
      await this.repository.lockUsers(
        [actor.userId, initial.candidateId, ...interviewScope.userIds],
        tx,
      );
      const identity = await this.identity.assertActiveCandidate(actor, tx);
      assertCandidateOwnership(actor.userId, identity.userId, initial.candidateId);
      await this.repository.lockCompany(initial.companyId, tx);
      const locked = await this.repository.lockApplication(applicationId, tx);
      recheckScope(initial, locked);
      const decision = decideApplicationTransition(
        { applicationId, status: locked.status, version: locked.version },
        { kind: 'WITHDRAW', expectedVersion: version },
      );
      // BE3 must lock/cancel interviews, reservations and room revocation in this tx.
      await this.interviews.cancelOpenForApplication(
        { applicationId, actor, reason: 'WITHDRAWN' },
        tx,
      );
      if (decision.cancelPendingCvChange) await this.repository.cancelPendingCv(applicationId, tx);
      await this.repository.changeStatus(
        applicationId,
        locked.version,
        locked.status,
        decision.toStatus,
        tx,
      );
      await this.appendHistory(
        locked,
        actor.userId,
        'WITHDRAW',
        decision.toStatus,
        decision.nextVersion,
        tx,
      );
      await this.appendEvent('application.withdrawn', applicationId, decision.nextVersion, tx);
      return { applicationId, status: decision.toStatus, version: decision.nextVersion };
    });
  }

  private async appendHistory(
    application: ApplicationRow,
    actorId: string,
    eventType: 'STATUS_CHANGE' | 'WITHDRAW',
    toStatus: ApplicationRow['status'],
    version: number,
    tx: TransactionContext,
  ) {
    await this.writer.appendHistory(
      {
        id: randomUUID(),
        applicationId: application.id,
        candidateId: application.candidateId,
        actorId,
        actorType: 'USER',
        eventType,
        fromStatus: application.status,
        toStatus,
        oldCvId: null,
        newCvId: null,
        reason: null,
        publicMessage: null,
        aggregateVersion: version,
      },
      tx,
    );
  }
  private async appendEvent(
    eventType: 'application.status_changed' | 'application.withdrawn',
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
