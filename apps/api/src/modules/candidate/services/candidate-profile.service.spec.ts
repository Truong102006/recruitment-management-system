import type {
  Actor,
  IdentityCandidatePort,
  OutboxPort,
  SkillCatalogPort,
} from '../../../../../../libs/contracts/backend';
import type { Be2Event } from '../../../../../../libs/contracts/backend/events';
import type { TransactionDriver } from '../../../../../../libs/platform/database/unit-of-work';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import type {
  CandidateProfileRepository,
  CandidateProfileRow,
} from '../repositories/candidate-profile.repository';
import { CandidateProfileService } from './candidate-profile.service';

const skillA = '00000000-0000-4000-8000-000000000001';
const skillB = '00000000-0000-4000-8000-000000000002';
const actor: Actor = { userId: 'candidate-1', sessionId: 'session-1', roles: ['CANDIDATE'] };

interface State {
  name: string;
  profile: CandidateProfileRow;
  events: Be2Event[];
  submittedSnapshot: { name: string };
}

function harness() {
  let committed: State = {
    name: 'Tên cũ',
    profile: {
      userId: actor.userId,
      phone: null,
      headline: null,
      summary: null,
      location: null,
      skillIds: [skillA],
      version: 0,
    },
    events: [],
    submittedSnapshot: { name: 'Tên khi nộp' },
  };
  const driver: TransactionDriver<State> = {
    async transaction<T>(work: (state: State) => Promise<T>): Promise<T> {
      const draft = structuredClone(committed);
      const result = await work(draft);
      committed = draft;
      return result;
    },
  };
  const uow = new ManagedUnitOfWork(driver);
  const identity: IdentityCandidatePort = {
    async assertActiveCandidate(input, tx) {
      if (input.userId !== actor.userId) throw new Error('not active candidate');
      return {
        userId: input.userId,
        name: uow.clientFor(tx).name,
        email: 'candidate@example.test',
      };
    },
    async updateCandidateName(_actor, name, tx) {
      uow.clientFor(tx).name = name;
    },
  };
  const skills: SkillCatalogPort = {
    async assertActiveSkills(ids) {
      return ids.filter((id) => id !== skillB);
    },
  };
  const profiles: CandidateProfileRepository = {
    async ensureForCandidate() {},
    async getSubmissionSnapshot(candidateId, user, tx) {
      const profile = uow.clientFor(tx).profile;
      if (candidateId !== profile.userId) throw new Error('missing');
      return {
        name: user.name,
        email: user.email,
        phone: profile.phone,
        headline: profile.headline,
      };
    },
    async get(_id, tx) {
      return uow.clientFor(tx).profile;
    },
    async getForUpdate(_id, tx) {
      return uow.clientFor(tx).profile;
    },
    async update(_id, version, patch, tx) {
      const state = uow.clientFor(tx);
      if (state.profile.version !== version) return null;
      state.profile = { ...state.profile, ...patch, version: version + 1 };
      return state.profile.version;
    },
    async replaceSkills(_id, ids, tx) {
      const state = uow.clientFor(tx);
      state.profile = { ...state.profile, skillIds: ids };
    },
  };
  let failOutbox = false;
  const outbox: OutboxPort = {
    async append(event, tx) {
      if (failOutbox) throw new Error('outbox failed');
      uow.clientFor(tx).events.push(event);
    },
  };
  return {
    service: new CandidateProfileService(uow, identity, skills, profiles, outbox),
    state: () => committed,
    failOutbox: () => {
      failOutbox = true;
    },
  };
}

describe('UC12 candidate profile service', () => {
  it('reads an allowlisted DTO for the current candidate', async () => {
    const h = harness();
    expect(await h.service.get(actor)).toEqual({
      name: 'Tên cũ',
      email: 'candidate@example.test',
      phone: null,
      headline: null,
      summary: null,
      location: null,
      skillIds: [skillA],
      version: 0,
    });
  });

  it('updates BE1 name, BE2 profile and deduplicated skills in one transaction', async () => {
    const h = harness();
    const result = await h.service.patch(actor, {
      name: '  Tên mới  ',
      phone: '  +84123456789  ',
      summary: '  Tóm tắt  ',
      skillIds: [skillA, skillA],
      version: 0,
    });
    expect(result).toMatchObject({
      name: 'Tên mới',
      phone: '+84123456789',
      summary: 'Tóm tắt',
      skillIds: [skillA],
      version: 1,
    });
    expect(h.state().name).toBe('Tên mới');
    expect(h.state().profile.skillIds).toEqual([skillA]);
    expect(h.state().submittedSnapshot.name).toBe('Tên khi nộp');
    expect(h.state().events[0]).toMatchObject({
      eventType: 'candidate.profile_updated',
      aggregateVersion: 1,
      payload: { candidateId: actor.userId },
    });
  });

  it('rejects stale versions, unknown fields and inactive skills without writes', async () => {
    const h = harness();
    await expect(h.service.patch(actor, { name: 'Sai', version: 2 })).rejects.toMatchObject({
      code: 'VERSION_CONFLICT',
    });
    await expect(
      h.service.patch(actor, {
        version: 0,
        role: 'ADMIN',
      } as unknown as Parameters<CandidateProfileService['patch']>[1]),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    await expect(h.service.patch(actor, { version: 0, skillIds: [skillB] })).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(h.state().name).toBe('Tên cũ');
    expect(h.state().profile.version).toBe(0);
    expect(h.state().events).toHaveLength(0);
  });

  it('rolls back BE1 name, BE2 fields and skill changes when outbox fails', async () => {
    const h = harness();
    h.failOutbox();
    await expect(
      h.service.patch(actor, {
        version: 0,
        name: 'Tên mới',
        headline: 'Lập trình viên',
        skillIds: [],
      }),
    ).rejects.toThrow('outbox failed');
    expect(h.state().name).toBe('Tên cũ');
    expect(h.state().profile).toMatchObject({
      headline: null,
      skillIds: [skillA],
      version: 0,
    });
    expect(h.state().events).toHaveLength(0);
  });
});
