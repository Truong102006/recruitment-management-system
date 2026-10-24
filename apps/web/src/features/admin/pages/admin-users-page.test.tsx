import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminUsersPage } from './admin-users-page';
import { adminApi } from '../api/admin.api';
import type { AdminUserDto } from '../../../lib/mocks/dev-mock-store';

vi.mock('../api/admin.api');

const mockUsers: AdminUserDto[] = [
  {
    userId: 'u-admin-root',
    email: 'admin@rms.gov.vn',
    fullName: 'Quản trị viên Hệ thống',
    role: 'ADMIN',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    userId: 'u-recruiter-01',
    email: 'spammer@fakecompany.vn',
    fullName: 'Lừa Đảo Tuyển Dụng',
    role: 'RECRUITER',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-01T00:00:00Z',
  },
  {
    userId: 'u-cand-locked',
    email: 'cheater@cheat.com',
    fullName: 'Ứng viên Gian lận',
    role: 'CANDIDATE',
    status: 'LOCKED',
    version: 2,
    createdAt: '2026-01-15T00:00:00Z',
    updatedAt: '2026-02-05T00:00:00Z',
  },
];

describe('AdminUsersPage (UI27, FE40)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders user list and columns correctly', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue({
      data: mockUsers,
      meta: { total: 3 },
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui27-admin-users')).toBeInTheDocument();
    expect(screen.getByText('admin@rms.gov.vn')).toBeInTheDocument();
    expect(screen.getByText('spammer@fakecompany.vn')).toBeInTheDocument();
    expect(screen.getByText('cheater@cheat.com')).toBeInTheDocument();
  });

  it('locks a normal user with valid reason successfully', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue({
      data: mockUsers,
      meta: { total: 3 },
    });
    vi.mocked(adminApi.updateUserStatus).mockResolvedValue({
      ...mockUsers[1]!,
      status: 'LOCKED',
      version: 2,
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    const lockBtn = await screen.findByTestId('lock-user-btn-u-recruiter-01');
    fireEvent.click(lockBtn);

    // Type reason
    const reasonInput = screen.getByTestId('lock-reason-input');
    fireEvent.change(reasonInput, {
      target: { value: 'Đăng tin tuyển dụng lừa đảo thu phí ứng viên.' },
    });

    fireEvent.click(screen.getByTestId('confirm-lock-btn'));

    await waitFor(() => {
      expect(adminApi.updateUserStatus).toHaveBeenCalledWith('u-recruiter-01', {
        status: 'LOCKED',
        reason: 'Đăng tin tuyển dụng lừa đảo thu phí ứng viên.',
        version: 1,
      });
    });
  });

  it('unlocks a locked user directly', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue({
      data: mockUsers,
      meta: { total: 3 },
    });
    vi.mocked(adminApi.updateUserStatus).mockResolvedValue({
      ...mockUsers[2]!,
      status: 'ACTIVE',
      version: 3,
    });

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    const unlockBtn = await screen.findByTestId('unlock-user-btn-u-cand-locked');
    fireEvent.click(unlockBtn);

    await waitFor(() => {
      expect(adminApi.updateUserStatus).toHaveBeenCalledWith('u-cand-locked', {
        status: 'ACTIVE',
        reason: 'Admin mở khóa tài khoản',
        version: 2,
      });
    });
  });

  it('FE40: prevents locking the last ADMIN account and displays error', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue({
      data: mockUsers,
      meta: { total: 3 },
    });
    vi.mocked(adminApi.updateUserStatus).mockRejectedValue(
      new Error('Không thể khóa tài khoản Quản trị viên (ADMIN) cuối cùng của hệ thống!'),
    );

    render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    const lockAdminBtn = await screen.findByTestId('lock-user-btn-u-admin-root');
    fireEvent.click(lockAdminBtn);

    const reasonInput = screen.getByTestId('lock-reason-input');
    fireEvent.change(reasonInput, {
      target: { value: 'Thử khóa tài khoản admin cuối cùng.' },
    });

    fireEvent.click(screen.getByTestId('confirm-lock-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('lock-error-alert')).toBeInTheDocument();
      expect(
        screen.getByText(
          /Không thể khóa tài khoản Quản trị viên \(ADMIN\) cuối cùng của hệ thống!/i,
        ),
      ).toBeInTheDocument();
    });
  });
});
