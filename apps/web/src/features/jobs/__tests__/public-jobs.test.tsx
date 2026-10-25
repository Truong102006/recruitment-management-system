import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { JobListPage } from '../job-list-page';
import { JobDetailPage } from '../job-detail-page';
import { AuthProvider } from '../../auth/context/auth-context';
import { apiClient } from '../../../lib/http/api-client';
import type { JobDetailDto, JobSummaryDto, PageResponse } from '@rms/contracts/public';

const mockJobSummary: JobSummaryDto = {
  id: 'job-1',
  companyId: 'comp-1',
  companyName: 'Talento Corp',
  title: 'Senior Frontend Developer',
  location: 'TP.HCM',
  jobType: 'FULL_TIME',
  workplaceMode: 'HYBRID',
  salary: { min: 25000000, max: 40000000, currency: 'VND' },
  deadline: '2026-12-31T23:59:59Z',
  publishedAt: '2026-01-01T00:00:00Z',
  status: 'PUBLISHED',
  skillIds: ['s1'],
  skills: [{ id: 's1', name: 'React', active: true }],
};

const mockJobDetail: JobDetailDto = {
  ...mockJobSummary,
  description: 'Chi tiết mô tả công việc lập trình viên React kinh nghiệm từ 3 năm.',
  headcount: 2,
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

describe('FE1 Public Jobs (UI01, UI02, FE01 - FE07)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* FE01 - UI01: Đổi từ khóa và địa điểm rồi tìm                               */
  /* -------------------------------------------------------------------------- */
  it('FE01: đổi từ khóa và địa điểm rồi tìm kiếm gọi API đúng tham số', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [mockJobSummary],
      meta: { page: 1, pageSize: 10, total: 1 },
    } as PageResponse<JobSummaryDto>);

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <JobListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    });

    // Thay đổi từ khóa và địa điểm
    fireEvent.change(screen.getByLabelText(/Từ khóa tìm kiếm/), { target: { value: 'Frontend' } });
    fireEvent.change(screen.getByLabelText(/Địa điểm/), { target: { value: 'Hà Nội' } });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(
        '/api/jobs',
        expect.objectContaining({
          params: expect.objectContaining({
            q: 'Frontend',
            location: 'Hà Nội',
            page: 1,
          }),
        }),
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE02 - UI01: Đổi bộ lọc khi đang ở trang 3 thì về trang 1                  */
  /* -------------------------------------------------------------------------- */
  it('FE02: đổi bộ lọc khi đang ở trang khác thì reset về trang 1', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [mockJobSummary],
      meta: { page: 3, pageSize: 10, total: 30 },
    } as PageResponse<JobSummaryDto>);

    render(
      <MemoryRouter initialEntries={['/jobs?page=3']}>
        <JobListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Developer')).toBeInTheDocument();
    });

    // Đổi hình thức việc làm
    fireEvent.change(screen.getByLabelText(/Hình thức công việc/), {
      target: { value: 'CONTRACT' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Tìm kiếm' }));

    await waitFor(() => {
      expect(getSpy).toHaveBeenLastCalledWith(
        '/api/jobs',
        expect.objectContaining({
          params: expect.objectContaining({
            jobType: 'CONTRACT',
            page: 1,
          }),
        }),
      );
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE03 - UI01: API trả rỗng có "Xóa bộ lọc", lỗi 500 có "Thử lại"            */
  /* -------------------------------------------------------------------------- */
  it('FE03: danh sách rỗng hiển thị nút Xóa bộ lọc', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0 },
    } as PageResponse<JobSummaryDto>);

    render(
      <MemoryRouter initialEntries={['/jobs?q=khongtontai']}>
        <JobListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Không tìm thấy việc làm phù hợp')).toBeInTheDocument();
    });
    expect(screen.getAllByRole('button', { name: 'Xóa bộ lọc' }).length).toBeGreaterThanOrEqual(1);
  });

  it('FE03: lỗi API 500 hiển thị thông báo lỗi và nút Thử lại', async () => {
    vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Internal Server Error'));

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <JobListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(/Đã xảy ra lỗi khi tải danh sách tin tuyển dụng/),
      ).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Thử lại' })).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* FE04 - UI01: Form có nhãn đầy đủ và accessible controls                   */
  /* -------------------------------------------------------------------------- */
  it('FE04: bộ lọc có nhãn rõ ràng kết nối với input cho công nghệ hỗ trợ', () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: [],
      meta: { page: 1, pageSize: 10, total: 0 },
    } as PageResponse<JobSummaryDto>);

    render(
      <MemoryRouter initialEntries={['/jobs']}>
        <JobListPage />
      </MemoryRouter>,
    );

    expect(screen.getByLabelText('Từ khóa tìm kiếm')).toBeInTheDocument();
    expect(screen.getByLabelText('Địa điểm')).toBeInTheDocument();
    expect(screen.getByLabelText('Hình thức công việc')).toBeInTheDocument();
    expect(screen.getByLabelText('Môi trường làm việc')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tìm kiếm' })).toBeInTheDocument();
  });

  /* -------------------------------------------------------------------------- */
  /* FE05 - UI02: Khách bấm Ứng tuyển chuyển hướng về đăng nhập an toàn         */
  /* -------------------------------------------------------------------------- */
  it('FE05: khách chưa đăng nhập bấm Ứng tuyển chuyển hướng về /login với returnTo an toàn', async () => {
    vi.spyOn(apiClient, 'get').mockResolvedValue(mockJobDetail);

    render(
      <AuthProvider skipAutoFetch={true} initialSession={null}>
        <MemoryRouter initialEntries={['/jobs/job-1']}>
          <Routes>
            <Route path="/jobs/:id" element={<JobDetailPage />} />
            <Route path="/login" element={<div>Trang Đăng Nhập</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Senior Frontend Developer' }),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Ứng tuyển ngay' }));

    await waitFor(() => {
      expect(screen.getByText('Trang Đăng Nhập')).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE06 - UI02: Tin hết hạn hoặc đã đóng hiển thị thông báo, khóa ứng tuyển   */
  /* -------------------------------------------------------------------------- */
  it('FE06: tin hết hạn hiển thị trạng thái và vô hiệu hóa nút Ứng tuyển', async () => {
    const expiredJob: JobDetailDto = {
      ...mockJobDetail,
      deadline: '2020-01-01T00:00:00Z',
      status: 'CLOSED',
    };
    vi.spyOn(apiClient, 'get').mockResolvedValue(expiredJob);

    render(
      <AuthProvider skipAutoFetch={true} initialSession={null}>
        <MemoryRouter initialEntries={['/jobs/job-expired']}>
          <Routes>
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByRole('heading', { level: 1, name: 'Senior Frontend Developer' }),
      ).toBeInTheDocument();
    });

    const applyButton = screen.getByRole('button', { name: 'Hết hạn ứng tuyển' });
    expect(applyButton).toBeDisabled();
  });

  /* -------------------------------------------------------------------------- */
  /* FE07 - UI02: Lưu và bỏ lưu tin gọi API tương ứng                          */
  /* -------------------------------------------------------------------------- */
  it('FE07: lưu và bỏ lưu tin tuyển dụng gọi PUT và DELETE /api/saved-jobs/:id', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/api/jobs/')) return mockJobDetail;
      if (url.includes('/api/saved-jobs'))
        return { data: [], meta: { page: 1, pageSize: 10, total: 0 } };
      return {};
    });
    const putSpy = vi.spyOn(apiClient, 'put').mockResolvedValue(undefined);
    const deleteSpy = vi.spyOn(apiClient, 'delete').mockResolvedValue(undefined);

    const candidateSession = {
      userId: 'usr-1',
      email: 'candidate@example.com',
      fullName: 'Ứng viên Test',
      roles: ['CANDIDATE' as const],
      status: 'ACTIVE' as const,
      csrfToken: 'csrf-token',
    };

    render(
      <AuthProvider skipAutoFetch={true} initialSession={candidateSession}>
        <MemoryRouter initialEntries={['/jobs/job-1']}>
          <Routes>
            <Route path="/jobs/:jobId" element={<JobDetailPage />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('☆ Lưu tin tuyển dụng')).toBeInTheDocument();
    });

    // Bấm lưu tin
    fireEvent.click(screen.getByRole('button', { name: '☆ Lưu tin tuyển dụng' }));

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith('/api/saved-jobs/job-1');
      expect(screen.getByText('★ Đã lưu tin')).toBeInTheDocument();
    });

    // Bấm bỏ lưu tin
    fireEvent.click(screen.getByRole('button', { name: '★ Đã lưu tin' }));

    await waitFor(() => {
      expect(deleteSpy).toHaveBeenCalledWith('/api/saved-jobs/job-1');
      expect(screen.getByText('☆ Lưu tin tuyển dụng')).toBeInTheDocument();
    });
  });
});
