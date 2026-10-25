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

export interface SavedJobDto {
  jobId: string;
  savedAt: string;
  available: boolean;
  acceptingApplications: boolean;
  title: string | null;
}

// ==========================================
// BE1 Public Contracts: Identity & Auth
// ==========================================
export const USER_ROLES = ['CANDIDATE', 'RECRUITER', 'INTERVIEWER', 'ADMIN'] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const ACCOUNT_STATUSES = ['ACTIVE', 'LOCKED'] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  role?: 'CANDIDATE' | 'RECRUITER';
}

export interface RegisterResponse {
  userId: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  status: AccountStatus;
  requiresVerification: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  status: AccountStatus;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface SessionDto {
  userId: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  status: AccountStatus;
  csrfToken: string;
}

// ==========================================
// BE1 Public Contracts: Company & Memberships
// ==========================================
export const COMPANY_APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'] as const;
export type CompanyApprovalStatus = (typeof COMPANY_APPROVAL_STATUSES)[number];

export const MEMBERSHIP_ROLES = ['OWNER', 'RECRUITER', 'INTERVIEWER'] as const;
export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export const MEMBER_PERMISSIONS = ['RECRUITER', 'INTERVIEWER'] as const;
export type MemberPermission = (typeof MEMBER_PERMISSIONS)[number];

export interface CreateCompanyRequest {
  name: string;
  taxCode: string;
  address: string;
  website?: string | null;
  description?: string | null;
}

export interface UpdateCompanyRequest {
  name?: string;
  address?: string;
  website?: string | null;
  description?: string | null;
  version: number;
}

export interface ResubmitCompanyRequest {
  name?: string;
  address?: string;
  website?: string | null;
  description?: string | null;
  version: number;
}

export interface CompanyDto {
  id: string;
  name: string;
  taxCode: string;
  address: string;
  website: string | null;
  description: string | null;
  approvalStatus: CompanyApprovalStatus;
  rejectionReason: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyMemberDto {
  userId: string;
  email: string;
  fullName: string;
  role: MembershipRole;
  permissions: MemberPermission[];
  active: boolean;
  version: number;
  joinedAt: string;
}

export interface AddMemberRequest {
  email: string;
  role: 'RECRUITER' | 'INTERVIEWER';
  permissions?: MemberPermission[];
}

export interface UpdateMemberRequest {
  role?: 'RECRUITER' | 'INTERVIEWER';
  permissions?: MemberPermission[];
  active?: boolean;
  version: number;
  companyVersion: number;
}

export interface TransferOwnerRequest {
  targetUserId: string;
  targetMemberVersion: number;
  companyVersion: number;
}

// ==========================================
// BE1 Public Contracts: Jobs & Skills
// ==========================================
export const JOB_POST_STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED'] as const;
export type JobPostStatus = (typeof JOB_POST_STATUSES)[number];

export const JOB_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP'] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const WORKPLACE_MODES = ['ON_SITE', 'HYBRID', 'REMOTE'] as const;
export type WorkplaceMode = (typeof WORKPLACE_MODES)[number];

export const CURRENCIES = ['VND', 'USD'] as const;
export type Currency = (typeof CURRENCIES)[number];

export interface SalaryRange {
  min: number;
  max: number;
  currency: Currency;
}

export interface SkillDto {
  id: string;
  name: string;
  category?: string;
  active: boolean;
}

export interface CreateJobRequest {
  companyId: string;
  title?: string;
  description?: string;
  location?: string;
  headcount?: number;
  jobType?: JobType;
  workplaceMode?: WorkplaceMode;
  salary?: SalaryRange | null;
  deadline?: string;
  skillIds?: string[];
}

export interface UpdateJobRequest {
  title?: string;
  description?: string;
  location?: string;
  headcount?: number;
  jobType?: JobType;
  workplaceMode?: WorkplaceMode;
  salary?: SalaryRange | null;
  deadline?: string;
  skillIds?: string[];
  version: number;
}

export interface PublishJobRequest {
  version: number;
  deadline: string;
}

export interface CloseJobRequest {
  version: number;
  reason?: string;
}

export interface JobSummaryDto {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  location: string;
  jobType: JobType;
  workplaceMode: WorkplaceMode;
  salary: SalaryRange | null;
  deadline: string;
  publishedAt: string | null;
  status: JobPostStatus;
  skillIds: string[];
  skills: SkillDto[];
}

export interface JobDetailDto extends JobSummaryDto {
  description: string;
  headcount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobSearchQuery {
  q?: string;
  location?: string;
  jobType?: JobType;
  workplaceMode?: WorkplaceMode;
  skillIds?: string[];
  skillMatchMode?: 'ANY' | 'ALL';
  salaryMin?: number;
  salaryMax?: number;
  currency?: string;
  sortBy?: 'publishedAt' | 'createdAt' | 'deadline' | 'salaryMax';
  sortOrder?: 'asc' | 'desc';
  /** @deprecated Legacy type field; HTTP API accepts salaryMin. */
  minSalary?: number;
  /** @deprecated Legacy type field; HTTP API accepts salaryMax. */
  maxSalary?: number;
  page?: number;
  pageSize?: number;
  /** @deprecated Legacy type field; HTTP API accepts sortBy and sortOrder. */
  sort?: 'createdAt' | 'deadline' | 'salary';
}

// ==========================================
// BE1 Public Contracts: Admin
// ==========================================
export interface ReviewCompanyRequest {
  status: 'APPROVED' | 'REJECTED';
  reason?: string;
  version: number;
}

export interface SuspendCompanyRequest {
  reason: string;
  version: number;
}

export interface UnsuspendCompanyRequest {
  version: number;
}

export interface AdminUpdateUserStatusRequest {
  status: 'ACTIVE' | 'LOCKED';
  reason?: string;
  version: number;
}

export interface RecoverOwnerRequest {
  targetUserId: string;
  targetMemberVersion: number;
  companyVersion: number;
  reason: string;
}

export interface EligibleOwnerDto {
  userId: string;
  fullName: string;
  email: string;
  role: MembershipRole;
  active: boolean;
  version: number;
}

export interface AdminCloseJobRequest {
  version: number;
  reason: string;
}

export interface SecurityCancelInterviewRequest {
  version: number;
  reason: string;
}
