import { apiClient } from '../../../lib/http/api-client';
import {
  isDevBrowser,
  devMockStore,
  type DevInterviewItem,
} from '../../../lib/mocks/dev-mock-store';

export interface ScheduleInterviewPayload {
  applicationId: string;
  startAt: string;
  durationMinutes: number;
  format: 'ONLINE' | 'IN_PERSON';
  interviewerIds: string[];
  notes?: string;
  location?: string;
}

export interface SubmitEvaluationPayload {
  interviewerId: string;
  technicalScore: number;
  problemSolvingScore: number;
  cultureFitScore: number;
  recommendation: 'HIRE' | 'HOLD' | 'REJECT';
  note: string;
}

export const interviewsApi = {
  getInterviews: async (params?: {
    companyId?: string;
    from?: string;
    to?: string;
  }): Promise<DevInterviewItem[]> => {
    try {
      return await apiClient.get<DevInterviewItem[]>('/interviews', {
        params: params as Record<string, string | number | boolean | undefined>,
      });
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getInterviews();
      }
      throw err;
    }
  },

  getInterviewDetail: async (id: string): Promise<DevInterviewItem> => {
    try {
      return await apiClient.get<DevInterviewItem>(`/interviews/${id}`);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getInterviewDetail(id);
      }
      throw err;
    }
  },

  scheduleInterview: async (payload: ScheduleInterviewPayload): Promise<DevInterviewItem> => {
    try {
      return await apiClient.post<DevInterviewItem>('/interviews', payload);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.scheduleInterview(payload);
      }
      throw err;
    }
  },

  submitEvaluation: async (
    interviewId: string,
    payload: SubmitEvaluationPayload,
  ): Promise<{ success: true }> => {
    try {
      return await apiClient.post<{ success: true }>(
        `/interviews/${interviewId}/evaluation`,
        payload,
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.submitEvaluation(interviewId, payload);
      }
      throw err;
    }
  },
};
