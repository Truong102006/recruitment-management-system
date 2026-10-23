import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminAuditPage } from './admin-audit-page';
import { adminApi } from '../api/admin.api';
import type { AuditLogItem } from '../../../lib/mocks/dev-mock-store';

vi.mock('../api/admin.api');

const mockAuditLogs: AuditLogItem[] = [
  {
    id: 'audit-001',
    actorId: 'admin-01',
    actorEmail: 'admin@rms.gov.vn',
    action: 'REVIEW_COMPANY_APPROVED',
    entityType: 'Company',
    entityId: 'comp-001',
    traceId: 'tr-abc-12345678',
    details: 'Đã phê duyệt doanh nghiệp Công ty Cổ phần Công nghệ Talento',
    metadata: { reason: 'Đầy đủ giấy tờ hợp lệ' },
    createdAt: '2026-02-01T10:00:00Z',
  },
  {
    id: 'audit-002',
    actorId: 'admin-01',
    actorEmail: 'admin@rms.gov.vn',
    action: 'USER_LOCKED',
    entityType: 'User',
    entityId: 'u-spammer',
    traceId: 'tr-xyz-98765432',
    details: 'Đã khóa tài khoản spammer@fake.vn',
    metadata: { reason: 'Vi phạm chính sách cộng đồng' },
    createdAt: '2026-02-02T11:30:00Z',
  },
];

describe('AdminAuditPage (UI28)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders audit log table with actors, entities, and actions', async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue({
      data: mockAuditLogs,
      meta: { total: 2 },
    });

    render(
      <MemoryRouter>
        <AdminAuditPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui28-admin-audit')).toBeInTheDocument();
    expect(screen.getByText('Nhật ký Audit Hệ thống')).toBeInTheDocument();
    expect(screen.getByText('REVIEW_COMPANY_APPROVED')).toBeInTheDocument();
    expect(screen.getByText('USER_LOCKED')).toBeInTheDocument();
  });

  it('opens and closes metadata detail modal', async () => {
    vi.mocked(adminApi.getAuditLogs).mockResolvedValue({
      data: mockAuditLogs,
      meta: { total: 2 },
    });

    render(
      <MemoryRouter>
        <AdminAuditPage />
      </MemoryRouter>,
    );

    await screen.findByTestId('ui28-admin-audit');

    const viewDetailsBtns = screen.getAllByRole('button', { name: /Xem Metadata/i });
    fireEvent.click(viewDetailsBtns[0]!);

    expect(screen.getByText('Chi tiết Nhật ký Audit')).toBeInTheDocument();
    expect(screen.getByText(/Đầy đủ giấy tờ hợp lệ/i)).toBeInTheDocument();

    // Close modal
    fireEvent.click(screen.getByRole('button', { name: 'Đóng' }));
    expect(screen.queryByText('Chi tiết Nhật ký Audit')).not.toBeInTheDocument();
  });
});
