import { apiClient } from '../../lib/http/api-client';
import type {
  JobSearchQuery,
  JobSummaryDto,
  JobDetailDto,
  PageResponse,
  SkillDto,
  SavedJobDto,
} from '@rms/contracts/public';

export async function searchPublicJobs(
  query: JobSearchQuery = {},
): Promise<PageResponse<JobSummaryDto>> {
  const params: Record<string, string | number | boolean | undefined> = {
    q: query.q || undefined,
    location: query.location || undefined,
    jobType: query.jobType || undefined,
    workplaceMode: query.workplaceMode || undefined,
    minSalary: query.minSalary !== undefined ? query.minSalary : undefined,
    maxSalary: query.maxSalary !== undefined ? query.maxSalary : undefined,
    page: query.page || 1,
    pageSize: query.pageSize || 10,
    sort: query.sort || 'createdAt',
  };

  return apiClient.get<PageResponse<JobSummaryDto>>('/api/jobs', { params });
}

export async function getPublicJobDetail(id: string): Promise<JobDetailDto> {
  return apiClient.get<JobDetailDto>(`/api/jobs/${encodeURIComponent(id)}`);
}

export async function getActiveSkills(): Promise<SkillDto[]> {
  return apiClient.get<SkillDto[]>('/api/skills');
}

export async function saveJob(jobId: string): Promise<void> {
  return apiClient.put<void>(`/api/saved-jobs/${encodeURIComponent(jobId)}`);
}

export async function unsaveJob(jobId: string): Promise<void> {
  return apiClient.delete<void>(`/api/saved-jobs/${encodeURIComponent(jobId)}`);
}

export async function getSavedJobs(
  page: number = 1,
  pageSize: number = 50,
): Promise<PageResponse<SavedJobDto>> {
  return apiClient.get<PageResponse<SavedJobDto>>('/api/saved-jobs', {
    params: { page, pageSize },
  });
}
