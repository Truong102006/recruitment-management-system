import type {
  CandidateApplicationDto,
  CandidateHistoryDto,
} from '../../../../../../libs/contracts/public';

/**
 * Authorization and scope filtering MUST happen before mapping.
 * Explicit field selection is a second boundary against accidental ORM/private-field leaks.
 */
export function toCandidateApplication(source: CandidateApplicationDto): CandidateApplicationDto {
  return {
    applicationId: source.applicationId,
    jobId: source.jobId,
    status: source.status,
    version: source.version,
    originalCvVersionId: source.originalCvVersionId,
    currentCvVersionId: source.currentCvVersionId,
    candidateSnapshot: {
      name: source.candidateSnapshot.name,
      email: source.candidateSnapshot.email,
      phone: source.candidateSnapshot.phone,
      headline: source.candidateSnapshot.headline,
    },
    coverLetter: source.coverLetter,
    submittedAt: source.submittedAt,
    updatedAt: source.updatedAt,
    resultMessage: source.resultMessage,
    resultPublishedAt: source.resultPublishedAt,
  };
}

export function toCandidateHistory(source: CandidateHistoryDto): CandidateHistoryDto {
  return {
    id: source.id,
    eventType: source.eventType,
    fromStatus: source.fromStatus,
    toStatus: source.toStatus,
    oldCvId: source.oldCvId,
    newCvId: source.newCvId,
    publicMessage: source.publicMessage,
    createdAt: source.createdAt,
    aggregateVersion: source.aggregateVersion,
  };
}
