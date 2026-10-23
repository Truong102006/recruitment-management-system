import type {
  Actor,
  CvSelectionPort,
  IdentityCandidatePort,
  JobApplicationPort,
  CandidateProfilePort,
} from '../../../../../../libs/contracts/backend';
import type { SubmitApplicationRequest } from '../../../../../../libs/contracts/public';
import { ApplicationRuleError } from '../rules/application-rule.error';
import { SubmitApplicationPersistenceService } from './submit-application.service';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Coordinates BE1 identity/job and BE2 CV/profile inside the persistence transaction. */
export class SubmitApplicationWorkflowService {
  constructor(
    private readonly persistence: SubmitApplicationPersistenceService,
    private readonly identity: IdentityCandidatePort,
    private readonly jobs: JobApplicationPort,
    private readonly cvs: CvSelectionPort,
    private readonly profiles: CandidateProfilePort,
  ) {}

  async submit(actor: Actor, jobId: string, request: SubmitApplicationRequest, key: string) {
    if (
      !actor?.userId ||
      !uuid.test(jobId) ||
      !request ||
      !uuid.test(request.cvId) ||
      typeof key !== 'string' ||
      key.length < 1 ||
      key.length > 100 ||
      key.trim() !== key
    )
      throw new ApplicationRuleError('VALIDATION_FAILED', 'Invalid submission input');
    let lockedIdentity: { userId: string; name: string; email: string } | undefined;
    return this.persistence.execute({
      candidateId: actor.userId,
      jobId,
      cvId: request.cvId,
      coverLetter: request.coverLetter,
      idempotencyKey: key,
      authorize: async (tx) => {
        const candidate = await this.identity.assertActiveCandidate(actor, tx);
        lockedIdentity = candidate;
        return { candidateId: candidate.userId };
      },
      verifyNew: async (tx) => {
        // Identity has already acquired the candidate user lock. BE1 locks company/job
        // and verifies APPROVED/PUBLISHED/deadline/membership at DB clock.
        await this.jobs.lockForSubmission(jobId, actor.userId, tx);
        // CV lock follows company/job. A concurrent delete cannot pass the same user lock.
        await this.cvs.requireReady(actor.userId, request.cvId, tx);
        if (!lockedIdentity || lockedIdentity.userId !== actor.userId)
          throw new ApplicationRuleError('RESOURCE_NOT_FOUND', 'Candidate scope changed');
        const snapshot = await this.profiles.getSubmissionSnapshot(
          actor.userId,
          { name: lockedIdentity.name, email: lockedIdentity.email },
          tx,
        );
        return { candidateId: actor.userId, cvId: request.cvId, snapshot };
      },
    });
  }
}
