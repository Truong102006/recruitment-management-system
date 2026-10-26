import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RecruiterLayout } from '../recruiter-layout';
import { CandidateLayout } from '../candidate-layout';
import { AdminLayout } from '../admin-layout';
import { PublicLayout } from '../public-layout';
import { AuthProvider } from '../../../features/auth/context/auth-context';
import { CompanyProvider } from '../../../features/companies/context/company-context';
import type { SessionDto, CompanyDto } from '@rms/contracts/public';

const mockRecruiterSession: SessionDto = {
  userId: 'usr-recruiter',
  email: 'recruiter@company.com',
  fullName: 'Recruiter Bob',
  roles: ['RECRUITER'],
  status: 'ACTIVE',
  csrfToken: 'csrf-token-1',
};

const mockCandidateSession: SessionDto = {
  userId: 'usr-cand',
  email: 'candidate@gmail.com',
  fullName: 'Candidate Alice',
  roles: ['CANDIDATE'],
  status: 'ACTIVE',
  csrfToken: 'csrf-token-2',
};

const mockAdminSession: SessionDto = {
  userId: 'usr-admin',
  email: 'admin@system.com',
  fullName: 'Super Admin',
  roles: ['ADMIN'],
  status: 'ACTIVE',
  csrfToken: 'csrf-token-3',
};

const mockCompany: CompanyDto = {
  id: 'comp-1',
  name: 'Acme Corp',
  taxCode: '0123456789',
  address: '123 Street',
  website: 'https://acme.com',
  description: 'Acme Corp description',
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('Logo and Talento text navigation to home (/)', () => {
  it('RecruiterLayout: logo và chữ Talento liên kết chuyển về trang chủ (/)', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialSession={mockRecruiterSession}>
          <CompanyProvider initialMemberships={[{ role: 'RECRUITER', company: mockCompany }]}>
            <MemoryRouter initialEntries={['/recruiter/jobs']}>
              <Routes>
                <Route path="/recruiter" element={<RecruiterLayout />}>
                  <Route path="jobs" element={<div>Jobs Content</div>} />
                </Route>
              </Routes>
            </MemoryRouter>
          </CompanyProvider>
        </AuthProvider>
      </QueryClientProvider>,
    );

    const logoLink = screen.getByRole('link', { name: /Talento/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('CandidateLayout: logo và chữ Talento liên kết chuyển về trang chủ (/)', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialSession={mockCandidateSession}>
          <MemoryRouter initialEntries={['/candidate/applications']}>
            <Routes>
              <Route path="/candidate" element={<CandidateLayout />}>
                <Route path="applications" element={<div>Applications Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    const logoLink = screen.getByRole('link', { name: /Talento/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('AdminLayout: logo và chữ Talento liên kết chuyển về trang chủ (/)', () => {
    render(
      <AuthProvider initialSession={mockAdminSession}>
        <MemoryRouter initialEntries={['/admin/companies']}>
          <Routes>
            <Route path="/admin" element={<AdminLayout />}>
              <Route path="companies" element={<div>Companies Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    const logoLink = screen.getByRole('link', { name: /Talento/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });

  it('PublicLayout: logo và chữ Talento liên kết chuyển về trang chủ (/)', () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider initialSession={null}>
          <MemoryRouter initialEntries={['/jobs']}>
            <Routes>
              <Route path="/" element={<PublicLayout />}>
                <Route path="jobs" element={<div>Public Jobs Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      </QueryClientProvider>,
    );

    const logoLink = screen.getByRole('link', { name: /Talento/i });
    expect(logoLink).toBeInTheDocument();
    expect(logoLink).toHaveAttribute('href', '/');
  });
});
