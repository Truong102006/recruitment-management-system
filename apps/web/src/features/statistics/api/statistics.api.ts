import { apiClient } from '../../../lib/http/api-client';
import {
  isDevBrowser,
  devMockStore,
  type RecruitmentFunnelDto,
} from '../../../lib/mocks/dev-mock-store';

export const statisticsApi = {
  getRecruitmentFunnel: async (
    companyId: string,
    periodDays: number = 30,
  ): Promise<RecruitmentFunnelDto> => {
    try {
      return await apiClient.get<RecruitmentFunnelDto>(
        `/companies/${companyId}/statistics/funnel`,
        {
          params: { periodDays },
        },
      );
    } catch (err) {
      if (isDevBrowser()) {
        return devMockStore.getStatistics(companyId, periodDays);
      }
      throw err;
    }
  },
};
