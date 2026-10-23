import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { CompanyDetailPage } from './company-detail-page';
import { companiesApi } from '../api/companies.api';
import { ApiException } from '../../../lib/http/api-client';
import * as CompanyContextModule from '../context/company-context';
import type { CompanyDto } from '@rms/contracts/public';

vi.mock('../api/companies.api');

const mockCompany: CompanyDto = {
  id: 'c1111111-1111-1111-1111-111111111111',
  name: 'Acme Corp',
  taxCode: 'TAX-123456',
  address: '123 Wall Street',
  website: 'https://acme.com',
  description: 'Leading global tech solutions.',
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 2,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

describe('CompanyDetailPage (UI16)', () => {
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

  it('renders loading state initially', () => {
    vi.mocked(companiesApi.getCompany).mockReturnValue(new Promise(() => {}));
    render(<CompanyDetailPage />);
    expect(screen.getByTestId('ui16-company-loading')).toBeInTheDocument();
  });

  it('renders empty state when no company is selected', async () => {
    vi.spyOn(CompanyContextModule, 'useCompanyContext').mockReturnValue({
      currentCompanyId: null,
      currentCompany: null,
      currentRole: null,
      memberships: [],
      setMemberships: vi.fn(),
      switchCompany: vi.fn(),
    });

    render(<CompanyDetailPage />);
    await waitFor(() => {
      expect(screen.getByTestId('ui16-company-empty')).toBeInTheDocument();
    });
  });

  it('loads and populates company information successfully', async () => {
    vi.mocked(companiesApi.getCompany).mockResolvedValue(mockCompany);

    render(<CompanyDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('company-name-input')).toHaveValue('Acme Corp');
    });

    expect(screen.getByTestId('company-tax-code-input')).toHaveValue('TAX-123456');
    expect(screen.getByTestId('company-address-input')).toHaveValue('123 Wall Street');
    expect(screen.getByTestId('company-website-input')).toHaveValue('https://acme.com');
    expect(screen.getByTestId('company-description-input')).toHaveValue(
      'Leading global tech solutions.',
    );
    expect(screen.getByText('Đã duyệt')).toBeInTheDocument();
  });

  it('FE26: displays warning banner when company status is PENDING (BR02)', async () => {
    const pendingCompany: CompanyDto = {
      ...mockCompany,
      approvalStatus: 'PENDING',
    };
    vi.mocked(companiesApi.getCompany).mockResolvedValue(pendingCompany);

    render(<CompanyDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('approval-status-pending-alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Doanh nghiệp hiện đang ở trạng thái/i)).toBeInTheDocument();
  });

  it('displays rejection banner when company status is REJECTED', async () => {
    const rejectedCompany: CompanyDto = {
      ...mockCompany,
      approvalStatus: 'REJECTED',
      rejectionReason: 'Thiếu giấy phép kinh doanh hợp lệ.',
    };
    vi.mocked(companiesApi.getCompany).mockResolvedValue(rejectedCompany);

    render(<CompanyDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('approval-status-rejected-alert')).toBeInTheDocument();
    });
    expect(screen.getByText(/Thiếu giấy phép kinh doanh hợp lệ/i)).toBeInTheDocument();
  });

  it('validates required fields before submitting', async () => {
    vi.mocked(companiesApi.getCompany).mockResolvedValue(mockCompany);

    render(<CompanyDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('company-name-input')).toHaveValue('Acme Corp');
    });

    fireEvent.change(screen.getByTestId('company-name-input'), { target: { value: '   ' } });
    fireEvent.change(screen.getByTestId('company-address-input'), { target: { value: '' } });
    fireEvent.click(screen.getByTestId('save-company-btn'));

    expect(screen.getByTestId('error-name')).toHaveTextContent(
      'Tên doanh nghiệp không được để trống',
    );
    expect(screen.getByTestId('error-address')).toHaveTextContent('Địa chỉ không được để trống');
    expect(companiesApi.updateCompany).not.toHaveBeenCalled();
  });

  it('submits updated company details and shows success alert', async () => {
    vi.mocked(companiesApi.getCompany).mockResolvedValue(mockCompany);
    const updatedCompany: CompanyDto = {
      ...mockCompany,
      name: 'Acme International',
      version: 3,
    };
    vi.mocked(companiesApi.updateCompany).mockResolvedValue(updatedCompany);

    render(<CompanyDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('company-name-input')).toHaveValue('Acme Corp');
    });

    fireEvent.change(screen.getByTestId('company-name-input'), {
      target: { value: 'Acme International' },
    });
    fireEvent.click(screen.getByTestId('save-company-btn'));

    await waitFor(() => {
      expect(companiesApi.updateCompany).toHaveBeenCalledWith(mockCompany.id, {
        name: 'Acme International',
        address: '123 Wall Street',
        website: 'https://acme.com',
        description: 'Leading global tech solutions.',
        version: 2,
      });
    });

    expect(screen.getByTestId('success-alert')).toBeInTheDocument();
  });

  it('FE29 & BR01: handles 409 Conflict by preserving user input and offering reload', async () => {
    vi.mocked(companiesApi.getCompany).mockResolvedValue(mockCompany);
    vi.mocked(companiesApi.updateCompany).mockRejectedValue(
      new ApiException(409, { code: 'VERSION_MISMATCH', message: 'Conflict' }),
    );

    render(<CompanyDetailPage />);

    await waitFor(() => {
      expect(screen.getByTestId('company-name-input')).toHaveValue('Acme Corp');
    });

    fireEvent.change(screen.getByTestId('company-name-input'), {
      target: { value: 'New Name Edited by User' },
    });
    fireEvent.click(screen.getByTestId('save-company-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('conflict-alert')).toBeInTheDocument();
    });

    // Form retains user edited value!
    expect(screen.getByTestId('company-name-input')).toHaveValue('New Name Edited by User');

    // Clicking reload reloads data
    const newerCompany: CompanyDto = {
      ...mockCompany,
      name: 'Name From Server',
      version: 3,
    };
    vi.mocked(companiesApi.getCompany).mockResolvedValue(newerCompany);

    fireEvent.click(screen.getByTestId('reload-latest-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('company-name-input')).toHaveValue('Name From Server');
    });
  });
});
