import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminCompaniesPage } from './admin-companies-page';
import { adminApi } from '../api/admin.api';
import type { CompanyDto, EligibleOwnerDto } from '@rms/contracts/public';

vi.mock('../api/admin.api');

const mockCompanies: CompanyDto[] = [
  {
    id: 'comp-001',
    name: 'Công ty Cổ phần Công nghệ Talento',
    taxCode: '0101234567',
    address: 'Tầng 8, Tòa nhà Landmark 81, TP. HCM',
    website: 'https://talento.vn',
    description: 'Doanh nghiệp công nghệ phát triển giải pháp AI và nhân sự',
    approvalStatus: 'PENDING',
    rejectionReason: null,
    version: 1,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-01-10T08:00:00Z',
  },
  {
    id: 'comp-002',
    name: 'Tập đoàn Bán lẻ VinNext',
    taxCode: '0309876543',
    address: '456 Hai Bà Trưng, Quận 1, TP. HCM',
    website: 'https://vinnext.com',
    description: 'Chuỗi siêu thị và bán lẻ đa kênh hàng đầu',
    approvalStatus: 'APPROVED',
    rejectionReason: null,
    version: 2,
    createdAt: '2025-11-20T00:00:00Z',
    updatedAt: '2025-12-01T00:00:00Z',
  },
  {
    id: 'comp-003',
    name: 'Công ty TNHH Quảng cáo Rác SPAM',
    taxCode: '0405556667',
    address: '12 Đường Lạ, Hà Nội',
    website: null,
    description: 'Tài khoản đăng tin spam',
    approvalStatus: 'SUSPENDED',
    rejectionReason: 'Vi phạm chính sách đăng tin',
    version: 3,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-02-05T00:00:00Z',
  },
];

const mockEligibleOwners: EligibleOwnerDto[] = [
  {
    userId: 'u-eligible-1',
    fullName: 'Trần Văn Quyền',
    email: 'quyen.tran@talento.vn',
    role: 'RECRUITER',
    active: true,
    version: 1,
  },
];

describe('AdminCompaniesPage (UI26, FE39, UC10)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders company list and headers properly', async () => {
    vi.mocked(adminApi.getCompanies).mockResolvedValue({
      data: mockCompanies,
      meta: { total: 3 },
    });

    render(
      <MemoryRouter>
        <AdminCompaniesPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui26-admin-companies')).toBeInTheDocument();
    expect(screen.getByText('Công ty Cổ phần Công nghệ Talento')).toBeInTheDocument();
    expect(screen.getByText('Tập đoàn Bán lẻ VinNext')).toBeInTheDocument();
  });

  it('approves a pending company successfully', async () => {
    vi.mocked(adminApi.getCompanies).mockResolvedValue({
      data: mockCompanies,
      meta: { total: 3 },
    });
    vi.mocked(adminApi.reviewCompany).mockResolvedValue({
      ...mockCompanies[0]!,
      approvalStatus: 'APPROVED',
      version: 2,
    });

    render(
      <MemoryRouter>
        <AdminCompaniesPage />
      </MemoryRouter>,
    );

    const approveBtn = await screen.findByTestId('approve-company-btn-comp-001');
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(adminApi.reviewCompany).toHaveBeenCalledWith('comp-001', {
        status: 'APPROVED',
        version: 1,
      });
    });
  });

  it('FE39: validates rejection reason requirement (blocks empty reason and shows error)', async () => {
    vi.mocked(adminApi.getCompanies).mockResolvedValue({
      data: mockCompanies,
      meta: { total: 3 },
    });

    render(
      <MemoryRouter>
        <AdminCompaniesPage />
      </MemoryRouter>,
    );

    const rejectBtn = await screen.findByTestId('reject-company-btn-comp-001');
    fireEvent.click(rejectBtn);

    // Dialog opens
    expect(screen.getByTestId('reject-reason-input')).toBeInTheDocument();

    // Try submit with empty reason
    fireEvent.click(screen.getByTestId('confirm-reject-btn'));

    expect(screen.getByTestId('reject-error-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Vui lòng nhập lý do từ chối phê duyệt doanh nghiệp \(FE39\)/i),
    ).toBeInTheDocument();
    expect(adminApi.reviewCompany).not.toHaveBeenCalled();

    // Type valid reason
    fireEvent.change(screen.getByTestId('reject-reason-input'), {
      target: { value: 'Mã số thuế không hợp lệ hoặc đã hết hiệu lực.' },
    });
    fireEvent.click(screen.getByTestId('confirm-reject-btn'));

    await waitFor(() => {
      expect(adminApi.reviewCompany).toHaveBeenCalledWith('comp-001', {
        status: 'REJECTED',
        reason: 'Mã số thuế không hợp lệ hoặc đã hết hiệu lực.',
        version: 1,
      });
    });
  });

  it('UC10: recovers company owner by selecting eligible member and entering reason', async () => {
    vi.mocked(adminApi.getCompanies).mockResolvedValue({
      data: mockCompanies,
      meta: { total: 3 },
    });
    vi.mocked(adminApi.getEligibleOwners).mockResolvedValue(mockEligibleOwners);
    vi.mocked(adminApi.recoverOwner).mockResolvedValue({
      ...mockCompanies[1]!,
      version: 3,
    });

    render(
      <MemoryRouter>
        <AdminCompaniesPage />
      </MemoryRouter>,
    );

    const recoverBtn = await screen.findByTestId('recover-owner-btn-comp-002');
    fireEvent.click(recoverBtn);

    // Wait for eligible owners to load
    await waitFor(() => {
      expect(adminApi.getEligibleOwners).toHaveBeenCalledWith('comp-002');
    });

    // Select eligible owner
    const selectOwner = screen.getByTestId('eligible-owner-select');
    fireEvent.change(selectOwner, { target: { value: 'u-eligible-1' } });

    // Enter reason
    const reasonInput = screen.getByTestId('recover-reason-input');
    fireEvent.change(reasonInput, {
      target: { value: 'Owner cũ đã rời doanh nghiệp đột xuất, chỉ định Quyền làm Owner mới.' },
    });

    // Confirm recover
    fireEvent.click(screen.getByTestId('confirm-recover-owner-btn'));

    await waitFor(() => {
      expect(adminApi.recoverOwner).toHaveBeenCalledWith('comp-002', {
        targetUserId: 'u-eligible-1',
        targetMemberVersion: 1,
        companyVersion: 2,
        reason: 'Owner cũ đã rời doanh nghiệp đột xuất, chỉ định Quyền làm Owner mới.',
      });
    });
  });
});
