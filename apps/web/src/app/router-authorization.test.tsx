import React from 'react';
import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation, useRoutes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { SessionDto, UserRole } from '@rms/contracts/public';
import { AuthProvider } from '../features/auth/context/auth-context';
import { CompanyProvider } from '../features/companies/context/company-context';
import { routes } from './router';

function RouteProbe() {
  const location = useLocation();
  const content = useRoutes(routes);
  return (
    <>
      <output data-testid="current-route">{location.pathname + location.search}</output>
      {content}
    </>
  );
}

function openRoute(path: string, roles: UserRole[] | null) {
  const session: SessionDto | null = roles
    ? {
        userId: 'role-test',
        email: 'role@example.test',
        fullName: 'Role Test',
        roles,
        status: 'ACTIVE',
        csrfToken: 'csrf-test',
      }
    : null;
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <AuthProvider initialSession={session} skipAutoFetch>
        <CompanyProvider initialMemberships={[]}>
          <MemoryRouter initialEntries={[path]}>
            <RouteProbe />
          </MemoryRouter>
        </CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>,
  );
  return () => new URL(screen.getByTestId('current-route').textContent!, 'http://localhost');
}

describe('Actual application router authorization', () => {
  it.each(['/admin/users', '/recruiter/jobs', '/interviews', '/interviews/iv-1/room'])(
    'redirects guests from %s to login',
    async (path) => {
      const location = openRoute(path, null);
      await waitFor(() => expect(location().pathname).toBe('/login'));
      expect(location().searchParams.get('returnTo')).toBe(path);
    },
  );

  it.each([
    ['/admin/users', ['CANDIDATE']],
    ['/admin/users', ['RECRUITER']],
    ['/recruiter/jobs', ['CANDIDATE']],
    ['/recruiter/jobs', ['INTERVIEWER']],
    ['/recruiter/jobs', ['ADMIN']],
    ['/interviews/iv-1/evaluation', ['RECRUITER']],
    ['/interviews/iv-1/evaluation', ['CANDIDATE']],
  ] satisfies [string, UserRole[]][])('rejects %s for roles %j', async (path, roles) => {
    const location = openRoute(path, roles);
    await waitFor(() => expect(location().pathname).toBe('/403'));
  });
});
