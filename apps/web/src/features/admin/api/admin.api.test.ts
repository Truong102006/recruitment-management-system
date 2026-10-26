import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '../../../lib/http/api-client';
import { adminApi } from './admin.api';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('Admin API against backend response contracts', () => {
  it('maps the backend user list to real user IDs and preserves ADMIN in a multi-role account', async () => {
    apiClient.setBaseUrl('');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({
          data: {
            items: [
              {
                id: 'admin-id',
                email: 'admin@example.test',
                fullName: 'Administrator',
                status: 'ACTIVE',
                version: 2,
                roles: [{ role: 'CANDIDATE' }, { role: 'ADMIN' }],
              },
            ],
            total: 1,
            page: 1,
            limit: 20,
          },
        }),
      }),
    );
    const page = await adminApi.getUsers();
    expect(page).toEqual({
      data: [
        {
          userId: 'admin-id',
          email: 'admin@example.test',
          fullName: 'Administrator',
          status: 'ACTIVE',
          version: 2,
          role: 'ADMIN',
        },
      ],
      meta: { total: 1 },
    });
  });

  it.each(['getCompanies', 'getJobs'] as const)(
    'adapts %s from items/total without losing list data',
    async (method) => {
      const items = [{ id: 'resource-id' }];
      vi.stubGlobal(
        'fetch',
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          headers: new Headers({ 'content-type': 'application/json' }),
          json: async () => ({ data: { items, total: 1, page: 1, limit: 20 } }),
        }),
      );
      expect(await adminApi[method]()).toEqual({ data: items, meta: { total: 1 } });
    },
  );
});
