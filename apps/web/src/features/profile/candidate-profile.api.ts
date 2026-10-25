import { apiClient } from '../../lib/http/api-client';
import type { CandidateProfileDto, UpdateCandidateProfileRequest } from '@rms/contracts/public';

export async function getCandidateProfile(): Promise<CandidateProfileDto> {
  return apiClient.get<CandidateProfileDto>('/api/candidate/profile');
}

export async function updateCandidateProfile(
  payload: UpdateCandidateProfileRequest,
): Promise<CandidateProfileDto> {
  return apiClient.patch<CandidateProfileDto>('/api/candidate/profile', payload);
}
