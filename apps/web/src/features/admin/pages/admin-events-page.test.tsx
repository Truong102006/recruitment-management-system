import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminEventsPage } from './admin-events-page';
import { adminApi } from '../api/admin.api';
import type { OutboxEventItem } from '../../../lib/mocks/dev-mock-store';

vi.mock('../api/admin.api');

const mockEvents: OutboxEventItem[] = [
  {
    id: 'evt-001',
    eventType: 'COMPANY_APPROVED',
    aggregateType: 'Company',
    aggregateId: 'comp-001',
    traceId: 'tr-001',
    status: 'PUBLISHED',
    payload: { companyId: 'comp-001', approvedBy: 'admin-01' },
    retryCount: 0,
    lastError: null,
    createdAt: '2026-02-01T08:00:00Z',
    updatedAt: '2026-02-01T08:00:01Z',
  },
  {
    id: 'evt-failed',
    eventType: 'INTERVIEW_INVITATION_DISPATCHED',
    aggregateType: 'Interview',
    aggregateId: 'iv-001',
    traceId: 'tr-failed-002',
    status: 'FAILED',
    payload: {
      interviewId: 'iv-001',
      candidateEmail: 'candidate@email.com',
      accessToken: 'SECRET_TOKEN_DO_NOT_EXPOSE',
    },
    retryCount: 2,
    lastError: 'SMTP Connection Timeout after 30000ms',
    createdAt: '2026-02-02T09:00:00Z',
    updatedAt: '2026-02-02T09:15:00Z',
  },
];

describe('AdminEventsPage (UI28, FE41)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders outbox events list with statuses and retry counts', async () => {
    vi.mocked(adminApi.getOutboxEvents).mockResolvedValue({
      data: mockEvents,
      meta: { total: 2 },
    });

    render(
      <MemoryRouter>
        <AdminEventsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui28-admin-events')).toBeInTheDocument();
    expect(screen.getByText('COMPANY_APPROVED')).toBeInTheDocument();
    expect(screen.getByText('INTERVIEW_INVITATION_DISPATCHED')).toBeInTheDocument();
    expect(screen.getByText('SMTP Connection Timeout after 30000ms')).toBeInTheDocument();
  });

  it('FE41: shows Retry button only for FAILED events and triggers retry on confirm', async () => {
    vi.mocked(adminApi.getOutboxEvents).mockResolvedValue({
      data: mockEvents,
      meta: { total: 2 },
    });
    vi.mocked(adminApi.retryOutboxEvent).mockResolvedValue({
      ...mockEvents[1]!,
      status: 'PUBLISHED',
      retryCount: 3,
      lastError: null,
    });

    render(
      <MemoryRouter>
        <AdminEventsPage />
      </MemoryRouter>,
    );

    // evt-001 is PUBLISHED -> No retry button
    expect(screen.queryByTestId('retry-btn-evt-001')).not.toBeInTheDocument();

    // evt-failed is FAILED -> Has retry button
    const retryBtn = await screen.findByTestId('retry-btn-evt-failed');
    expect(retryBtn).toBeInTheDocument();

    fireEvent.click(retryBtn);

    // Confirmation dialog opens
    expect(screen.getByText(/Xác nhận kích hoạt Retry sự kiện/i)).toBeInTheDocument();

    // Confirm retry
    const confirmBtn = screen.getByTestId('confirm-retry-btn');
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(adminApi.retryOutboxEvent).toHaveBeenCalledWith('evt-failed');
    });
  });

  it('FE41: sanitizes sensitive keys like tokens/secrets in payload detail view', async () => {
    vi.mocked(adminApi.getOutboxEvents).mockResolvedValue({
      data: mockEvents,
      meta: { total: 2 },
    });

    render(
      <MemoryRouter>
        <AdminEventsPage />
      </MemoryRouter>,
    );

    await screen.findByTestId('ui28-admin-events');

    // Open detail for failed event
    const detailBtns = screen.getAllByRole('button', { name: /Chi tiết/i });
    fireEvent.click(detailBtns[1]!); // Second event

    expect(screen.getByText('Chi tiết Sự kiện Outbox')).toBeInTheDocument();

    // Ensure the raw secret token is NOT exposed in the document
    const modalContent = document.body.textContent ?? '';
    expect(modalContent).not.toContain('SECRET_TOKEN_DO_NOT_EXPOSE');
    expect(modalContent).toContain('***REDACTED***');
  });
});
