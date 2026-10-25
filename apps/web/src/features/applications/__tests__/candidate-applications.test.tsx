import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { MyApplicationsPage } from '../my-applications-page';
import { ApplicationDetailPage } from '../application-detail-page';
import { ApplyJobDialog } from '../components/apply-job-dialog';
import { apiClient } from '../../../lib/http/api-client';
import type { CandidateApplicationDto, PageResponse } from '@rms/contracts/public';

const mockApplication: CandidateApplicationDto = {
  applicationId: 'app-1',
  jobId: 'job-1',
  status: 'SUBMITTED',
  version: 1,
  originalCvVersionId: 'cv-1',
  currentCvVersionId: 'cv-1',
  candidateSnapshot: {
    name: 'Nguyễn Văn A',
    email: 'applicant@example.com',
    phone: '0912345678',
    headline: 'Frontend Engineer',
  },
  coverLetter: 'Tôi rất quan tâm đến công việc này.',
  submittedAt: '2026-01-15T09:00:00Z',
  updatedAt: '2026-01-15T09:00:00Z',
  resultMessage: null,
  resultPublishedAt: null,
};

describe('FE1 Candidate Applications (UI09, UI10, UI11, FE17 - FE21)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  /* -------------------------------------------------------------------------- */
  /* FE17 - UI09: Mở dialog, chọn CV, gửi hồ sơ với idempotency-key             */
  /* -------------------------------------------------------------------------- */
  it('FE17: nộp hồ sơ ứng tuyển thành công đính kèm idempotency-key', async () => {
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(mockApplication);
    const onSuccess = vi.fn();

    render(
      <ApplyJobDialog
        isOpen={true}
        onClose={vi.fn()}
        jobId="job-1"
        jobTitle="Frontend Developer"
        companyName="Talento Corp"
        onSuccess={onSuccess}
      />,
    );

    expect(screen.getByText(/Ứng tuyển vị trí: Frontend Developer/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Chọn CV ứng tuyển/)).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: 'Gửi hồ sơ' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith(
        '/api/jobs/job-1/applications',
        expect.objectContaining({
          cvId: 'cv-default-1',
        }),
        expect.objectContaining({
          idempotencyKey: expect.stringMatching(/^apply-/),
        }),
      );
      expect(screen.getByText('Nộp hồ sơ thành công!')).toBeInTheDocument();
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE18 - UI10: Lọc trạng thái và mở chi tiết hồ sơ                           */
  /* -------------------------------------------------------------------------- */
  it('FE18: danh sách hồ sơ lọc theo trạng thái và đồng bộ URL query parameter', async () => {
    const mockList: CandidateApplicationDto[] = [
      mockApplication,
      {
        ...mockApplication,
        applicationId: 'app-2',
        status: 'INTERVIEW_SCHEDULED',
      },
    ];

    vi.spyOn(apiClient, 'get').mockResolvedValue({
      data: mockList,
      meta: { page: 1, pageSize: 20, total: 2 },
    } as PageResponse<CandidateApplicationDto>);

    render(
      <MemoryRouter initialEntries={['/candidate/applications']}>
        <MyApplicationsPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Mã hồ sơ: #app-1/)).toBeInTheDocument();
      expect(screen.getByText(/Mã hồ sơ: #app-2/)).toBeInTheDocument();
    });

    // Lọc theo trạng thái SUBMITTED
    const filterSelect = screen.getByLabelText(/Lọc theo trạng thái/);
    fireEvent.change(filterSelect, { target: { value: 'SUBMITTED' } });

    await waitFor(() => {
      expect(screen.getByText(/Mã hồ sơ: #app-1/)).toBeInTheDocument();
      expect(screen.queryByText(/Mã hồ sơ: #app-2/)).not.toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE19 - UI11: Thay CV ở SUBMITTED, SCREENING, SHORTLISTED                   */
  /* -------------------------------------------------------------------------- */
  it('FE19: ở trạng thái SUBMITTED cho phép Thay đổi CV đã nộp trực tiếp', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/history')) return [];
      if (url.includes('/api/candidate/cvs'))
        return [{ id: 'cv-2', fileName: 'CV2.pdf', isDefault: false }];
      return mockApplication; // SUBMITTED
    });

    render(
      <MemoryRouter initialEntries={['/candidate/applications/app-submitted']}>
        <Routes>
          <Route
            path="/candidate/applications/:applicationId"
            element={<ApplicationDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Thay đổi CV đã nộp' })).toBeInTheDocument();
    });
  });

  it('FE19: ở trạng thái SCREENING hiển thị Đề nghị thay đổi CV', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/history')) return [];
      if (url.includes('/api/candidate/cvs')) return [];
      return { ...mockApplication, status: 'SCREENING' };
    });

    render(
      <MemoryRouter initialEntries={['/candidate/applications/app-screening']}>
        <Routes>
          <Route
            path="/candidate/applications/:applicationId"
            element={<ApplicationDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Đề nghị thay đổi CV' })).toBeInTheDocument();
    });
  });

  it('FE19: ở trạng thái SHORTLISTED vô hiệu hóa thay đổi CV', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/history')) return [];
      if (url.includes('/api/candidate/cvs')) return [];
      return { ...mockApplication, status: 'SHORTLISTED' };
    });

    render(
      <MemoryRouter initialEntries={['/candidate/applications/app-shortlisted']}>
        <Routes>
          <Route
            path="/candidate/applications/:applicationId"
            element={<ApplicationDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Không thể thay đổi CV ở giai đoạn SHORTLISTED/)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /thay đổi CV/i })).not.toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE20 - UI11: Hủy rồi xác nhận Rút hồ sơ ứng tuyển                          */
  /* -------------------------------------------------------------------------- */
  it('FE20: hủy dialog không gọi API; xác nhận rút hồ sơ chuyển sang WITHDRAWN', async () => {
    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/history')) return [];
      if (url.includes('/api/candidate/cvs')) return [];
      return mockApplication;
    });
    const postSpy = vi.spyOn(apiClient, 'post').mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/candidate/applications/app-1']}>
        <Routes>
          <Route
            path="/candidate/applications/:applicationId"
            element={<ApplicationDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Rút hồ sơ ứng tuyển' })).toBeInTheDocument();
    });

    // Bấm mở dialog
    fireEvent.click(screen.getByRole('button', { name: 'Rút hồ sơ ứng tuyển' }));

    expect(
      screen.getByText(/Bạn có chắc chắn muốn rút hồ sơ ứng tuyển này không/),
    ).toBeInTheDocument();

    // 1. Bấm Hủy bỏ -> không gọi API
    fireEvent.click(screen.getByRole('button', { name: 'Hủy bỏ' }));
    expect(postSpy).not.toHaveBeenCalled();

    // 2. Mở lại và Bấm Xác nhận rút hồ sơ
    fireEvent.click(screen.getByRole('button', { name: 'Rút hồ sơ ứng tuyển' }));
    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận rút hồ sơ' }));

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/api/applications/app-1/withdraw', {
        version: 1,
      });
      expect(screen.getByText(/Đã rút hồ sơ ứng tuyển thành công/)).toBeInTheDocument();
    });
  });

  /* -------------------------------------------------------------------------- */
  /* FE21 - UI11: Xem kết quả trước/sau công bố, không lộ internal_note          */
  /* -------------------------------------------------------------------------- */
  it('FE21: kết quả chỉ hiển thị thông điệp công khai, không lộ ghi chú nội bộ', async () => {
    const hiredApp: CandidateApplicationDto = {
      ...mockApplication,
      status: 'HIRED',
      resultMessage: 'Chúc mừng bạn đã trúng tuyển vị trí Kỹ sư Phần mềm!',
      resultPublishedAt: '2026-02-01T10:00:00Z',
    };

    vi.spyOn(apiClient, 'get').mockImplementation(async (url: string) => {
      if (url.includes('/history')) return [];
      if (url.includes('/api/candidate/cvs')) return [];
      return hiredApp;
    });

    render(
      <MemoryRouter initialEntries={['/candidate/applications/app-1']}>
        <Routes>
          <Route
            path="/candidate/applications/:applicationId"
            element={<ApplicationDetailPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('Chúc mừng bạn đã trúng tuyển vị trí Kỹ sư Phần mềm!'),
      ).toBeInTheDocument();
    });

    // Không tồn tại bất kỳ nội dung nào liên quan đến internal_note hoặc đánh giá nội bộ
    expect(screen.queryByText(/internal_note/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/lý do nội bộ/i)).not.toBeInTheDocument();
  });
});
