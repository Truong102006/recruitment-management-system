import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PublicLayout } from './public-layout';
import { AuthProvider } from '../../features/auth/context/auth-context';
import { CompanyProvider, type CompanyMembershipInfo } from '../../features/companies/context/company-context';
import type { SessionDto, CompanyDto } from '@rms/contracts/public';

const mockCompany: CompanyDto = {
  id: 'cmp-test-1',
  name: 'Acme Test Corp',
  taxCode: 'TAX-TEST-001',
  address: '123 Test St',
  website: 'https://test.com',
  description: 'Testing company',
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  version: 1,
};

const candidateSession: SessionDto = {
  userId: 'usr-candidate',
  email: 'candidate@example.com',
  fullName: 'Nguyễn Ứng Viên',
  roles: ['CANDIDATE'],
  status: 'ACTIVE',
  csrfToken: 'csrf-cand',
};

const recruiterSession: SessionDto = {
  userId: 'usr-recruiter',
  email: 'recruiter@example.com',
  fullName: 'Trần Tuyển Dụng',
  roles: ['RECRUITER'],
  status: 'ACTIVE',
  csrfToken: 'csrf-rec',
};

function renderWithProviders(
  session: SessionDto | null = null,
  memberships: CompanyMembershipInfo[] = [],
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialSession={session} skipAutoFetch>
        <CompanyProvider initialMemberships={memberships}>
          <MemoryRouter initialEntries={['/']}>
            <Routes>
              <Route element={<PublicLayout />}>
                <Route path="/" element={<div data-testid="public-child">Home</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('PublicLayout Header Navigation Role-Based Display', () => {
  it('hides "Nhà tuyển dụng" tab for unauthenticated guests', () => {
    renderWithProviders(null);

    expect(screen.getByText('Tìm việc làm')).toBeInTheDocument();
    expect(screen.getByText('Công cụ')).toBeInTheDocument();
    expect(screen.getByText('Cẩm nang nghề nghiệp')).toBeInTheDocument();
    expect(screen.queryByText('Tính năng')).not.toBeInTheDocument();
    expect(screen.queryByText('Giải pháp')).not.toBeInTheDocument();

    // Tab "Nhà tuyển dụng" in header navigation must NOT be shown
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    expect(nav).not.toHaveTextContent('Nhà tuyển dụng');

    // Guest actions
    expect(screen.getByText('Đăng nhập')).toBeInTheDocument();
    expect(screen.getByText('Đăng ký')).toBeInTheDocument();
  });

  it('hides "Nhà tuyển dụng" tab for logged-in CANDIDATE account', () => {
    renderWithProviders(candidateSession);

    // Common nav items exist
    expect(screen.getByText('Tìm việc làm')).toBeInTheDocument();

    // Tab "Nhà tuyển dụng" in header navigation must NOT be shown
    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    expect(nav).not.toHaveTextContent('Nhà tuyển dụng');

    // Candidate area link is shown
    expect(screen.getByText('Khu vực ứng viên')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Ứng Viên')).toBeInTheDocument();
    expect(screen.getByText('Đăng xuất')).toBeInTheDocument();
  });

  it('shows "Nhà tuyển dụng" tab for user with global RECRUITER role', () => {
    renderWithProviders(recruiterSession);

    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    expect(nav).toHaveTextContent('Nhà tuyển dụng');

    const recruiterLink = screen.getByRole('link', { name: 'Nhà tuyển dụng' });
    expect(recruiterLink).toHaveAttribute('href', '/recruiter/jobs');
  });

  it('shows "Nhà tuyển dụng" tab for user with company OWNER membership', () => {
    const ownerCandidateSession: SessionDto = {
      userId: 'usr-owner',
      email: 'owner@example.com',
      fullName: 'Phạm Chủ Doanh Nghiệp',
      roles: ['CANDIDATE'],
      status: 'ACTIVE',
      csrfToken: 'csrf-owner',
    };

    renderWithProviders(ownerCandidateSession, [
      { company: mockCompany, role: 'OWNER' },
    ]);

    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    expect(nav).toHaveTextContent('Nhà tuyển dụng');

    const recruiterLink = screen.getByRole('link', { name: 'Nhà tuyển dụng' });
    expect(recruiterLink).toHaveAttribute('href', '/recruiter/jobs');
  });

  it('shows "Nhà tuyển dụng" tab for user with company RECRUITER membership', () => {
    const memberRecruiterSession: SessionDto = {
      userId: 'usr-member-rec',
      email: 'member@example.com',
      fullName: 'Hoàng Thành Viên',
      roles: ['CANDIDATE'],
      status: 'ACTIVE',
      csrfToken: 'csrf-mem',
    };

    renderWithProviders(memberRecruiterSession, [
      { company: mockCompany, role: 'RECRUITER' },
    ]);

    const nav = screen.getByRole('navigation', { name: 'Điều hướng chính' });
    expect(nav).toHaveTextContent('Nhà tuyển dụng');
  });

  it('renders Tools dropdown menu with 3 items when clicked', () => {
    renderWithProviders(null);

    const toolsBtn = screen.getByRole('button', { name: /Công cụ/i });
    expect(toolsBtn).toBeInTheDocument();

    // Menu closed initially
    expect(screen.queryByText('Bộ câu hỏi phỏng vấn')).not.toBeInTheDocument();

    // Open menu
    fireEvent.click(toolsBtn);

    expect(screen.getByText('Bộ câu hỏi phỏng vấn')).toBeInTheDocument();
    expect(screen.getByText('Mới')).toBeInTheDocument();
    expect(screen.getByText('Trắc nghiệm MBTI')).toBeInTheDocument();
    expect(screen.getByText('Talento Skills')).toBeInTheDocument();
  });

  it('renders Career Handbook dropdown menu with categories and featured articles when clicked', () => {
    renderWithProviders(null);

    const careerBtn = screen.getByRole('button', { name: /Cẩm nang nghề nghiệp/i });
    expect(careerBtn).toBeInTheDocument();

    // Open menu
    fireEvent.click(careerBtn);

    expect(screen.getByText('Định hướng nghề nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Bí kíp tìm việc')).toBeInTheDocument();
    expect(screen.getByText('Chế độ lương thưởng')).toBeInTheDocument();
    expect(screen.getByText('Kiến thức chuyên ngành')).toBeInTheDocument();
    expect(screen.getByText('Hành trang nghề nghiệp')).toBeInTheDocument();
    expect(screen.getByText('Thị trường & xu hướng tuyển dụng')).toBeInTheDocument();
    expect(screen.getByText('Bài viết nổi bật')).toBeInTheDocument();
    expect(screen.getByText('Xem thêm bài viết nổi bật →')).toBeInTheDocument();
  });
});
