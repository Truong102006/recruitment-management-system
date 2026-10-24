import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { apiClient, ApiException } from './api-client';

describe('ApiClient', () => {
  beforeEach(() => {
    apiClient.setCsrfToken(null);
    apiClient.setBaseUrl('');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('performs GET request with params and parses JSON response', async () => {
    const mockData = { id: '123', name: 'Acme Corp' };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(mockData),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.get('/api/companies', { params: { active: true, page: 1 } });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/companies?active=true&page=1',
      expect.objectContaining({
        method: 'GET',
        credentials: 'include',
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
    expect(result).toEqual(mockData);
  });

  it('attaches CSRF token and Idempotency-Key on mutating POST request', async () => {
    apiClient.setCsrfToken('test-csrf-token');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.post('/api/jobs', { title: 'Engineer' }, { idempotencyKey: 'idemp-123' });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/jobs',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-CSRF-Token': 'test-csrf-token',
          'Idempotency-Key': 'idemp-123',
        }),
        body: JSON.stringify({ title: 'Engineer' }),
      }),
    );
  });

  it('throws ApiException with error envelope on 400 Bad Request', async () => {
    const errorPayload = {
      code: 'VALIDATION_FAILED',
      message: 'Title is too short',
      fieldErrors: { title: ['Min length is 10'] },
      traceId: 'trace-abc-123',
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve(errorPayload),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(apiClient.post('/api/jobs', {})).rejects.toThrow(ApiException);

    try {
      await apiClient.post('/api/jobs', {});
    } catch (err) {
      const apiErr = err as ApiException;
      expect(apiErr.status).toBe(400);
      expect(apiErr.code).toBe('VALIDATION_FAILED');
      expect(apiErr.message).toBe('Title is too short');
      expect(apiErr.fieldErrors).toEqual({ title: ['Min length is 10'] });
      expect(apiErr.traceId).toBe('trace-abc-123');
    }
  });

  it('handles 204 No Content response properly', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      headers: new Headers(),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await apiClient.delete('/api/members/123');
    expect(result).toBeUndefined();
  });

  it('supports PATCH and PUT methods', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ ok: true }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await apiClient.patch('/api/jobs/1', { title: 'New' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/jobs/1',
      expect.objectContaining({ method: 'PATCH' }),
    );

    await apiClient.put('/api/jobs/1', { title: 'Replaced' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/jobs/1',
      expect.objectContaining({ method: 'PUT' }),
    );
  });
});
