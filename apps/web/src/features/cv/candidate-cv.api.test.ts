import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient, ApiException } from '../../lib/http/api-client';
import { listCandidateCvs, uploadCandidateCv, deleteCandidateCv } from './candidate-cv.api';

afterEach(() => vi.restoreAllMocks());

describe('CV permission failures never become local demo success by default', () => {
  it('propagates unauthenticated CV reads instead of showing invented CVs', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new ApiException(401, { code: 'UNAUTHORIZED' }));
    await expect(listCandidateCvs()).rejects.toMatchObject({ status: 401 });
  });
  it('propagates forbidden uploads instead of claiming SCANNING success', async () => {
    vi.spyOn(apiClient, 'post').mockRejectedValue(new ApiException(403, { code: 'FORBIDDEN' }));
    await expect(
      uploadCandidateCv(new File(['demo'], 'resume.pdf', { type: 'application/pdf' })),
    ).rejects.toMatchObject({ status: 403 });
  });
  it('propagates forbidden deletion instead of deleting only a local mock', async () => {
    vi.spyOn(apiClient, 'delete').mockRejectedValue(new ApiException(403, { code: 'FORBIDDEN' }));
    await expect(deleteCandidateCv('other-candidate-cv')).rejects.toMatchObject({ status: 403 });
  });
});
