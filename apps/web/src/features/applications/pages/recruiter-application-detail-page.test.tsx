import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecruiterApplicationDetailPage } from './recruiter-application-detail-page';
import { applicationsApi } from '../api/applications.api';
import type { DevApplicationItem } from '../../../lib/mocks/dev-mock-store';
import type { CandidateHistoryDto } from '@rms/contracts/public';
import { ApiException } from '../../../lib/http/api-client';

vi.mock('../api/applications.api');

const mockApplication: DevApplicationItem = {
  applicationId: 'app-001',
  jobId: 'j1111111-1111-1111-1111-111111111111',
  jobTitle: 'Senior Frontend Engineer',
  candidateSnapshot: {
    name: 'Nguyễn Văn An',
    email: 'an.nguyen@example.com',
    phone: '0901234567',
    headline: 'Frontend Lead with 5 YoE',
  },
  status: 'SUBMITTED',
  originalCvVersionId: 'cv_v1_an',
  currentCvVersionId: 'cv_v1_an',
  submittedAt: '2026-10-20T08:30:00Z',
  updatedAt: '2026-10-20T08:30:00Z',
  coverLetter: 'Tôi rất quan tâm đến vị trí này và mong muốn đóng góp cho công ty.',
  resultMessage: null,
  resultPublishedAt: null,
  version: 1,
  pendingCvChange: {
    requestId: 'req-cv-01',
    requestVersion: 1,
    newCvId: 'cv_v2_an',
    reason: 'Cập nhật chứng chỉ AWS mới',
    createdAt: '2026-10-21T10:00:00Z',
  },
};

const mockHistory: CandidateHistoryDto[] = [
  {
    id: 'h1',
    eventType: 'STATUS_CHANGE',
    fromStatus: null,
    toStatus: 'SUBMITTED',
    oldCvId: null,
    newCvId: null,
    publicMessage: 'Hồ sơ được nộp qua cổng tuyển dụng',
    createdAt: '2026-10-20T08:30:00Z',
    aggregateVersion: 1,
  },
];

describe('RecruiterApplicationDetailPage (UI20, UI23, FE31)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(applicationsApi.getApplicationDetail).mockResolvedValue(mockApplication);
    vi.mocked(applicationsApi.getApplicationHistory).mockResolvedValue(mockHistory);
  });

  const renderComponent = (appId = 'app-001') =>
    render(
      <MemoryRouter initialEntries={[`/recruiter/applications/${appId}`]}>
        <Routes>
          <Route path="/recruiter/applications/:id" element={<RecruiterApplicationDetailPage />} />
          <Route path="/recruiter/applications" element={<div>Danh sách hồ sơ</div>} />
        </Routes>
      </MemoryRouter>,
    );

  it('renders application details, snapshot, and history', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Hồ sơ: Nguyễn Văn An/)).toBeInTheDocument();
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByTestId('current-cv-id')).toHaveTextContent('cv_v1_an');
      expect(screen.getByText(/Tôi rất quan tâm đến vị trí này/)).toBeInTheDocument();
      expect(screen.getByText(/Lịch sử xử lý hồ sơ/i)).toBeInTheDocument();
      expect(screen.getByText('Hồ sơ được nộp qua cổng tuyển dụng')).toBeInTheDocument();
    });
  });

  it('allows recruiter to transition status from SUBMITTED to SCREENING (UC07, BR09)', async () => {
    vi.mocked(applicationsApi.reviewApplication).mockResolvedValue({
      ...mockApplication,
      status: 'SCREENING',
      version: 2,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('move-to-screening-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('move-to-screening-btn'));

    await waitFor(() => {
      expect(applicationsApi.reviewApplication).toHaveBeenCalledWith('app-001', {
        status: 'SCREENING',
        version: 1,
      });
      expect(
        screen.getByText('Đã chuyển trạng thái hồ sơ sang SCREENING thành công.'),
      ).toBeInTheDocument();
    });
  });

  it('handles CV change approval (FE31, UC06, BR08)', async () => {
    const screeningApp: DevApplicationItem = {
      ...mockApplication,
      status: 'SCREENING',
      pendingCvChange: {
        requestId: 'req-cv-01',
        requestVersion: 1,
        newCvId: 'cv_v2_an',
        reason: 'Cập nhật chứng chỉ AWS mới',
        createdAt: '2026-10-21T10:00:00Z',
      },
    };
    vi.mocked(applicationsApi.getApplicationDetail).mockResolvedValue(screeningApp);
    const { pendingCvChange: _unused, ...baseApp } = screeningApp;
    void _unused;
    vi.mocked(applicationsApi.reviewCvChange).mockResolvedValue({
      ...baseApp,
      currentCvVersionId: 'cv_v2_an',
      version: 2,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText(/Đề nghị thay đổi CV từ ứng viên/i)).toBeInTheDocument();
      expect(screen.getByTestId('approve-cv-change-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('approve-cv-change-btn'));

    await waitFor(() => {
      expect(applicationsApi.reviewCvChange).toHaveBeenCalledWith('app-001', {
        applicationVersion: 1,
        requestVersion: 1,
      });
      expect(
        screen.getByText('Đã duyệt thay đổi CV mới thành công! Phiên bản CV đã được cập nhật.'),
      ).toBeInTheDocument();
    });
  });

  it('opens publish result dialog and validates internal reason for REJECTED (UI23, BR13)', async () => {
    const interviewedApp: DevApplicationItem = {
      ...mockApplication,
      status: 'INTERVIEWED',
    };
    vi.mocked(applicationsApi.getApplicationDetail).mockResolvedValue(interviewedApp);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('publish-result-modal-btn')).toBeInTheDocument();
    });

    // Open Modal
    fireEvent.click(screen.getByTestId('publish-result-modal-btn'));

    await waitFor(() => {
      expect(screen.getByText('Công bố kết quả tuyển dụng (UI23)')).toBeInTheDocument();
    });

    // Select REJECTED
    const rejectRadio = screen.getByLabelText(/Từ chối \(REJECTED\)/i);
    fireEvent.click(rejectRadio);

    // Provide message to candidate but leave internal reason empty
    const messageInput = screen.getByTestId('result-message-input');
    fireEvent.change(messageInput, {
      target: { value: 'Cảm ơn bạn đã ứng tuyển, hẹn gặp lại dịp khác.' },
    });

    // Submit
    const confirmButton = screen.getByTestId('confirm-publish-result-btn');
    fireEvent.click(confirmButton);

    // Must show validation error for reason (BR13)
    await waitFor(() => {
      expect(
        screen.getByText(
          'Quy định nghiệp vụ (BR13): Bắt buộc nhập lý do từ chối nội bộ khi REJECTED.',
        ),
      ).toBeInTheDocument();
    });

    // Now fill internal reason
    const reasonInput = screen.getByTestId('reject-reason-input');
    fireEvent.change(reasonInput, {
      target: { value: 'Chưa đủ năm kinh nghiệm thực tế về Distributed Systems' },
    });

    vi.mocked(applicationsApi.publishResult).mockResolvedValue({
      ...interviewedApp,
      status: 'REJECTED',
      resultMessage: 'Cảm ơn bạn đã ứng tuyển, hẹn gặp lại dịp khác.',
      version: 2,
    });

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(applicationsApi.publishResult).toHaveBeenCalledWith('app-001', {
        result: 'REJECTED',
        reason: 'Chưa đủ năm kinh nghiệm thực tế về Distributed Systems',
        message: 'Cảm ơn bạn đã ứng tuyển, hẹn gặp lại dịp khác.',
        version: 1,
      });
      expect(
        screen.getByText('Đã công bố kết quả tuyển dụng: REJECTED thành công!'),
      ).toBeInTheDocument();
    });
  });

  it('publishes HIRED result without requiring reject reason', async () => {
    const interviewedApp: DevApplicationItem = {
      ...mockApplication,
      status: 'INTERVIEWED',
    };
    vi.mocked(applicationsApi.getApplicationDetail).mockResolvedValue(interviewedApp);
    vi.mocked(applicationsApi.publishResult).mockResolvedValue({
      ...interviewedApp,
      status: 'HIRED',
      resultMessage: 'Chúc mừng bạn đã trúng tuyển vị trí Senior Frontend Engineer!',
      version: 2,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('publish-result-modal-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('publish-result-modal-btn'));

    const messageInput = screen.getByTestId('result-message-input');
    fireEvent.change(messageInput, {
      target: { value: 'Chúc mừng bạn đã trúng tuyển vị trí Senior Frontend Engineer!' },
    });

    const confirmButton = screen.getByTestId('confirm-publish-result-btn');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(applicationsApi.publishResult).toHaveBeenCalledWith('app-001', {
        result: 'HIRED',
        reason: undefined,
        message: 'Chúc mừng bạn đã trúng tuyển vị trí Senior Frontend Engineer!',
        version: 1,
      });
    });
  });

  it('opens and closes CV preview modal', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('preview-cv-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('preview-cv-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('cv-preview-modal-content')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Đóng xem trước' }));

    await waitFor(() => {
      expect(screen.queryByTestId('cv-preview-modal-content')).not.toBeInTheDocument();
    });
  });

  it('handles error state when loading fails', async () => {
    vi.mocked(applicationsApi.getApplicationDetail).mockRejectedValueOnce(
      new ApiException(404, { message: 'Hồ sơ không tồn tại' }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Hồ sơ không tồn tại')).toBeInTheDocument();
    });
  });
});
