import type {
  Actor,
  CandidateProfilePort,
  CvSelectionPort,
  IdentityCandidatePort,
  JobApplicationPort,
} from '../../../../../../libs/contracts/backend';
import type { TransactionContext } from '../../../../../../libs/platform/database/unit-of-work';
import { SubmitApplicationWorkflowService } from './submit-application-workflow.service';
import type {
  SubmitApplicationPersistenceService,
  SubmissionPersistenceCommand,
} from './submit-application.service';

const candidateId = '11111111-1111-4111-8111-111111111111';
const jobId = '22222222-2222-4222-8222-222222222222';
const cvId = '33333333-3333-4333-8333-333333333333';
const actor: Actor = { userId: candidateId, sessionId: 'session', roles: ['CANDIDATE'] };
const tx = { id: 'tx' } as TransactionContext;

function setup() {
  const calls: string[] = [];
  const identity = {
    assertActiveCandidate: jest.fn(async () => {
      calls.push('identity');
      return { userId: candidateId, name: 'Candidate', email: 'candidate@example.test' };
    }),
  } as unknown as IdentityCandidatePort;
  const jobs = {
    lockForSubmission: jest.fn(async () => {
      calls.push('job');
      return { jobId, companyId: 'company', deadline: new Date().toISOString() };
    }),
  } as unknown as JobApplicationPort;
  const cvs = {
    requireReady: jest.fn(async () => {
      calls.push('cv');
      return { cvId, candidateId, storageVersionId: 'v1', checksumSha256: 'abc' };
    }),
  } as unknown as CvSelectionPort;
  const profiles = {
    getSubmissionSnapshot: jest.fn(async () => {
      calls.push('snapshot');
      return { name: 'Candidate', email: 'candidate@example.test', phone: null, headline: null };
    }),
  } as unknown as CandidateProfilePort;
  let saved: SubmissionPersistenceCommand | undefined;
  const persistence = {
    execute: jest.fn(async (command: SubmissionPersistenceCommand) => {
      saved = command;
      await command.authorize(tx);
      const verified = await command.verifyNew(tx);
      return { kind: 'created' as const, applicationId: verified.cvId };
    }),
  } as unknown as SubmitApplicationPersistenceService;
  return {
    service: new SubmitApplicationWorkflowService(persistence, identity, jobs, cvs, profiles),
    calls,
    identity,
    jobs,
    cvs,
    profiles,
    saved: () => saved,
  };
}

describe('UC02 submission workflow', () => {
  it('locks candidate, then BE1 company/job, then READY CV and snapshots profile', async () => {
    const h = setup();
    await expect(
      h.service.submit(actor, jobId, { cvId, coverLetter: 'Hello' }, 'submit-1'),
    ).resolves.toEqual({ kind: 'created', applicationId: cvId });
    expect(h.calls).toEqual(['identity', 'job', 'cv', 'snapshot']);
    expect(h.saved()).toMatchObject({ candidateId, jobId, cvId, idempotencyKey: 'submit-1' });
    expect(h.jobs.lockForSubmission).toHaveBeenCalledWith(jobId, candidateId, tx);
    expect(h.cvs.requireReady).toHaveBeenCalledWith(candidateId, cvId, tx);
  });

  it('does not snapshot or check CV if BE1 rejects a closed job', async () => {
    const h = setup();
    jest.spyOn(h.jobs, 'lockForSubmission').mockRejectedValueOnce(new Error('job closed'));
    await expect(h.service.submit(actor, jobId, { cvId }, 'submit-2')).rejects.toThrow(
      'job closed',
    );
    expect(h.cvs.requireReady).not.toHaveBeenCalled();
    expect(h.profiles.getSubmissionSnapshot).not.toHaveBeenCalled();
  });

  it('rejects malformed IDs or idempotency key before a transaction', async () => {
    const h = setup();
    await expect(h.service.submit(actor, 'bad', { cvId }, 'key')).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    await expect(h.service.submit(actor, jobId, { cvId }, ' bad ')).rejects.toMatchObject({
      code: 'VALIDATION_FAILED',
    });
    expect(h.calls).toEqual([]);
  });
});
