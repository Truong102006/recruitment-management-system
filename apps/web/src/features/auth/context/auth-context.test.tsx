import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuthContext } from './auth-context';
import { apiClient } from '../../../lib/http/api-client';
import type { SessionDto } from '@rms/contracts/public';

const mockSession: SessionDto = {
  userId: 'usr-123',
  email: 'recruiter@company.com',
  fullName: 'John Doe',
  roles: ['RECRUITER'],
  status: 'ACTIVE',
  csrfToken: 'csrf-secret-xyz',
};

const TestConsumer: React.FC = () => {
  const { session, isAuthenticated, hasRole, logout } = useAuthContext();
  return (
    <div>
      <span data-testid="auth-status">{isAuthenticated ? 'logged-in' : 'anonymous'}</span>
      <span data-testid="user-name">{session?.fullName}</span>
      <span data-testid="has-recruiter">{hasRole('RECRUITER') ? 'yes' : 'no'}</span>
      <span data-testid="has-admin">{hasRole('ADMIN') ? 'yes' : 'no'}</span>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    apiClient.setCsrfToken(null);
  });

  it('throws error when used outside AuthProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useAuthContext must be used within an AuthProvider',
    );
    spy.mockRestore();
  });

  it('provides initial session and checks user roles', () => {
    render(
      <AuthProvider initialSession={mockSession}>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('auth-status').textContent).toBe('logged-in');
    expect(screen.getByTestId('user-name').textContent).toBe('John Doe');
    expect(screen.getByTestId('has-recruiter').textContent).toBe('yes');
    expect(screen.getByTestId('has-admin').textContent).toBe('no');
    expect(apiClient.getCsrfToken()).toBe('csrf-secret-xyz');
  });

  it('handles logout and clears CSRF token', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    render(
      <AuthProvider initialSession={mockSession}>
        <TestConsumer />
      </AuthProvider>,
    );

    await act(async () => {
      screen.getByText('Logout').click();
    });

    expect(postSpy).toHaveBeenCalledWith('/api/auth/logout');
    expect(screen.getByTestId('auth-status').textContent).toBe('anonymous');
    expect(apiClient.getCsrfToken()).toBeNull();
  });
});
