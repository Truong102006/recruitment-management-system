import { apiClient } from '../../../../lib/http/api-client';
import { isDevBrowser, devMockStore } from '../../../../lib/mocks/dev-mock-store';
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
    try {
      return await apiClient.get<CompanyJobsResponse>(`/companies/${companyId}/jobs`, {
        params: params as Record<string, string | number | boolean | undefined>,
      });
    } catch (err) {
      if (isDevBrowser()) return devMockStore.getJobs(params);
      throw err;
    }
  },

  getJobDetail: async (jobId: string, companyId?: string): Promise<JobDetailDto> => {
    try {
      if (companyId) {
        return await apiClient.get<JobDetailDto>(`/companies/${companyId}/jobs/${jobId}`);
      }
      return await apiClient.get<JobDetailDto>(`/jobs/${jobId}`);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.getJobDetail(jobId);
      throw err;
    }
  },

  createJob: async (payload: CreateJobRequest): Promise<JobDetailDto> => {
    try {
      return await apiClient.post<JobDetailDto>('/jobs', payload);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.createJob(payload);
      throw err;
    }
  },

  updateJob: async (jobId: string, payload: UpdateJobRequest): Promise<JobDetailDto> => {
    try {
      return await apiClient.patch<JobDetailDto>(`/jobs/${jobId}`, payload);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.updateJob(jobId, payload);
      throw err;
    }
  },

  publishJob: async (jobId: string, payload: PublishJobRequest): Promise<JobDetailDto> => {
    try {
      return await apiClient.post<JobDetailDto>(`/jobs/${jobId}/publish`, payload);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.publishJob(jobId, payload);
      throw err;
    }
  },

  closeJob: async (jobId: string, payload: CloseJobRequest): Promise<JobDetailDto> => {
    try {
      return await apiClient.post<JobDetailDto>(`/jobs/${jobId}/close`, payload);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.closeJob(jobId);
      throw err;
    }
  },

  getSkills: async (): Promise<SkillDto[]> => {
    try {
      return await apiClient.get<SkillDto[]>('/skills');
    } catch (err) {
      if (isDevBrowser()) return devMockStore.getSkills();
      throw err;
    }
  },
};
