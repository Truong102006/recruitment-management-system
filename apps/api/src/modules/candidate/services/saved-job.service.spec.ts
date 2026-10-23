import type {
  Actor,
  IdentityCandidatePort,
  JobVisibilityPort,
  OutboxPort,
} from '../../../../../../libs/contracts/backend';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import type { SavedJobRepository, SavedJobRow } from '../repositories/saved-job.repository';
import { SavedJobService } from './saved-job.service';

const candidateId = '11111111-1111-4111-8111-111111111111';
const jobId = '22222222-2222-4222-8222-222222222222';
const actor: Actor = { userId: candidateId, sessionId: 's', roles: ['CANDIDATE'] };

function setup() {
  let committed = { saved: [] as SavedJobRow[], events: [] as string[] };
  const uow = new ManagedUnitOfWork({
    async transaction<T>(work: (state: typeof committed) => Promise<T>) {
      const draft = structuredClone(committed);
      const result = await work(draft);
      committed = draft;
      return result;
    },
  });
  type Tx = Parameters<SavedJobRepository['save']>[2];
  const state = (tx: Tx) => uow.clientFor(tx);
  const repository: SavedJobRepository = {
    async save(_candidateId, id, tx) {
      if (state(tx).saved.some((row) => row.jobId === id)) return false;
      state(tx).saved.push({ jobId: id, savedAt: new Date(), title: 'Public title' });
      return true;
    },
    async remove(_candidateId, id, tx) {
      const old = state(tx).saved.length;
      state(tx).saved = state(tx).saved.filter((row) => row.jobId !== id);
      return old !== state(tx).saved.length;
    },
    async list(_candidateId, _page, _size, tx) {
      return { rows: state(tx).saved, total: state(tx).saved.length };
    },
  };
  const identity = {
    assertActiveCandidate: jest.fn(async () => ({
      userId: candidateId,
      name: 'A',
      email: 'a@example.test',
    })),
  } as unknown as IdentityCandidatePort;
  let available = true;
  const jobs = {
    getPublicOrPlaceholder: jest.fn(async () =>
      available
        ? { available: true, jobId, acceptingApplications: false }
        : { available: false, jobId },
    ),
  } as unknown as JobVisibilityPort;
  const outbox = {
    async append(event: { eventType: string }, tx: Tx) {
      state(tx).events.push(event.eventType);
    },
  } as OutboxPort;
  return {
    service: new SavedJobService(uow, identity, jobs, repository, outbox),
    state: () => committed,
    hide: () => {
      available = false;
    },
  };
}

describe('UC14 saved jobs', () => {
  it('saves/deletes idempotently and emits events only on changes', async () => {
    const h = setup();
    expect(await h.service.save(actor, jobId)).toEqual({ created: true });
    expect(await h.service.save(actor, jobId)).toEqual({ created: false });
    await h.service.remove(actor, jobId);
    await h.service.remove(actor, jobId);
    expect(h.state().events).toEqual(['saved_job.created', 'saved_job.deleted']);
  });
  it('shows a placeholder without leaking a restricted job title', async () => {
    const h = setup();
    await h.service.save(actor, jobId);
    h.hide();
    const page = await h.service.list(actor, 1, 20);
    expect(page.data).toMatchObject([
      { jobId, available: false, acceptingApplications: false, title: null },
    ]);
    await expect(h.service.save(actor, jobId)).rejects.toMatchObject({
      code: 'RESOURCE_NOT_FOUND',
    });
  });
});
