import { apiClient } from '../../../lib/http/api-client';
import {
  isDevBrowser,
  devMockStore,
  type AdminUserDto,
  type AuditLogItem,
  type OutboxEventItem,
} from '../../../lib/mocks/dev-mock-store';
import type {
  CompanyDto,
  JobDetailDto,
  ReviewCompanyRequest,
  SuspendCompanyRequest,
  UnsuspendCompanyRequest,
  RecoverOwnerRequest,
  EligibleOwnerDto,
  AdminUpdateUserStatusRequest,
  AdminCloseJobRequest,
} from '@rms/contracts/public';

export interface AdminListParams {
  page?: number;
  limit?: number;
  status?: string;
  q?: string;
}

export const adminApi = {
  // Companies Management (UI26)
  getCompanies: async (
    params?: AdminListParams,
  ): Promise<{ data: CompanyDto[]; meta: { total: number } }> => {
    try {
      return await apiClient.get<{ data: CompanyDto[]; meta: { total: number } }>(
        '/admin/companies',
        {
          params: params as Record<string, string | number | boolean | undefined>,
        },
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getAdminCompanies(params);
      }
      throw err;
    }
  },

  reviewCompany: async (companyId: string, payload: ReviewCompanyRequest): Promise<CompanyDto> => {
    try {
      return await apiClient.patch<CompanyDto>(`/admin/companies/${companyId}`, payload);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.reviewCompany(companyId, payload);
      }
      throw err;
    }
  },

  suspendCompany: async (
    companyId: string,
    payload: SuspendCompanyRequest,
  ): Promise<CompanyDto> => {
    try {
      return await apiClient.patch<CompanyDto>(`/admin/companies/${companyId}`, payload);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.suspendCompany(companyId, payload);
      }
      throw err;
    }
  },

  unsuspendCompany: async (
    companyId: string,
    payload: UnsuspendCompanyRequest,
  ): Promise<CompanyDto> => {
    try {
      return await apiClient.patch<CompanyDto>(`/admin/companies/${companyId}`, payload);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.unsuspendCompany(companyId, payload);
      }
      throw err;
    }
  },

  getEligibleOwners: async (companyId: string): Promise<EligibleOwnerDto[]> => {
    try {
      return await apiClient.get<EligibleOwnerDto[]>(
        `/admin/companies/${companyId}/eligible-owners`,
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getEligibleOwners(companyId);
      }
      throw err;
    }
  },

  recoverOwner: async (companyId: string, payload: RecoverOwnerRequest): Promise<CompanyDto> => {
    try {
      return await apiClient.post<CompanyDto>(
        `/admin/companies/${companyId}/recover-owner`,
        payload,
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.recoverOwner(companyId, payload);
      }
      throw err;
    }
  },

  // Users Management (UI27)
  getUsers: async (
    params?: AdminListParams,
  ): Promise<{ data: AdminUserDto[]; meta: { total: number } }> => {
    try {
      return await apiClient.get<{ data: AdminUserDto[]; meta: { total: number } }>(
        '/admin/users',
        {
          params: params as Record<string, string | number | boolean | undefined>,
        },
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getAdminUsers(params);
      }
      throw err;
    }
  },

  updateUserStatus: async (
    userId: string,
    payload: AdminUpdateUserStatusRequest,
  ): Promise<AdminUserDto> => {
    try {
      return await apiClient.patch<AdminUserDto>(`/admin/users/${userId}`, payload);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.updateUserStatus(userId, payload);
      }
      throw err;
    }
  },

  // Jobs Moderation (UI27)
  getJobs: async (
    params?: AdminListParams,
  ): Promise<{ data: JobDetailDto[]; meta: { total: number } }> => {
    try {
      return await apiClient.get<{ data: JobDetailDto[]; meta: { total: number } }>('/admin/jobs', {
        params: params as Record<string, string | number | boolean | undefined>,
      });
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getAdminJobs(params);
      }
      throw err;
    }
  },

  closeJob: async (jobId: string, payload: AdminCloseJobRequest): Promise<JobDetailDto> => {
    try {
      return await apiClient.post<JobDetailDto>(`/admin/jobs/${jobId}/close`, payload);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.adminCloseJob(jobId, payload);
      }
      throw err;
    }
  },

  // Audit Logs (UI28)
  getAuditLogs: async (params?: {
    entityType?: string;
    q?: string;
  }): Promise<{ data: AuditLogItem[]; meta: { total: number } }> => {
    try {
      return await apiClient.get<{ data: AuditLogItem[]; meta: { total: number } }>(
        '/admin/audit',
        {
          params: params as Record<string, string | number | boolean | undefined>,
        },
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getAuditLogs(params);
      }
      throw err;
    }
  },

  // Outbox Events & Retry (UI28)
  getOutboxEvents: async (params?: {
    status?: string;
  }): Promise<{ data: OutboxEventItem[]; meta: { total: number } }> => {
    try {
      return await apiClient.get<{ data: OutboxEventItem[]; meta: { total: number } }>(
        '/admin/events',
        {
          params: params as Record<string, string | number | boolean | undefined>,
        },
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getOutboxEvents(params);
      }
      throw err;
    }
  },

  retryOutboxEvent: async (eventId: string): Promise<OutboxEventItem> => {
    try {
      return await apiClient.post<OutboxEventItem>(`/admin/events/${eventId}/retry`);
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.retryOutboxEvent(eventId);
      }
      throw err;
    }
  },
};
