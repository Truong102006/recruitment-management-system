import type {
  Actor,
  CompanyAccessPort,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import type { TransactionContext as Tx } from '../../../../../../libs/platform/database/unit-of-work';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import type { IdempotencyStore } from '../../../../../../libs/platform/idempotency/idempotency-store';
import type {
  ApplicationWriteRepository,
  NewApplicationHistory,
} from '../repositories/application.repository';
import type {
  ApplicationRow,
  ApplicationWorkflowRepository,
} from '../repositories/application-workflow.repository';
import { Be2ApplicationPorts } from './application-ports.service';

const applicationId = '11111111-1111-4111-8111-111111111111';
const candidateId = '22222222-2222-4222-8222-222222222222';
const companyId = '33333333-3333-4333-8333-333333333333';
const actor: Actor = {
  userId: '44444444-4444-4444-8444-444444444444',
  sessionId: 'session',
  roles: ['RECRUITER'],
};
const initial: ApplicationRow = {
  id: applicationId,
  candidateId,
  companyId,
  jobId: '55555555-5555-4555-8555-555555555555',
  status: 'SHORTLISTED',
  version: 2,
  originalCvVersionId: 'cv',
  currentCvVersionId: 'cv',
};

function setup(outboxFails = false) {
  let committed = {
    app: { ...initial },
    history: [] as NewApplicationHistory[],
    events: [] as string[],
    claims: new Map<string, string>(),
    publishedAt: null as Date | null,
  };
  const uow = new ManagedUnitOfWork({
    async transaction<T>(work: (client: typeof committed) => Promise<T>) {
      const draft = structuredClone(committed);
      const result = await work(draft);
      committed = draft;
      return result;
    },
  });
  const state = (tx: Tx) => uow.clientFor(tx);
  const repository = {
    async scope(_id: string, tx: Tx) {
      return state(tx).app;
    },
    async lockApplication(_id: string, tx: Tx) {
      return state(tx).app;
    },
    async changeStatus(
      _id: string,
      _v: number,
      _from: string,
      to: ApplicationRow['status'],
      tx: Tx,
    ) {
      state(tx).app.status = to;
      state(tx).app.version++;
    },
    async publishResult(
      _id: string,
      _v: number,
      _from: string,
      to: 'HIRED' | 'REJECTED',
      _message: string,
      tx: Tx,
    ) {
      state(tx).app.status = to;
      state(tx).app.version++;
      state(tx).publishedAt = new Date('2026-10-23T00:00:00.000Z');
      return state(tx).publishedAt!;
    },
    async publishedAt(_id: string, tx: Tx) {
      return state(tx).publishedAt;
    },
    async cancelPendingCv() {},
    async hasOpenApplication() {
      return true;
    },
  } as unknown as ApplicationWorkflowRepository;
  const writer = {
    async appendHistory(row: NewApplicationHistory, tx: Tx) {
      state(tx).history.push(row);
    },
  } as ApplicationWriteRepository;
  const company = {
    async assertRecruiter() {
      return { companyId, permission: 'RECRUITER', membershipId: 'member' };
    },
  } as CompanyAccessPort;
  const idempotency = {
    async claim(request: { key: string }, tx: Tx) {
      return state(tx).claims.has(request.key)
        ? { kind: 'replay', resourceId: applicationId, responseCode: 200 }
        : { kind: 'claimed' };
    },
    async complete(request: { key: string }, _result: unknown, tx: Tx) {
      state(tx).claims.set(request.key, applicationId);
    },
  } as IdempotencyStore;
  const outbox = {
    async append(event: { eventType: string }, tx: Tx) {
      if (outboxFails) throw new Error('Outbox unavailable');
      state(tx).events.push(event.eventType);
    },
  } as OutboxPort;
  return {
    uow,
    ports: new Be2ApplicationPorts(repository, writer, company, idempotency, outbox),
    state: () => committed,
  };
}

describe('BE2 application ports for BE3', () => {
  it('moves only authorized applications and records versioned history', async () => {
    const h = setup();
    const result = await h.uow.run((tx) =>
      h.ports.onInterviewConfirmed(
        { applicationId, expectedVersion: 2, actor, interviewId: 'interview' },
        tx,
      ),
    );
    expect(result).toEqual({ applicationId, status: 'INTERVIEW_SCHEDULED', version: 3 });
    expect(h.state().history[0]).toMatchObject({
      eventType: 'INTERVIEW_CONFIRMED',
      aggregateVersion: 3,
    });
    expect(h.state().events).toEqual(['application.status_changed']);
  });

  it('publishes only with same-transaction evidence and replays without a second event', async () => {
    const h = setup();
    const publish = (tx: Tx) =>
      h.ports.publish(
        {
          applicationId,
          expectedVersion: 2,
          actor,
          result: 'REJECTED',
          publicMessage: 'Cảm ơn bạn',
          internalReason: 'Không phù hợp',
          idempotencyKey: 'key',
          evidence: {
            applicationId,
            transactionId: tx.id,
            proposedCount: 0,
            confirmedCount: 0,
            completedCount: 0,
            noShowCount: 0,
            missingEvaluationCount: 0,
          },
        },
        tx,
      );
    await h.uow.run(publish);
    await h.uow.run(publish);
    expect(h.state().app.status).toBe('REJECTED');
    expect(h.state().history).toHaveLength(1);
    expect(h.state().history[0]).toMatchObject({
      reason: 'Không phù hợp',
      publicMessage: 'Cảm ơn bạn',
    });
    expect(h.state().events).toEqual(['application.result_published']);
  });

  it('rolls back the result when Outbox fails', async () => {
    const h = setup(true);
    await expect(
      h.uow.run((tx) =>
        h.ports.publish(
          {
            applicationId,
            expectedVersion: 2,
            actor,
            result: 'REJECTED',
            publicMessage: 'Cảm ơn',
            internalReason: 'Lý do',
            idempotencyKey: 'key',
            evidence: {
              applicationId,
              transactionId: tx.id,
              proposedCount: 0,
              confirmedCount: 0,
              completedCount: 0,
              noShowCount: 0,
              missingEvaluationCount: 0,
            },
          },
          tx,
        ),
      ),
    ).rejects.toThrow('Outbox unavailable');
    expect(h.state().app.status).toBe('SHORTLISTED');
    expect(h.state().claims.size).toBe(0);
  });
});
