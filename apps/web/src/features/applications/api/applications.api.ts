import { apiClient } from '../../../lib/http/api-client';
import {
  isDevBrowser,
  devMockStore,
  type DevApplicationItem,
} from '../../../lib/mocks/dev-mock-store';
import type {
  CandidateApplicationDto,
  CandidateHistoryDto,
  ApplicationStatus,
  ReviewApplicationRequest,
  ReviewCvChangeRequest,
  PublishResultRequest,
} from '@rms/contracts/public';

export interface CompanyApplicationsQuery {
  jobId?: string;
  status?: ApplicationStatus;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface CompanyApplicationsResponse {
  data: DevApplicationItem[];
  meta: {
    total: number;
  };
}

export const applicationsApi = {
  getCompanyApplications: async (
    companyId: string,
    params?: CompanyApplicationsQuery,
  ): Promise<CompanyApplicationsResponse> => {
    try {
      return await apiClient.get<CompanyApplicationsResponse>(
        `/companies/${companyId}/applications`,
        {
          params: params as Record<string, string | number | boolean | undefined>,
        },
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getApplications(params);
      }
      throw err;
    }
  },

  getApplicationDetail: async (applicationId: string): Promise<DevApplicationItem> => {
    try {
      return await apiClient.get<DevApplicationItem>(`/applications/${applicationId}`);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getApplicationDetail(applicationId);
      }
      throw err;
    }
  },

  getApplicationHistory: async (applicationId: string): Promise<CandidateHistoryDto[]> => {
    try {
      return await apiClient.get<CandidateHistoryDto[]>(`/applications/${applicationId}/history`);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getApplicationHistory(applicationId);
      }
      throw err;
    }
  },

  reviewApplication: async (
    applicationId: string,
    payload: ReviewApplicationRequest,
  ): Promise<CandidateApplicationDto> => {
    try {
      return await apiClient.patch<CandidateApplicationDto>(
        `/applications/${applicationId}/review`,
        payload,
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.reviewApplication(applicationId, payload);
      }
      throw err;
    }
  },

  reviewCvChange: async (
    applicationId: string,
    payload: ReviewCvChangeRequest,
  ): Promise<CandidateApplicationDto> => {
    try {
      return await apiClient.post<CandidateApplicationDto>(
        `/applications/${applicationId}/cv-change/review`,
        payload,
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.reviewCvChange(applicationId, payload);
      }
      throw err;
    }
  },

  publishResult: async (
    applicationId: string,
    payload: PublishResultRequest,
  ): Promise<CandidateApplicationDto> => {
    try {
      return await apiClient.post<CandidateApplicationDto>(
        `/applications/${applicationId}/publish-result`,
        payload,
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.publishResult(applicationId, payload);
      }
      throw err;
    }
  },
};
