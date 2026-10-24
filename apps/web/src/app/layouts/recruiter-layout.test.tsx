import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecruiterLayout } from './recruiter-layout';
import {
  CompanyProvider,
  type CompanyMembershipInfo,
} from '../../features/companies/context/company-context';
import { AuthProvider } from '../../features/auth/context/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { CompanyDto, SessionDto } from '@rms/contracts/public';

const mockCompanyA: CompanyDto = {
  id: 'comp-1',
  name: 'Acme Corp',
  taxCode: '0123456789',
  address: '123 Main St',
  website: null,
  description: null,
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCompanyB: CompanyDto = {
  id: 'comp-2',
  name: 'Beta Tech',
  taxCode: '9876543210',
  address: '456 Market St',
  website: null,
  description: null,
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const memberships: CompanyMembershipInfo[] = [
  { company: mockCompanyA, role: 'OWNER' },
  { company: mockCompanyB, role: 'RECRUITER' },
];

const mockSession: SessionDto = {
  userId: 'usr-1',
  email: 'recruiter@acme.com',
  fullName: 'Alice Smith',
  roles: ['RECRUITER'],
  status: 'ACTIVE',
  csrfToken: 'csrf-xyz',
};

describe('RecruiterLayout', () => {
  it('renders sidebar navigation, company selector and user info', async () => {
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialSession={mockSession}>
          <CompanyProvider initialMemberships={memberships}>
            <MemoryRouter initialEntries={['/recruiter/jobs']}>
              <Routes>
                <Route path="/recruiter" element={<RecruiterLayout />}>
                  <Route
                    path="jobs"
                    element={<div data-testid="child-page">Jobs Page Content</div>}
                  />
                </Route>
              </Routes>
            </MemoryRouter>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Talento')).toBeInTheDocument();
    expect(screen.getByText('Tin tuyển dụng')).toBeInTheDocument();
    expect(screen.getByText('Hồ sơ ứng viên')).toBeInTheDocument();
    expect(screen.getByText('Lịch phỏng vấn')).toBeInTheDocument();
    expect(screen.getByText('Thành viên & Công ty')).toBeInTheDocument();
    expect(screen.getByText('Thống kê tuyển dụng')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByTestId('child-page')).toBeInTheDocument();

    // Select different company
    const select = screen.getByRole('combobox');
    await act(async () => {
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });

  it('triggers logout when clicking sign out button', async () => {
    const queryClient = new QueryClient();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({}),
      text: () => Promise.resolve(''),
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialSession={mockSession}>
          <CompanyProvider initialMemberships={memberships}>
            <MemoryRouter initialEntries={['/recruiter']}>
              <Routes>
                <Route path="/recruiter" element={<RecruiterLayout />}>
                  <Route index element={<div>Index</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>,
    );

    const logoutBtn = screen.getByText('Đăng xuất');
    await act(async () => {
      logoutBtn.click();
    });

    expect(fetchMock).toHaveBeenCalled();
  });
});
