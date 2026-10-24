import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InterviewEvaluationPage } from './interview-evaluation-page';
import { interviewsApi } from '../api/interviews.api';
import type { DevInterviewItem } from '../../../lib/mocks/dev-mock-store';
import { ApiException } from '../../../lib/http/api-client';

vi.mock('../api/interviews.api');

const mockInterview: DevInterviewItem = {
  id: 'iv-001',
  applicationId: 'app-002',
  candidateName: 'Trần Thị Bình',
  candidateEmail: 'binh.tran@example.com',
  jobTitle: 'Backend Node.js Developer',
  startAt: '2026-10-25T09:00:00+07:00',
  endAt: '2026-10-25T10:00:00+07:00',
  durationMinutes: 60,
  status: 'COMPLETED',
  format: 'ONLINE',
  locationOrMeetingLink: 'https://meet.google.com/xyz-abcd-jkl',
  interviewers: [
    {
      userId: 'u-tech-lead',
      fullName: 'Võ Minh Trí (Tech Lead)',
      email: 'tri.vo@company.com',
    },
  ],
};

describe('InterviewEvaluationPage (UI22, UC13, BR13)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterview);
    vi.mocked(interviewsApi.submitEvaluation).mockResolvedValue({
      success: true,
    });
  });

  const renderComponent = (id = 'iv-001') =>
    render(
      <MemoryRouter initialEntries={[`/interviews/${id}/evaluation`]}>
        <Routes>
          <Route path="/interviews/:id/evaluation" element={<InterviewEvaluationPage />} />
          <Route path="/interviews" element={<div>Trang lịch phỏng vấn</div>} />
        </Routes>
      </MemoryRouter>,
    );

  it('renders interview details and evaluation form controls', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Phiếu Đánh giá Phỏng vấn (UI22)')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
      expect(screen.getByText('Backend Node.js Developer')).toBeInTheDocument();
      expect(screen.getByText('Võ Minh Trí (Tech Lead)')).toBeInTheDocument();
      expect(screen.getByTestId('score-technical-input')).toBeInTheDocument();
      expect(screen.getByTestId('score-problem-solving-input')).toBeInTheDocument();
      expect(screen.getByTestId('score-culture-fit-input')).toBeInTheDocument();
      expect(screen.getByTestId('recommendation-hire')).toBeInTheDocument();
      expect(screen.getByTestId('evaluation-note-input')).toBeInTheDocument();
    });
  });

  it('validates note length according to BR13 (required, 10-5000 chars)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Phiếu Đánh giá Phỏng vấn (UI22)')).toBeInTheDocument();
    });

    const submitBtn = screen.getByTestId('submit-evaluation-btn');

    // Submit with empty note
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Vui lòng nhập nhận xét / ghi chú đánh giá nội bộ (BR13).'),
      ).toBeInTheDocument();
    });

    // Enter note < 10 chars
    const noteTextarea = screen.getByTestId('evaluation-note-input');
    fireEvent.change(noteTextarea, { target: { value: 'Tốt' } });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText('Nhận xét đánh giá phải có độ dài tối thiểu 10 ký tự.'),
      ).toBeInTheDocument();
    });

    expect(interviewsApi.submitEvaluation).not.toHaveBeenCalled();
  });

  it('submits evaluation successfully with valid scores and note', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Phiếu Đánh giá Phỏng vấn (UI22)')).toBeInTheDocument();
    });

    // Adjust score
    const techInput = screen.getByTestId('score-technical-input');
    fireEvent.change(techInput, { target: { value: '5' } });

    // Select recommendation
    const recInput = screen.getByTestId('recommendation-hire');
    fireEvent.click(recInput);

    // Enter valid note
    const noteTextarea = screen.getByTestId('evaluation-note-input');
    fireEvent.change(noteTextarea, {
      target: {
        value: 'Ứng viên nắm rất vững TypeScript và NestJS. Trả lời xuất sắc case study.',
      },
    });

    const submitBtn = screen.getByTestId('submit-evaluation-btn');
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(interviewsApi.submitEvaluation).toHaveBeenCalledWith('iv-001', {
        interviewerId: 'u-tech-lead',
        technicalScore: 5,
        problemSolvingScore: 4,
        cultureFitScore: 4,
        recommendation: 'HIRE',
        note: 'Ứng viên nắm rất vững TypeScript và NestJS. Trả lời xuất sắc case study.',
      });
      expect(screen.getByText('Gửi phiếu đánh giá phỏng vấn thành công!')).toBeInTheDocument();
    });
  });

  it('handles error state when API fails', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockRejectedValueOnce(
      new ApiException(404, { message: 'Buổi phỏng vấn không tồn tại' }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Buổi phỏng vấn không tồn tại')).toBeInTheDocument();
    });
  });
});
