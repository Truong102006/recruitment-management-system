import { apiClient } from '../../../lib/http/api-client';
import type {
  CandidateApplicationDto,
  CandidateHistoryDto,
  PageResponse,
  SubmitApplicationRequest,
  ChangeCvRequest,
  WithdrawApplicationRequest,
} from '@rms/contracts/public';

export async function listCandidateApplications(
  page: number = 1,
  pageSize: number = 20,
): Promise<PageResponse<CandidateApplicationDto>> {
  return apiClient.get<PageResponse<CandidateApplicationDto>>('/api/applications', {
    params: { page, pageSize },
  });
}

export async function getCandidateApplication(id: string): Promise<CandidateApplicationDto> {
  return apiClient.get<CandidateApplicationDto>(`/api/applications/${encodeURIComponent(id)}`);
}

export async function getApplicationHistory(id: string): Promise<CandidateHistoryDto[]> {
  return apiClient.get<CandidateHistoryDto[]>(
    `/api/applications/${encodeURIComponent(id)}/history`,
  );
}

export async function submitApplication(
  jobId: string,
  payload: SubmitApplicationRequest,
  idempotencyKey?: string,
): Promise<CandidateApplicationDto> {
  return apiClient.post<CandidateApplicationDto>(
    `/api/jobs/${encodeURIComponent(jobId)}/applications`,
    payload,
    { idempotencyKey },
  );
}

export async function requestCvChange(
  applicationId: string,
  payload: ChangeCvRequest,
  idempotencyKey?: string,
): Promise<void> {
  return apiClient.post<void>(
    `/api/applications/${encodeURIComponent(applicationId)}/cv-change`,
    payload,
    { idempotencyKey },
  );
}

export async function withdrawApplication(
  applicationId: string,
  payload: WithdrawApplicationRequest,
): Promise<void> {
  return apiClient.post<void>(
    `/api/applications/${encodeURIComponent(applicationId)}/withdraw`,
    payload,
  );
}
