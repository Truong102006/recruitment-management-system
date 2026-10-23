import { apiClient } from '../../../../lib/http/api-client';
import type {
  JobDetailDto,
  JobSummaryDto,
  CreateJobRequest,
  UpdateJobRequest,
  PublishJobRequest,
  CloseJobRequest,
  SkillDto,
  JobPostStatus,
} from '@rms/contracts/public';

export interface CompanyJobsQuery {
  page?: number;
  pageSize?: number;
  status?: JobPostStatus;
  q?: string;
}

export interface CompanyJobsResponse {
  data: JobSummaryDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export const recruiterJobsApi = {
  getCompanyJobs: async (
    companyId: string,
    params?: CompanyJobsQuery,
  ): Promise<CompanyJobsResponse> => {
    return apiClient.get<CompanyJobsResponse>(`/companies/${companyId}/jobs`, {
      params: params as Record<string, string | number | boolean | undefined>,
    });
  },

  getJobDetail: async (jobId: string, companyId?: string): Promise<JobDetailDto> => {
    if (companyId) {
      return apiClient.get<JobDetailDto>(`/companies/${companyId}/jobs/${jobId}`);
    }
    return apiClient.get<JobDetailDto>(`/jobs/${jobId}`);
  },

  createJob: async (payload: CreateJobRequest): Promise<JobDetailDto> => {
    return apiClient.post<JobDetailDto>('/jobs', payload);
  },

  updateJob: async (jobId: string, payload: UpdateJobRequest): Promise<JobDetailDto> => {
    return apiClient.patch<JobDetailDto>(`/jobs/${jobId}`, payload);
  },

  publishJob: async (jobId: string, payload: PublishJobRequest): Promise<JobDetailDto> => {
    return apiClient.post<JobDetailDto>(`/jobs/${jobId}/publish`, payload);
  },

  closeJob: async (jobId: string, payload: CloseJobRequest): Promise<JobDetailDto> => {
    return apiClient.post<JobDetailDto>(`/jobs/${jobId}/close`, payload);
  },

  getSkills: async (): Promise<SkillDto[]> => {
    return apiClient.get<SkillDto[]>('/skills');
  },
};
