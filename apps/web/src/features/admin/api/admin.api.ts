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
  AdminJobListItemDto,
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

async function readAdminPage<T>(endpoint: string, params?: AdminListParams) {
  const page = await apiClient.get<{ items: T[]; total: number; page: number; limit: number }>(
    endpoint,
    {
      params: params as Record<string, string | number | boolean | undefined>,
    },
  );
  return { data: page.items, meta: { total: page.total } };
}

type AdminUserRecord = Pick<AdminUserDto, 'email' | 'fullName' | 'status' | 'version'> & {
  id: string;
  roles: { role: string }[];
};

export const adminApi = {
  // Companies Management (UI26)
  getCompanies: async (
    params?: AdminListParams,
  ): Promise<{ data: CompanyDto[]; meta: { total: number } }> => {
    try {
      return await readAdminPage<CompanyDto>('/admin/companies', params);
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
      const page = await readAdminPage<AdminUserRecord>('/admin/users', params);
      return {
        ...page,
        data: page.data.map((user) => ({
          userId: user.id,
          email: user.email,
          fullName: user.fullName,
          status: user.status,
          version: user.version,
          role:
            ['ADMIN', 'RECRUITER', 'INTERVIEWER', 'CANDIDATE'].find((role) =>
              user.roles.some((r) => r.role === role),
            ) ?? '',
        })),
      };
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
  ): Promise<{ data: AdminJobListItemDto[]; meta: { total: number } }> => {
    try {
      return await readAdminPage<AdminJobListItemDto>('/admin/jobs', params);
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
