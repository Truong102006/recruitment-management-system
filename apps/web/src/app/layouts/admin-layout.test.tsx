import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { AdminLayout } from './admin-layout';
import { AuthProvider } from '../../features/auth/context/auth-context';
import type { SessionDto } from '@rms/contracts/public';

const mockAdminSession: SessionDto = {
  userId: 'usr-admin',
  email: 'admin@system.com',
  fullName: 'Super Admin',
  roles: ['ADMIN'],
  status: 'ACTIVE',
  csrfToken: 'csrf-admin',
};

describe('AdminLayout', () => {
  it('renders admin sidebar links and user info', () => {
    render(
      <AuthProvider initialSession={mockAdminSession}>
        <MemoryRouter initialEntries={['/admin/companies']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route
                path="companies"
                element={<div data-testid="admin-child">Companies Content</div>}
              />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByText('ADMIN')).toBeInTheDocument();
    expect(screen.getByText('Duyệt doanh nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Quản trị tài khoản')).toBeInTheDocument();
    expect(screen.getByText('Kiểm duyệt tin')).toBeInTheDocument();
    expect(screen.getByText('Nhật ký Audit')).toBeInTheDocument();
    expect(screen.getByText('Sự kiện Outbox lỗi')).toBeInTheDocument();
    expect(screen.getByText('Super Admin')).toBeInTheDocument();
    expect(screen.getByTestId('admin-child')).toBeInTheDocument();
  });

  it('triggers logout from admin layout', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AuthProvider initialSession={mockAdminSession}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<div>Admin Index</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    const logoutBtn = screen.getByText('Đăng xuất');
    await act(async () => {
      logoutBtn.click();
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
