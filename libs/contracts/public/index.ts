// Browser-safe entry point: no ORM, Node, session, storage key or internal evaluation types.
export const APPLICATION_STATUSES = [
  'SUBMITTED',
  'SCREENING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'INTERVIEWED',
  'HIRED',
  'REJECTED',
  'WITHDRAWN',
] as const;
export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];
export type ResultStatus = Extract<ApplicationStatus, 'HIRED' | 'REJECTED'>;

export interface ApiResponse<T> {
  data: T;
}
export interface PageResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}
export interface ApiError {
  code: string;
  message: string;
  fieldErrors?: Record<string, string[]>;
  traceId: string;
}

// Wire names match Word §7.1. Backend ports use expectedVersion internally.
export interface SubmitApplicationRequest {
  cvId: string;
  coverLetter?: string;
}
export interface ReviewApplicationRequest {
  status: 'SCREENING' | 'SHORTLISTED';
  version: number;
}
export interface WithdrawApplicationRequest {
  version: number;
}
export interface ChangeCvRequest {
  newCvId: string;
  version: number;
}
export interface ReviewCvChangeRequest {
  applicationVersion: number;
  requestVersion: number;
  reason?: string;
}
export interface PublishResultRequest {
  result: ResultStatus;
  message: string;
  reason?: string; // internal, required for REJECTED; never mapped into candidate responses
  version: number;
}

export interface CandidateSnapshot {
  name: string;
  email: string;
  phone: string | null;
  headline: string | null;
}
export interface CandidateApplicationDto {
  applicationId: string;
  jobId: string;
  status: ApplicationStatus;
  version: number;
  originalCvVersionId: string;
  currentCvVersionId: string;
  candidateSnapshot: CandidateSnapshot;
  coverLetter: string | null;
  submittedAt: string;
  updatedAt: string;
  resultMessage: string | null;
  resultPublishedAt: string | null;
}
export interface CandidateHistoryDto {
  id: string;
  eventType:
    | 'SUBMIT'
    | 'STATUS_CHANGE'
    | 'CV_REPLACED'
    | 'RESULT_PUBLISHED'
    | 'INTERVIEW_CONFIRMED'
    | 'INTERVIEW_CANCELLED'
    | 'WITHDRAW';
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus;
  oldCvId: string | null;
  newCvId: string | null;
  publicMessage: string | null;
  createdAt: string;
  aggregateVersion: number;
}

export interface CandidateProfileDto {
  name: string;
  email: string;
  phone: string | null;
  headline: string | null;
  summary: string | null;
  location: string | null;
  skillIds: string[];
  version: number;
}
export interface UpdateCandidateProfileRequest {
  name?: string;
  phone?: string | null;
  headline?: string | null;
  summary?: string | null;
  location?: string | null;
  skillIds?: string[];
  version: number;
}
