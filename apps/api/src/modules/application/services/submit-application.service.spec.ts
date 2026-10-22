import type { OutboxPort } from '../../../../../../libs/contracts/backend';
import type { Be2Event } from '../../../../../../libs/contracts/backend/events';
import type {
  TransactionContext,
  TransactionDriver,
} from '../../../../../../libs/platform/database/unit-of-work';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import type {
  IdempotencyClaim,
  IdempotencyRequest,
  IdempotencyStore,
} from '../../../../../../libs/platform/idempotency/idempotency-store';
import { IdempotencyError } from '../../../../../../libs/platform/idempotency/sql-idempotency-store';
import type {
  ApplicationWriteRepository,
  NewApplicationHistory,
  SubmittedApplication,
} from '../repositories/application.repository';
import { SubmitApplicationPersistenceService } from './submit-application.service';

interface State {
  applications: SubmittedApplication[];
  history: NewApplicationHistory[];
  events: Be2Event[];
  keys: Record<string, { hash: string; resourceId: string | null }>;
}

function harness() {
  let committed: State = { applications: [], history: [], events: [], keys: {} };
  const driver: TransactionDriver<State> = {
    async transaction<T>(work: (client: State) => Promise<T>): Promise<T> {
      const draft = structuredClone(committed);
      const result = await work(draft);
      committed = draft;
      return result;
    },
  };
  const uow = new ManagedUnitOfWork(driver);
  const keyOf = (request: IdempotencyRequest) =>
    `${request.userId}:${request.operation}:${request.key}`;
  const idempotency: IdempotencyStore = {
    async claim(request: IdempotencyRequest, tx: TransactionContext): Promise<IdempotencyClaim> {
      const state = uow.clientFor(tx);
      const key = keyOf(request);
      const existing = state.keys[key];
      if (!existing) {
        state.keys[key] = { hash: request.requestHash, resourceId: null };
        return { kind: 'claimed' };
      }
      if (existing.hash !== request.requestHash) return { kind: 'conflict' };
      if (!existing.resourceId) return { kind: 'in_progress', retryAfterSeconds: 1 };
      return { kind: 'replay', resourceId: existing.resourceId, responseCode: 201 };
    },
    async complete(request, result, tx): Promise<void> {
      const row = uow.clientFor(tx).keys[keyOf(request)];
      if (!row || row.resourceId) throw new Error('missing claim');
      row.resourceId = result.resourceId;
    },
  };
  const applications: ApplicationWriteRepository = {
    async createSubmitted(record, tx) {
      uow.clientFor(tx).applications.push(record);
    },
    async appendHistory(record, tx) {
      uow.clientFor(tx).history.push(record);
    },
  };
  let failOutbox = false;
  const outbox: OutboxPort = {
    async append(event, tx) {
      if (failOutbox) throw new Error('outbox failed');
      uow.clientFor(tx).events.push(event);
    },
  };
  const service = new SubmitApplicationPersistenceService(uow, idempotency, applications, outbox);
  const input = {
    candidateId: 'candidate-1',
    jobId: 'job-1',
    cvId: 'cv-1',
    coverLetter: '  Xin chào  ',
    idempotencyKey: 'submit-1',
    authorize: jest.fn(async () => ({ candidateId: 'candidate-1' })),
    verifyNew: jest.fn(async () => ({
      candidateId: 'candidate-1',
      cvId: 'cv-1',
      snapshot: { name: 'Ứng viên', email: 'candidate@example.test', phone: null, headline: null },
    })),
  };
  return {
    service,
    input,
    state: () => committed,
    failOutbox: () => {
      failOutbox = true;
    },
    recoverOutbox: () => {
      failOutbox = false;
    },
  };
}

describe('submission persistence slice', () => {
  it('writes application, history, event and claim atomically; replay checks current access', async () => {
    const h = harness();
    const created = await h.service.execute(h.input);
    expect(created.kind).toBe('created');
    expect(h.state().applications).toHaveLength(1);
    expect(h.state().applications[0]).toMatchObject({
      coverLetter: 'Xin chào',
      cvId: 'cv-1',
      candidateId: 'candidate-1',
    });
    expect(h.state().history[0]).toMatchObject({
      eventType: 'SUBMIT',
      aggregateVersion: 0,
      toStatus: 'SUBMITTED',
    });
    expect(h.state().events[0]).toMatchObject({
      eventType: 'application.submitted',
      aggregateVersion: 0,
    });
    const replay = await h.service.execute(h.input);
    expect(replay).toEqual({ kind: 'replay', applicationId: created.applicationId });
    expect(h.input.authorize).toHaveBeenCalledTimes(2);
    expect(h.input.verifyNew).toHaveBeenCalledTimes(1);
    expect(h.state().applications).toHaveLength(1);
    expect(h.state().history).toHaveLength(1);
    expect(h.state().events).toHaveLength(1);
  });

  it('rolls back all rows when outbox fails, then allows retry with same key', async () => {
    const h = harness();
    h.failOutbox();
    await expect(h.service.execute(h.input)).rejects.toThrow('outbox failed');
    expect(h.state()).toEqual({ applications: [], history: [], events: [], keys: {} });
    h.recoverOutbox();
    expect((await h.service.execute(h.input)).kind).toBe('created');
    expect(h.state().applications).toHaveLength(1);
  });

  it('rejects a changed payload under one key without any new writes', async () => {
    const h = harness();
    await h.service.execute(h.input);
    await expect(
      h.service.execute({
        ...h.input,
        cvId: 'cv-2',
        verifyNew: async () => ({
          candidateId: 'candidate-1',
          cvId: 'cv-2',
          snapshot: {
            name: 'Ứng viên',
            email: 'candidate@example.test',
            phone: null,
            headline: null,
          },
        }),
      }),
    ).rejects.toMatchObject({ code: 'KEY_CONFLICT' } satisfies Partial<IdempotencyError>);
    expect(h.state().applications).toHaveLength(1);
  });

  it('requires current authorization for replay without rechecking new-submission eligibility', async () => {
    const h = harness();
    await h.service.execute(h.input);
    await expect(
      h.service.execute({
        ...h.input,
        authorize: async () => ({ candidateId: 'someone-else' }),
      }),
    ).rejects.toMatchObject({ code: 'RESOURCE_NOT_FOUND' });
    const replay = await h.service.execute({
      ...h.input,
      verifyNew: async () => {
        throw new Error('job is now closed');
      },
    });
    expect(replay.kind).toBe('replay');
    expect(h.state().applications).toHaveLength(1);
  });
});
