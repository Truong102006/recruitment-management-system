import type {
  CandidateApplicationDto,
  CandidateHistoryDto,
  CandidateProfileDto,
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

/** The profile read model may contain internal account fields; return only the public contract. */
export function toCandidateProfile(source: CandidateProfileDto): CandidateProfileDto {
  return {
    name: source.name,
    email: source.email,
    phone: source.phone,
    headline: source.headline,
    summary: source.summary,
    location: source.location,
    skillIds: [...source.skillIds],
    version: source.version,
  };
}
