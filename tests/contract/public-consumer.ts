// Compiled separately with DOM libs and types: [] so backend/Node imports cannot leak into FE.
import {
  APPLICATION_STATUSES,
  type ApiResponse,
  type CandidateApplicationDto,
  type ChangeCvRequest,
  type PublishResultRequest,
  type ReviewApplicationRequest,
  type SubmitApplicationRequest,
  type UpdateCandidateProfileRequest,
  type WithdrawApplicationRequest,
  type JobSearchQuery,
} from '../../libs/contracts/public';

export const commands = {
  jobSearch: {
    sortBy: 'publishedAt',
    sortOrder: 'desc',
    salaryMin: 1000,
    salaryMax: 2000,
    currency: 'USD',
    skillMatchMode: 'ALL',
  } satisfies JobSearchQuery,
  submit: { cvId: '00000000-0000-4000-8000-000000000001' } satisfies SubmitApplicationRequest,
  review: { status: 'SCREENING', version: 0 } satisfies ReviewApplicationRequest,
  withdraw: { version: 0 } satisfies WithdrawApplicationRequest,
  change: { newCvId: '00000000-0000-4000-8000-000000000002', version: 0 } satisfies ChangeCvRequest,
  profile: { headline: null, version: 0 } satisfies UpdateCandidateProfileRequest,
  result: { result: 'HIRED', message: 'Welcome', version: 1 } satisfies PublishResultRequest,
};
export function renderStatus(response: ApiResponse<CandidateApplicationDto>): string {
  return APPLICATION_STATUSES.includes(response.data.status) ? response.data.status : 'UNKNOWN';
}

// These directives must remain compiler errors: no privileged transitions/private fields.
// @ts-expect-error review must not publish a final decision
const forbiddenReview: ReviewApplicationRequest = { status: 'HIRED', version: 0 };
// @ts-expect-error candidate DTO has no internal reason
type ForbiddenField = CandidateApplicationDto['reason'];
void forbiddenReview;
// @ts-expect-error public search only accepts the runtime sort allowlist
const forbiddenJobSort: JobSearchQuery = { sortBy: 'internalScore' };
void forbiddenJobSort;
export type { ForbiddenField };
