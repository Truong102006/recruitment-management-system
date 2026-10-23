import type {
  Actor,
  CompanyAccessPort,
  CvSelectionPort,
  IdentityCandidatePort,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import type {
  IdempotencyStore,
  IdempotencyRequest,
  IdempotencyClaim,
} from '../../../../../../libs/platform/idempotency/idempotency-store';
import type {
  ApplicationWriteRepository,
  NewApplicationHistory,
} from '../repositories/application.repository';
import type {
  ApplicationRow,
  ApplicationWorkflowRepository,
  CvRequestRow,
} from '../repositories/application-workflow.repository';
import { CvChangeWorkflowService } from './cv-change-workflow.service';

const candidateId = '11111111-1111-4111-8111-111111111111';
const recruiterId = '22222222-2222-4222-8222-222222222222';
const applicationId = '33333333-3333-4333-8333-333333333333';
const companyId = '44444444-4444-4444-8444-444444444444';
const oldCv = '55555555-5555-4555-8555-555555555555';
const newCv = '66666666-6666-4666-8666-666666666666';
const candidate: Actor = { userId: candidateId, sessionId: 's', roles: ['CANDIDATE'] };
const recruiter: Actor = { userId: recruiterId, sessionId: 's', roles: ['RECRUITER'] };

interface State {
  app: ApplicationRow;
  request: CvRequestRow | null;
  history: NewApplicationHistory[];
  events: string[];
  keys: Record<string, { hash: string; resourceId: string | null; responseCode: number }>;
}
function setup(status: ApplicationRow['status']) {
  let committed: State = {
    app: {
      id: applicationId,
      candidateId,
      jobId: '77777777-7777-4777-8777-777777777777',
      companyId,
      status,
      version: 0,
      originalCvVersionId: oldCv,
      currentCvVersionId: oldCv,
    },
    request: null,
    history: [],
    events: [],
    keys: {},
  };
  const calls: string[] = [];
  const uow = new ManagedUnitOfWork({
    async transaction<T>(work: (state: State) => Promise<T>): Promise<T> {
      const draft = structuredClone(committed);
      const result = await work(draft);
      committed = draft;
      return result;
    },
  });
  type Tx = Parameters<ApplicationWorkflowRepository['scope']>[1];
  const state = (tx: Tx) => uow.clientFor(tx);
  const repo: ApplicationWorkflowRepository = {
    async scope(_id, tx) {
      return structuredClone(state(tx).app);
    },
    async lockUsers() {
      calls.push('users');
    },
    async lockCompany() {
      calls.push('company');
      return { approvalStatus: 'APPROVED' };
    },
    async lockApplication(_id, tx) {
      calls.push('application');
      return structuredClone(state(tx).app);
    },
    async pendingCvRequest(_id, tx) {
      return state(tx).request?.status === 'PENDING' ? state(tx).request : null;
    },
    async cvRequest(_id, tx) {
      return state(tx).request;
    },
    async createCvRequest(input, tx) {
      state(tx).request = {
        id: input.id,
        applicationId: input.applicationId,
        candidateId: input.candidateId,
        newCvId: input.newCvId,
        baseCvVersionId: input.baseCvId,
        status: 'PENDING',
        version: 0,
      };
    },
    async decideCvRequest(_id, _version, decision, _reviewer, _reason, tx) {
      state(tx).request!.status = decision;
      state(tx).request!.version++;
    },
    async replaceCv(_id, _version, _old, next, tx) {
      state(tx).app.currentCvVersionId = next;
      state(tx).app.version++;
    },
    async changeStatus() {
      throw new Error('unused');
    },
    async cancelPendingCv() {
      throw new Error('unused');
    },
    async hasOpenApplication() {
      return false;
    },
  };
  const identity = {
    assertActiveCandidate: jest.fn(async () => {
      calls.push('candidate');
      return { userId: candidateId, name: 'Candidate', email: 'candidate@example.test' };
    }),
  } as unknown as IdentityCandidatePort;
  const company = {
    assertRecruiter: jest.fn(async () => {
      calls.push('recruiter');
      return { companyId, permission: 'RECRUITER', membershipId: 'member' };
    }),
  } as unknown as CompanyAccessPort;
  const cvs = {
    requireReady: jest.fn(async () => {
      calls.push('cv');
      return { cvId: newCv, candidateId, storageVersionId: 'v1', checksumSha256: 'sha' };
    }),
  } as unknown as CvSelectionPort;
  const writer = {
    async createSubmitted() {
      throw new Error('unused');
    },
    async appendHistory(row: NewApplicationHistory, tx: Tx) {
      state(tx).history.push(row);
    },
  } as ApplicationWriteRepository;
  const idempotency: IdempotencyStore = {
    async claim(input: IdempotencyRequest, tx: Tx): Promise<IdempotencyClaim> {
      const existing = state(tx).keys[input.key];
      if (!existing) {
        state(tx).keys[input.key] = { hash: input.requestHash, resourceId: null, responseCode: 0 };
        return { kind: 'claimed' };
      }
      if (existing.hash !== input.requestHash) return { kind: 'conflict' };
      return {
        kind: 'replay',
        resourceId: existing.resourceId!,
        responseCode: existing.responseCode,
      };
    },
    async complete(input, result, tx) {
      state(tx).keys[input.key]!.resourceId = result.resourceId;
      state(tx).keys[input.key]!.responseCode = result.responseCode;
    },
  };
  let failOutbox = false;
  const outbox: OutboxPort = {
    async append(event, tx) {
      if (failOutbox) throw new Error('outbox unavailable');
      state(tx).events.push(event.eventType);
    },
  };
  return {
    service: new CvChangeWorkflowService(
      uow,
      identity,
      company,
      cvs,
      repo,
      writer,
      idempotency,
      outbox,
    ),
    state: () => committed,
    calls,
    failOutbox: () => {
      failOutbox = true;
    },
  };
}

describe('UC06 CV change workflow', () => {
  it('replaces only current CV at SUBMITTED, writes history/event, and replays without a second change', async () => {
    const h = setup('SUBMITTED');
    const first = await h.service.requestChange(candidate, applicationId, newCv, 0, 'change-1');
    expect(first.kind).toBe('direct');
    expect(h.state().app).toMatchObject({
      originalCvVersionId: oldCv,
      currentCvVersionId: newCv,
      version: 1,
    });
    expect(h.state().history[0]).toMatchObject({
      eventType: 'CV_REPLACED',
      oldCvId: oldCv,
      newCvId: newCv,
      aggregateVersion: 1,
    });
    expect(h.state().events).toEqual(['application.cv_replaced']);
    expect(
      await h.service.requestChange(candidate, applicationId, newCv, 0, 'change-1'),
    ).toMatchObject({ kind: 'direct', replay: true });
    expect(h.state().history).toHaveLength(1);
  });

  it('creates a pending request at SCREENING and recruiter approves under version checks', async () => {
    const h = setup('SCREENING');
    const created = await h.service.requestChange(candidate, applicationId, newCv, 0, 'change-2');
    expect(created.kind).toBe('request');
    expect(h.state().app.currentCvVersionId).toBe(oldCv);
    expect(h.state().events).toEqual(['application.cv_change_requested']);
    await expect(
      h.service.reviewChange(recruiter, created.id, 0, 1, 'APPROVE'),
    ).rejects.toMatchObject({ code: 'VERSION_CONFLICT' });
    expect(h.state().app.currentCvVersionId).toBe(oldCv);
    const approved = await h.service.reviewChange(recruiter, created.id, 0, 0, 'APPROVE');
    expect(approved).toMatchObject({
      status: 'APPROVED',
      applicationVersion: 1,
      requestVersion: 1,
    });
    expect(h.state().app.currentCvVersionId).toBe(newCv);
    expect(h.state().request?.status).toBe('APPROVED');
    expect(h.state().events).toEqual([
      'application.cv_change_requested',
      'application.cv_replaced',
    ]);
    expect(h.calls).toContain('users');
  });

  it('rolls back CV replacement when outbox fails', async () => {
    const h = setup('SUBMITTED');
    h.failOutbox();
    await expect(
      h.service.requestChange(candidate, applicationId, newCv, 0, 'change-3'),
    ).rejects.toThrow('outbox unavailable');
    expect(h.state().app.currentCvVersionId).toBe(oldCv);
    expect(h.state().history).toHaveLength(0);
    expect(Object.keys(h.state().keys)).toHaveLength(0);
  });
});
