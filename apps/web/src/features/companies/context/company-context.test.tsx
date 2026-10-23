import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CompanyProvider, useCompanyContext, type CompanyMembershipInfo } from './company-context';
import type { CompanyDto } from '@rms/contracts/public';

const mockCompanyA: CompanyDto = {
  id: 'comp-aaa',
  name: 'Acme Corp',
  taxCode: '0123456789',
  address: '123 Main St',
  website: 'https://acme.com',
  description: null,
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 1,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCompanyB: CompanyDto = {
  id: 'comp-bbb',
  name: 'Beta Global',
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

const TestConsumer: React.FC = () => {
  const { currentCompanyId, currentCompany, currentRole, switchCompany } = useCompanyContext();
  return (
    <div>
      <span data-testid="company-id">{currentCompanyId}</span>
      <span data-testid="company-name">{currentCompany?.name}</span>
      <span data-testid="company-role">{currentRole}</span>
      <button onClick={() => switchCompany('comp-bbb')}>Switch to B</button>
      <button onClick={() => switchCompany('comp-aaa')}>Switch to A</button>
    </div>
  );
};

describe('CompanyContext', () => {
  it('throws error when used outside CompanyProvider', () => {
    // Suppress console.error in React error boundary test
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<TestConsumer />)).toThrow(
      'useCompanyContext must be used within a CompanyProvider',
    );
    spy.mockRestore();
  });

  it('initializes with first membership and switches company while purging queries', async () => {
    const queryClient = new QueryClient();
    const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');
    const removeSpy = vi.spyOn(queryClient, 'removeQueries');

    render(
      <QueryClientProvider client={queryClient}>
        <CompanyProvider initialMemberships={memberships}>
          <TestConsumer />
        </CompanyProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId('company-id').textContent).toBe('comp-aaa');
    expect(screen.getByTestId('company-name').textContent).toBe('Acme Corp');
    expect(screen.getByTestId('company-role').textContent).toBe('OWNER');

    // Switch company
    await act(async () => {
      screen.getByText('Switch to B').click();
    });

    expect(cancelSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
    expect(screen.getByTestId('company-id').textContent).toBe('comp-bbb');
    expect(screen.getByTestId('company-name').textContent).toBe('Beta Global');
    expect(screen.getByTestId('company-role').textContent).toBe('RECRUITER');

    // Switching to the same company is a no-op
    cancelSpy.mockClear();
    await act(async () => {
      screen.getByText('Switch to B').click();
    });
    expect(cancelSpy).not.toHaveBeenCalled();
  });
});
