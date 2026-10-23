import { apiClient } from '../../../lib/http/api-client';
import { isDevBrowser, devMockStore } from '../../../lib/mocks/dev-mock-store';
import type {
  CompanyDto,
  UpdateCompanyRequest,
  CompanyMemberDto,
  AddMemberRequest,
  UpdateMemberRequest,
  TransferOwnerRequest,
} from '@rms/contracts/public';

export const companiesApi = {
  getCompany: async (companyId: string): Promise<CompanyDto> => {
    try {
      return await apiClient.get<CompanyDto>(`/companies/${companyId}`);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.getCompany();
      throw err;
    }
  },

  updateCompany: async (companyId: string, payload: UpdateCompanyRequest): Promise<CompanyDto> => {
    try {
      return await apiClient.patch<CompanyDto>(`/companies/${companyId}`, payload);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.updateCompany(payload);
      throw err;
    }
  },

  getCompanyMembers: async (companyId: string): Promise<CompanyMemberDto[]> => {
    try {
      return await apiClient.get<CompanyMemberDto[]>(`/companies/${companyId}/members`);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.getCompanyMembers();
      throw err;
    }
  },

  addCompanyMember: async (
    companyId: string,
    payload: AddMemberRequest,
  ): Promise<CompanyMemberDto> => {
    try {
      return await apiClient.post<CompanyMemberDto>(`/companies/${companyId}/members`, payload);
    } catch (err) {
      if (isDevBrowser()) return devMockStore.addMember(payload);
      throw err;
    }
  },

  updateCompanyMember: async (
    companyId: string,
    userId: string,
    payload: UpdateMemberRequest,
  ): Promise<CompanyMemberDto> => {
    try {
      return await apiClient.patch<CompanyMemberDto>(
        `/companies/${companyId}/members/${userId}`,
        payload,
      );
    } catch (err) {
      if (isDevBrowser()) return devMockStore.updateMember(userId, payload);
      throw err;
    }
  },

  transferOwner: async (
    companyId: string,
    payload: TransferOwnerRequest,
  ): Promise<{ success: true }> => {
    try {
      return await apiClient.post<{ success: true }>(
        `/companies/${companyId}/transfer-owner`,
        payload,
      );
    } catch (err) {
      if (isDevBrowser()) return devMockStore.transferOwner(payload);
      throw err;
    }
  },
};
