import type {
  Actor,
  CompanyAccessPort,
  IdentityCandidatePort,
} from '../../../../../../libs/contracts/backend';
import { ManagedUnitOfWork } from '../../../../../../libs/platform/database/unit-of-work';
import type { ApplicationWorkflowRepository } from '../repositories/application-workflow.repository';
import type { ApplicationQueryRepository } from '../repositories/application-query.repository';
import { ApplicationReadService } from './application-read.service';

const candidateId = '11111111-1111-4111-8111-111111111111';
const companyId = '22222222-2222-4222-8222-222222222222';
const applicationId = '33333333-3333-4333-8333-333333333333';
const candidate: Actor = { userId: candidateId, sessionId: 's', roles: ['CANDIDATE'] };

function setup() {
  const uow = new ManagedUnitOfWork({
    async transaction<T>(work: (client: object) => Promise<T>) {
      return work({});
    },
  });
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
      membershipId: 'member',
    })),
  } as unknown as CompanyAccessPort;
  const workflow = {
    scope: jest.fn(async () => ({
      id: applicationId,
      candidateId,
      companyId,
      jobId: '44444444-4444-4444-8444-444444444444',
      status: 'SUBMITTED',
      version: 0,
      originalCvVersionId: 'cv',
      currentCvVersionId: 'cv',
    })),
  } as unknown as ApplicationWorkflowRepository;
  const queries = {
    one: jest.fn(async () => ({ applicationId })),
    history: jest.fn(async () => []),
    forCandidate: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
    forCompany: jest.fn(async () => ({ data: [], meta: { page: 1, pageSize: 20, total: 0 } })),
  } as unknown as ApplicationQueryRepository;
  return {
    service: new ApplicationReadService(uow, identity, company, workflow, queries),
    queries,
  };
}

describe('application read scope', () => {
  it('does not read private data for another candidate', async () => {
    const h = setup();
    await expect(
      h.service.one({ ...candidate, userId: 'other' }, applicationId),
    ).rejects.toMatchObject({ code: 'ACTION_FORBIDDEN' });
    expect(h.queries.one).not.toHaveBeenCalled();
  });
  it('rejects invalid pagination before querying', async () => {
    const h = setup();
    await expect(h.service.listCandidate(candidate, 0, 200)).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(h.queries.forCandidate).not.toHaveBeenCalled();
  });
});
