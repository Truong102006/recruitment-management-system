import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../features/auth/context/auth-context';
import { CompanyProvider } from '../features/companies/context/company-context';
import { routes } from './router';
import type { SessionDto, CompanyDto } from '@rms/contracts/public';

const mockCompany: CompanyDto = {
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

const mockSession: SessionDto = {
  userId: 'usr-1',
  email: 'test@example.com',
  fullName: 'Test User',
  roles: ['CANDIDATE', 'RECRUITER', 'INTERVIEWER', 'ADMIN'],
  status: 'ACTIVE',
  csrfToken: 'csrf-123',
};

function renderRoute(path: string, customSession: SessionDto | null = mockSession) {
  const queryClient = new QueryClient();
  const testRouter = createMemoryRouter(routes, { initialEntries: [path] });

  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider initialSession={customSession} skipAutoFetch={customSession === null}>
        <CompanyProvider initialMemberships={[{ company: mockCompany, role: 'OWNER' }]}>
          <RouterProvider router={testRouter} />
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
}

describe('Modular Router', () => {
  it('renders home page on root path', () => {
    renderRoute('/');
    expect(screen.getByText('Talento Recruitment Management System')).toBeInTheDocument();
  });

  it('renders 404 page on unknown route', () => {
    renderRoute('/unknown-path-does-not-exist');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Không tìm thấy trang' }),
    ).toBeInTheDocument();
  });

  it('renders public jobs routes properly', () => {
    renderRoute('/jobs');
    expect(screen.getByTestId('job-list-page')).toBeInTheDocument();

    renderRoute('/jobs/job-123');
    expect(screen.getByTestId('job-detail-page')).toBeInTheDocument();
  });

  it('renders public authentication routes for unauthenticated users', () => {
    renderRoute('/login', null);
    expect(screen.getByTestId('login-page')).toBeInTheDocument();

    renderRoute('/register', null);
    expect(screen.getByTestId('register-page')).toBeInTheDocument();

    renderRoute('/verify-email', null);
    expect(screen.getByTestId('verify-email-page')).toBeInTheDocument();

    renderRoute('/forgot-password', null);
    expect(screen.getByTestId('forgot-password-page')).toBeInTheDocument();

    renderRoute('/reset-password?token=abc', null);
    expect(screen.getByTestId('reset-password-page')).toBeInTheDocument();
  });

  it('renders candidate protected routes properly', () => {
    renderRoute('/candidate/applications');
    expect(screen.getByTestId('my-applications-page')).toBeInTheDocument();

    renderRoute('/candidate/applications/app-1');
    expect(screen.getByTestId('application-detail-page')).toBeInTheDocument();

    renderRoute('/candidate/profile');
    expect(screen.getByTestId('profile-page')).toBeInTheDocument();

    renderRoute('/candidate/cvs');
    expect(screen.getByTestId('cv-list-page')).toBeInTheDocument();

    renderRoute('/candidate/saved-jobs');
    expect(screen.getByTestId('saved-jobs-page')).toBeInTheDocument();

    renderRoute('/notifications');
    expect(screen.getByTestId('notifications-page')).toBeInTheDocument();
  });

  it('renders recruiter routes properly', () => {
    renderRoute('/recruiter/jobs');
    expect(screen.getByTestId('ui17-jobs-list')).toBeInTheDocument();

    renderRoute('/recruiter/jobs/new');
    expect(screen.getByTestId('ui18-job-create')).toBeInTheDocument();

    renderRoute('/recruiter/jobs/job-1/edit');
    expect(screen.getByTestId('ui18-job-edit')).toBeInTheDocument();

    renderRoute('/recruiter/company');
    expect(screen.getByTestId('ui16-company')).toBeInTheDocument();

    renderRoute('/recruiter/members');
    expect(screen.getByTestId('ui16-members')).toBeInTheDocument();

    renderRoute('/recruiter/applications');
    expect(screen.getByTestId('ui19-applications-list')).toBeInTheDocument();

    renderRoute('/recruiter/applications/app-1');
    expect(screen.getByTestId('ui20-application-detail')).toBeInTheDocument();

    renderRoute('/recruiter/statistics');
    expect(screen.getByTestId('ui25-statistics')).toBeInTheDocument();
  });

  it('renders interview routes properly', () => {
    renderRoute('/interviews');
    expect(screen.getByTestId('ui13-interviews')).toBeInTheDocument();

    renderRoute('/interviews/iv-1');
    expect(screen.getByTestId('ui14-interview-detail')).toBeInTheDocument();

    renderRoute('/interviews/iv-1/room');
    expect(screen.getByTestId('ui15-interview-room')).toBeInTheDocument();

    renderRoute('/interviews/iv-1/evaluation');
    expect(screen.getByTestId('ui22-interview-evaluation')).toBeInTheDocument();
  });

  it('renders admin routes properly', () => {
    renderRoute('/admin/companies');
    expect(screen.getByTestId('ui26-admin-companies')).toBeInTheDocument();

    renderRoute('/admin/users');
    expect(screen.getByTestId('ui27-admin-users')).toBeInTheDocument();

    renderRoute('/admin/jobs');
    expect(screen.getByTestId('ui27-admin-jobs')).toBeInTheDocument();

    renderRoute('/admin/audit');
    expect(screen.getByTestId('ui28-admin-audit')).toBeInTheDocument();

    renderRoute('/admin/events');
    expect(screen.getByTestId('ui28-admin-events')).toBeInTheDocument();
  });
});
