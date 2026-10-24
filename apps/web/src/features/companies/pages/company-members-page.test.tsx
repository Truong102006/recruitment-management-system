import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CompanyMembersPage } from './company-members-page';
import { companiesApi } from '../api/companies.api';
import * as CompanyContextModule from '../context/company-context';
import type { CompanyMemberDto, CompanyDto } from '@rms/contracts/public';

vi.mock('../api/companies.api');

const mockCompany: CompanyDto = {
  id: 'c1111111-1111-1111-1111-111111111111',
  name: 'Acme Corp',
  taxCode: 'TAX-123456',
  address: '123 Wall Street',
  website: null,
  description: null,
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockMembers: CompanyMemberDto[] = [
  {
    userId: 'u1111111-1111-1111-1111-111111111111',
    email: 'owner@acme.com',
    fullName: 'Alice Owner',
    role: 'OWNER',
    permissions: ['RECRUITER'],
    active: true,
    version: 1,
    joinedAt: '2026-01-01T00:00:00Z',
  },
  {
    userId: 'u2222222-2222-2222-2222-222222222222',
    email: 'recruiter@acme.com',
    fullName: 'Bob Recruiter',
    role: 'RECRUITER',
    permissions: ['RECRUITER'],
    active: true,
    version: 1,
    joinedAt: '2026-01-02T00:00:00Z',
  },
  {
    userId: 'u3333333-3333-3333-3333-333333333333',
    email: 'interviewer@acme.com',
    fullName: 'Charlie Interviewer',
    role: 'INTERVIEWER',
    permissions: ['INTERVIEWER'],
    active: false,
    version: 1,
    joinedAt: '2026-01-03T00:00:00Z',
  },
];

describe('CompanyMembersPage (UI16)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(CompanyContextModule, 'useCompanyContext').mockReturnValue({
      currentCompanyId: mockCompany.id,
      currentCompany: mockCompany,
      currentRole: 'OWNER',
      memberships: [{ company: mockCompany, role: 'OWNER' }],
      setMemberships: vi.fn(),
      switchCompany: vi.fn(),
    });
  });

  it('renders members list in DataTable', async () => {
    vi.mocked(companiesApi.getCompanyMembers).mockResolvedValue(mockMembers);

    render(<CompanyMembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Owner')).toBeInTheDocument();
      expect(screen.getByText('Bob Recruiter')).toBeInTheDocument();
      expect(screen.getByText('Charlie Interviewer')).toBeInTheDocument();
    });

    expect(screen.getByText('owner@acme.com')).toBeInTheDocument();
    expect(screen.getByText('OWNER')).toBeInTheDocument();
    expect(screen.getByText('RECRUITER')).toBeInTheDocument();
  });

  it('FE26 & BR15: disables deactivating the last active owner and displays error if attempted', async () => {
    vi.mocked(companiesApi.getCompanyMembers).mockResolvedValue(mockMembers);

    render(<CompanyMembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    });

    const ownerToggleBtn = screen.getByTestId(`toggle-status-btn-${mockMembers[0]!.userId}`);

    // Button should be disabled because Alice is the ONLY active owner
    expect(ownerToggleBtn).toBeDisabled();
    expect(ownerToggleBtn).toHaveAttribute(
      'title',
      'Không thể vô hiệu hóa OWNER hoạt động cuối cùng của doanh nghiệp (BR15)',
    );
  });

  it('allows toggling status for non-owner member', async () => {
    vi.mocked(companiesApi.getCompanyMembers).mockResolvedValue(mockMembers);
    vi.mocked(companiesApi.updateCompanyMember).mockResolvedValue({
      ...mockMembers[1]!,
      active: false,
    });

    render(<CompanyMembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Bob Recruiter')).toBeInTheDocument();
    });

    const bobToggleBtn = screen.getByTestId(`toggle-status-btn-${mockMembers[1]!.userId}`);
    expect(bobToggleBtn).not.toBeDisabled();

    fireEvent.click(bobToggleBtn);

    await waitFor(() => {
      expect(companiesApi.updateCompanyMember).toHaveBeenCalledWith(
        mockCompany.id,
        mockMembers[1]!.userId,
        {
          active: false,
          version: 1,
          companyVersion: 1,
        },
      );
    });
  });

  it('opens add member dialog and submits successfully', async () => {
    vi.mocked(companiesApi.getCompanyMembers).mockResolvedValue(mockMembers);
    vi.mocked(companiesApi.addCompanyMember).mockResolvedValue({
      userId: 'u4444444-4444-4444-4444-444444444444',
      email: 'newuser@acme.com',
      fullName: 'New User',
      role: 'INTERVIEWER',
      permissions: ['INTERVIEWER'],
      active: true,
      version: 1,
      joinedAt: '2026-01-04T00:00:00Z',
    });

    render(<CompanyMembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Alice Owner')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('add-member-open-btn'));

    expect(screen.getByTestId('add-member-form')).toBeInTheDocument();

    fireEvent.change(screen.getByTestId('add-member-email-input'), {
      target: { value: 'newuser@acme.com' },
    });
    fireEvent.change(screen.getByTestId('add-member-role-select'), {
      target: { value: 'INTERVIEWER' },
    });

    fireEvent.click(screen.getByTestId('submit-add-member-btn'));

    await waitFor(() => {
      expect(companiesApi.addCompanyMember).toHaveBeenCalledWith(mockCompany.id, {
        email: 'newuser@acme.com',
        role: 'INTERVIEWER',
        permissions: ['INTERVIEWER'],
      });
    });

    expect(screen.getByTestId('success-alert')).toBeInTheDocument();
  });

  it('opens transfer OWNER modal and confirms transfer (BR15)', async () => {
    vi.mocked(companiesApi.getCompanyMembers).mockResolvedValue(mockMembers);
    vi.mocked(companiesApi.transferOwner).mockResolvedValue({ success: true });

    render(<CompanyMembersPage />);

    await waitFor(() => {
      expect(screen.getByText('Bob Recruiter')).toBeInTheDocument();
    });

    const transferBtn = screen.getByTestId(`transfer-owner-btn-${mockMembers[1]!.userId}`);
    fireEvent.click(transferBtn);

    expect(screen.getByTestId('transfer-owner-dialog-content')).toBeInTheDocument();
    expect(screen.getByText(/Hành động này sẽ chuyển quyền/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-transfer-owner-btn'));

    await waitFor(() => {
      expect(companiesApi.transferOwner).toHaveBeenCalledWith(mockCompany.id, {
        targetUserId: mockMembers[1]!.userId,
        targetMemberVersion: 1,
        companyVersion: 1,
      });
    });

    expect(screen.getByTestId('success-alert')).toBeInTheDocument();
  });
});
