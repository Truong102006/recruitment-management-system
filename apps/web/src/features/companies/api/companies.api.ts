import { apiClient } from '../../../lib/http/api-client';
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
    return apiClient.get<CompanyDto>(`/companies/${companyId}`);
  },

  updateCompany: async (companyId: string, payload: UpdateCompanyRequest): Promise<CompanyDto> => {
    return apiClient.patch<CompanyDto>(`/companies/${companyId}`, payload);
  },

  getCompanyMembers: async (companyId: string): Promise<CompanyMemberDto[]> => {
    return apiClient.get<CompanyMemberDto[]>(`/companies/${companyId}/members`);
  },

  addCompanyMember: async (
    companyId: string,
    payload: AddMemberRequest,
  ): Promise<CompanyMemberDto> => {
    return apiClient.post<CompanyMemberDto>(`/companies/${companyId}/members`, payload);
  },

  updateCompanyMember: async (
    companyId: string,
    userId: string,
    payload: UpdateMemberRequest,
  ): Promise<CompanyMemberDto> => {
    return apiClient.patch<CompanyMemberDto>(`/companies/${companyId}/members/${userId}`, payload);
  },

  transferOwner: async (
    companyId: string,
    payload: TransferOwnerRequest,
  ): Promise<{ success: true }> => {
    return apiClient.post<{ success: true }>(`/companies/${companyId}/transfer-owner`, payload);
  },
};
