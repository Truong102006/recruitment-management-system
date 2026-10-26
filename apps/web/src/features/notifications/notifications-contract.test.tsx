import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { apiClient, ApiException } from '../../lib/http/api-client';
import { NotificationsPage } from './notifications-page';

afterEach(() => vi.restoreAllMocks());

describe('Notifications consume the live API contract without fabricated success', () => {
  it('renders an empty paginated notification response without crashing', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({ data: [], meta: { total: 0, unreadCount: 0 } });
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('Không có thông báo mới')).toBeInTheDocument());
  });
  it('displays API content and keeps a failed read update visible to the user', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [
        {
          id: 'notification-id',
          title: 'Actual notification',
          content: 'API content',
          targetType: 'JOB',
          targetId: 'job-id',
          readAt: null,
          createdAt: new Date().toISOString(),
        },
      ],
      meta: { total: 1, unreadCount: 1 },
    });
    vi.spyOn(apiClient, 'patch').mockRejectedValue(new ApiException(403, { code: 'FORBIDDEN' }));
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByText('API content')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Actual notification'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent('Không thể cập nhật thông báo'),
    );
  });
  it('shows an error when fetching notifications is denied instead of returning demo notifications', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValue(new ApiException(401, { code: 'UNAUTHORIZED' }));
    render(
      <MemoryRouter>
        <NotificationsPage />
      </MemoryRouter>,
    );
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Đã xảy ra lỗi'));
    expect(screen.queryByText('Hồ sơ đã được tiếp nhận')).not.toBeInTheDocument();
  });
});
