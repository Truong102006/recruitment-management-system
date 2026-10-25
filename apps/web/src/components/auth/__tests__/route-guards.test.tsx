import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthContext, type AuthContextValue } from '../../../features/auth/context/auth-context';
import type { SessionDto, UserRole } from '@rms/contracts/public';
import { ProtectedRoute } from '../protected-route';
import { PublicOnlyRoute } from '../public-only-route';

function createMockAuthContext(overrides?: Partial<AuthContextValue>): AuthContextValue {
  return {
    session: null,
    isAuthenticated: false,
    isLoading: false,
    hasRole: () => false,
    refreshSession: async () => null,
    logout: async () => {},
    ...overrides,
  };
}

describe('Route Guards', () => {
  describe('ProtectedRoute', () => {
    it('hiển thị thông báo loading khi phiên đang được tải', () => {
      const mockAuth = createMockAuthContext({ isLoading: true });
      render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/candidate/profile']}>
            <Routes>
              <Route element={<ProtectedRoute />}>
                <Route path="/candidate/profile" element={<div>Trang hồ sơ</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByRole('status')).toHaveTextContent('Đang kiểm tra quyền truy cập...');
      expect(screen.queryByText('Trang hồ sơ')).not.toBeInTheDocument();
    });

    it('chuyển hướng người dùng chưa đăng nhập về /login với tham số returnTo an toàn', () => {
      const mockAuth = createMockAuthContext({ session: null, isAuthenticated: false });
      render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/candidate/profile?tab=skills']}>
            <Routes>
              <Route path="/login" element={<div>Trang đăng nhập</div>} />
              <Route element={<ProtectedRoute />}>
                <Route path="/candidate/profile" element={<div>Trang hồ sơ</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Trang đăng nhập')).toBeInTheDocument();
      expect(screen.queryByText('Trang hồ sơ')).not.toBeInTheDocument();
    });

    it('chuyển hướng về /403 nếu người dùng đăng nhập thiếu vai trò yêu cầu', () => {
      const candidateSession: SessionDto = {
        userId: 'user-1',
        email: 'candidate@example.com',
        fullName: 'Nguyễn Văn A',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
        csrfToken: 'csrf-1',
      };
      const mockAuth = createMockAuthContext({
        isAuthenticated: true,
        session: candidateSession,
        hasRole: (role: UserRole) => candidateSession.roles.includes(role),
      });

      render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/recruiter/jobs']}>
            <Routes>
              <Route path="/403" element={<div>Trang bị từ chối 403</div>} />
              <Route element={<ProtectedRoute requiredRoles={['RECRUITER']} />}>
                <Route path="/recruiter/jobs" element={<div>Quản lý tin tuyển dụng</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Trang bị từ chối 403')).toBeInTheDocument();
      expect(screen.queryByText('Quản lý tin tuyển dụng')).not.toBeInTheDocument();
    });

    it('cho phép truy cập khi người dùng đã xác thực và có đủ quyền', () => {
      const candidateSession: SessionDto = {
        userId: 'user-1',
        email: 'candidate@example.com',
        fullName: 'Nguyễn Văn A',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
        csrfToken: 'csrf-1',
      };
      const mockAuth = createMockAuthContext({
        isAuthenticated: true,
        session: candidateSession,
        hasRole: (role: UserRole) => candidateSession.roles.includes(role),
      });

      render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/candidate/profile']}>
            <Routes>
              <Route element={<ProtectedRoute requiredRoles={['CANDIDATE']} />}>
                <Route path="/candidate/profile" element={<div>Nội dung hồ sơ ứng viên</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Nội dung hồ sơ ứng viên')).toBeInTheDocument();
    });
  });

  describe('PublicOnlyRoute', () => {
    it('cho phép khách truy cập trang login/register', () => {
      const mockAuth = createMockAuthContext({ session: null, isAuthenticated: false });
      render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route element={<PublicOnlyRoute />}>
                <Route path="/login" element={<div>Form đăng nhập</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Form đăng nhập')).toBeInTheDocument();
    });

    it('chuyển hướng người dùng đã đăng nhập khỏi trang login/register', () => {
      const candidateSession: SessionDto = {
        userId: 'user-1',
        email: 'candidate@example.com',
        fullName: 'Nguyễn Văn A',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
        csrfToken: 'csrf-1',
      };
      const mockAuth = createMockAuthContext({
        isAuthenticated: true,
        session: candidateSession,
      });

      render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/login']}>
            <Routes>
              <Route path="/jobs" element={<div>Trang tìm việc</div>} />
              <Route element={<PublicOnlyRoute redirectTo="/jobs" />}>
                <Route path="/login" element={<div>Form đăng nhập</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Trang tìm việc')).toBeInTheDocument();
      expect(screen.queryByText('Form đăng nhập')).not.toBeInTheDocument();
    });

    it('chuyển hướng người dùng đã đăng nhập về đường dẫn returnTo nội bộ hợp lệ và chặn open-redirect', () => {
      const candidateSession: SessionDto = {
        userId: 'user-1',
        email: 'candidate@example.com',
        fullName: 'Nguyễn Văn A',
        roles: ['CANDIDATE'],
        status: 'ACTIVE',
        csrfToken: 'csrf-1',
      };
      const mockAuth = createMockAuthContext({
        isAuthenticated: true,
        session: candidateSession,
      });

      const { unmount } = render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/login?returnTo=%2Fjobs%2Fjob-1']}>
            <Routes>
              <Route path="/jobs" element={<div>Trang tìm việc</div>} />
              <Route path="/jobs/job-1" element={<div>Chi tiết việc làm 1</div>} />
              <Route element={<PublicOnlyRoute redirectTo="/jobs" />}>
                <Route path="/login" element={<div>Form đăng nhập</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Chi tiết việc làm 1')).toBeInTheDocument();
      unmount();

      render(
        <AuthContext.Provider value={mockAuth}>
          <MemoryRouter initialEntries={['/login?returnTo=%2F%2Fevil.com']}>
            <Routes>
              <Route path="/jobs" element={<div>Trang tìm việc an toàn</div>} />
              <Route element={<PublicOnlyRoute redirectTo="/jobs" />}>
                <Route path="/login" element={<div>Form đăng nhập</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthContext.Provider>,
      );

      expect(screen.getByText('Trang tìm việc an toàn')).toBeInTheDocument();
    });
  });
});
