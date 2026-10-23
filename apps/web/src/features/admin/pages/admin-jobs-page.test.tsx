import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AdminJobsPage } from './admin-jobs-page';
import { adminApi } from '../api/admin.api';
import type { JobDetailDto } from '@rms/contracts/public';

vi.mock('../api/admin.api');

const mockJobs: JobDetailDto[] = [
  {
    id: 'job-001',
    companyId: 'comp-001',
    companyName: 'Công ty Cổ phần Công nghệ Talento',
    title: 'Senior Frontend Engineer (React/TypeScript)',
    description: 'Tuyển dụng kỹ sư Frontend giỏi...',
    status: 'PUBLISHED',
    location: 'Hồ Chí Minh',
    jobType: 'FULL_TIME',
    workplaceMode: 'HYBRID',
    salary: { min: 35000000, max: 55000000, currency: 'VND' },
    skillIds: ['s1'],
    skills: [{ id: 's1', name: 'React', category: 'TECHNICAL', active: true }],
    headcount: 2,
    deadline: '2026-12-31T23:59:59Z',
    publishedAt: '2026-01-01T00:00:00Z',
    version: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'job-spam',
    companyId: 'comp-003',
    companyName: 'Công ty SPAM',
    title: 'Việc nhẹ lương 50 triệu/ngày tại nhà',
    description: 'Cần nộp phí đặt cọc trước...',
    status: 'PUBLISHED',
    location: 'Toàn quốc',
    jobType: 'PART_TIME',
    workplaceMode: 'REMOTE',
    salary: null,
    skillIds: [],
    skills: [],
    headcount: 10,
    deadline: '2026-12-31T23:59:59Z',
    publishedAt: '2026-01-01T00:00:00Z',
    version: 2,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
];

describe('AdminJobsPage (UI27)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders job moderation table and displays jobs', async () => {
    vi.mocked(adminApi.getJobs).mockResolvedValue({
      data: mockJobs,
      meta: { total: 2 },
    });

    render(
      <MemoryRouter>
        <AdminJobsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui27-admin-jobs')).toBeInTheDocument();
    expect(screen.getByText('Senior Frontend Engineer (React/TypeScript)')).toBeInTheDocument();
    expect(screen.getByText('Việc nhẹ lương 50 triệu/ngày tại nhà')).toBeInTheDocument();
  });

  it('closes a violating job with mandatory reason', async () => {
    vi.mocked(adminApi.getJobs).mockResolvedValue({
      data: mockJobs,
      meta: { total: 2 },
    });
    vi.mocked(adminApi.closeJob).mockResolvedValue({
      ...mockJobs[1]!,
      status: 'CLOSED',
      version: 3,
    });

    render(
      <MemoryRouter>
        <AdminJobsPage />
      </MemoryRouter>,
    );

    const closeBtn = await screen.findByTestId('admin-close-job-btn-job-spam');
    fireEvent.click(closeBtn);

    // Empty reason validation
    fireEvent.click(screen.getByTestId('confirm-close-job-btn'));
    expect(screen.getByTestId('close-error-alert')).toBeInTheDocument();
    expect(screen.getByText(/Vui lòng nhập lý do đóng tin tuyển dụng/i)).toBeInTheDocument();
    expect(adminApi.closeJob).not.toHaveBeenCalled();

    // Valid reason
    fireEvent.change(screen.getByTestId('close-reason-input'), {
      target: { value: 'Tin tuyển dụng có dấu hiệu lừa đảo thu tiền cọc ứng viên.' },
    });
    fireEvent.click(screen.getByTestId('confirm-close-job-btn'));

    await waitFor(() => {
      expect(adminApi.closeJob).toHaveBeenCalledWith('job-spam', {
        reason: 'Tin tuyển dụng có dấu hiệu lừa đảo thu tiền cọc ứng viên.',
        version: 2,
      });
    });
  });
});
