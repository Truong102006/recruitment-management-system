import type {
  Actor,
  CompanyAccessPort,
  IdentityCandidatePort,
  InterviewLifecyclePort,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import type {
  ApplicationWriteRepository,
  NewApplicationHistory,
} from '../repositories/application.repository';
import type {
  ApplicationWorkflowRepository,
  ApplicationRow,
  CvRequestRow,
} from '../repositories/application-workflow.repository';
import { ReviewApplicationWorkflowService } from './review-application-workflow.service';

const candidateId = '11111111-1111-4111-8111-111111111111';
const recruiterId = '22222222-2222-4222-8222-222222222222';
const companyId = '33333333-3333-4333-8333-333333333333';
const applicationId = '44444444-4444-4444-8444-444444444444';
const candidate: Actor = { userId: candidateId, sessionId: 's', roles: ['CANDIDATE'] };
const recruiter: Actor = { userId: recruiterId, sessionId: 's', roles: ['RECRUITER'] };
type State = {
  app: ApplicationRow;
  request: CvRequestRow | null;
  history: NewApplicationHistory[];
  events: string[];
  cancelled: boolean;
};

function setup(status: ApplicationRow['status']) {
  let committed: State = {
    app: {
      id: applicationId,
      candidateId,
      companyId,
      jobId: '55555555-5555-4555-8555-555555555555',
      status,
      version: 0,
      originalCvVersionId: '66666666-6666-4666-8666-666666666666',
      currentCvVersionId: '66666666-6666-4666-8666-666666666666',
    },
    request:
      status === 'SCREENING'
        ? {
            id: '77777777-7777-4777-8777-777777777777',
            applicationId,
            candidateId,
            newCvId: '88888888-8888-4888-8888-888888888888',
            baseCvVersionId: '66666666-6666-4666-8666-666666666666',
            status: 'PENDING',
            version: 0,
          }
        : null,
    history: [],
    events: [],
    cancelled: false,
  };
  const calls: string[] = [];
  const uow = new ManagedUnitOfWork({
    async transaction<T>(work: (state: State) => Promise<T>) {
      const draft = structuredClone(committed);
      const result = await work(draft);
      committed = draft;
      return result;
    },
  });
  type Tx = Parameters<ApplicationWorkflowRepository['scope']>[1];
  const state = (tx: Tx) => uow.clientFor(tx);
  const repo = {
    async scope() {
      return structuredClone(committed.app);
    },
    async lockUsers() {
      calls.push('users');
    },
    async lockCompany() {
      calls.push('company');
      return { approvalStatus: 'APPROVED' };
    },
    async lockApplication(_id: string, tx: Tx) {
      calls.push('application');
      return structuredClone(state(tx).app);
    },
    async changeStatus(
      _id: string,
      _version: number,
      _from: string,
      to: ApplicationRow['status'],
      tx: Tx,
    ) {
      state(tx).app.status = to;
      state(tx).app.version++;
    },
    async cancelPendingCv(_id: string, tx: Tx) {
      if (state(tx).request) state(tx).request!.status = 'CANCELLED';
    },
  } as unknown as ApplicationWorkflowRepository;
  const identity = {
    assertActiveCandidate: jest.fn(async () => ({
      userId: candidateId,
      name: 'Candidate',
      email: 'candidate@example.test',
    })),
  } as unknown as IdentityCandidatePort;
  const company = {
    assertRecruiter: jest.fn(async () => ({
      companyId,
      permission: 'RECRUITER',
      membershipId: 'membership',
    })),
  } as unknown as CompanyAccessPort;
  let failBe3 = false;
  const interviews = {
    async getLockScope() {
      return { userIds: [candidateId], interviewIds: ['interview'] };
    },
    async cancelOpenForApplication(_input: unknown, tx: Tx) {
      if (failBe3) throw new Error('BE3 cancellation failed');
      calls.push('cancel interviews');
      state(tx).cancelled = true;
      return { cancelledInterviewIds: ['interview'] };
    },
  } as unknown as InterviewLifecyclePort;
  const writer = {
    async appendHistory(row: NewApplicationHistory, tx: Tx) {
      state(tx).history.push(row);
    },
  } as ApplicationWriteRepository;
  const outbox = {
    async append(event: { eventType: string }, tx: Tx) {
      state(tx).events.push(event.eventType);
    },
  } as OutboxPort;
  return {
    service: new ReviewApplicationWorkflowService(
      uow,
      identity,
      company,
      interviews,
      repo,
      writer,
      outbox,
    ),
    calls,
    state: () => committed,
    failBe3: () => {
      failBe3 = true;
    },
  };
}

describe('UC07 review and withdraw', () => {
  it('moves SCREENING to SHORTLISTED and cancels a pending CV request atomically', async () => {
    const h = setup('SCREENING');
    expect(await h.service.review(recruiter, applicationId, 'SHORTLISTED', 0)).toMatchObject({
      status: 'SHORTLISTED',
      version: 1,
    });
    expect(h.state().request?.status).toBe('CANCELLED');
    expect(h.state().history[0]).toMatchObject({
      eventType: 'STATUS_CHANGE',
      fromStatus: 'SCREENING',
      toStatus: 'SHORTLISTED',
      aggregateVersion: 1,
    });
    expect(h.state().events).toEqual(['application.status_changed']);
    expect(h.calls).toEqual(['users', 'application']);
  });

  it('requires BE3 cancellation before WITHDRAWN and rolls back on BE3 failure', async () => {
    const h = setup('INTERVIEW_SCHEDULED');
    h.failBe3();
    await expect(h.service.withdraw(candidate, applicationId, 0)).rejects.toThrow(
      'BE3 cancellation failed',
    );
    expect(h.state().app.status).toBe('INTERVIEW_SCHEDULED');
    expect(h.state().history).toHaveLength(0);
    expect(h.state().events).toHaveLength(0);
  });

  it('records WITHDRAWN after BE3 cancels open interviews in the same transaction', async () => {
    const h = setup('INTERVIEW_SCHEDULED');
    expect(await h.service.withdraw(candidate, applicationId, 0)).toMatchObject({
      status: 'WITHDRAWN',
      version: 1,
    });
    expect(h.calls).toEqual(['users', 'company', 'application', 'cancel interviews']);
    expect(h.state().cancelled).toBe(true);
    expect(h.state().history[0]).toMatchObject({ eventType: 'WITHDRAW', toStatus: 'WITHDRAWN' });
    expect(h.state().events).toEqual(['application.withdrawn']);
  });
});
