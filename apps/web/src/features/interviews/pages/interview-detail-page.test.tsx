import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InterviewDetailPage } from './interview-detail-page';
import { interviewsApi } from '../api/interviews.api';
import type { DevInterviewItem } from '../../../lib/mocks/dev-mock-store';

vi.mock('../api/interviews.api');

const mockInterviewWithPendingParticipant: DevInterviewItem = {
  id: 'iv-001',
  applicationId: 'app-001',
  candidateName: 'Đặng Minh Quân',
  candidateEmail: 'minhquan.dang@gmail.com',
  jobTitle: 'Senior Frontend Engineer',
  startAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 phút nữa bắt đầu (nằm trong cửa sổ)
  endAt: new Date(Date.now() + 65 * 60 * 1000).toISOString(),
  durationMinutes: 60,
  format: 'ONLINE',
  status: 'CONFIRMED',
  locationOrMeetingLink: 'https://meet.talento.vn/room-iv-001',
  interviewers: [{ userId: 'u-1', fullName: 'Võ Minh Trí', email: 'tri.vo@company.com' }],
  participants: [
    {
      userId: 'u-1',
      fullName: 'Võ Minh Trí',
      email: 'tri.vo@company.com',
      role: 'INTERVIEWER',
      responseStatus: 'ACCEPTED',
      attendanceStatus: null,
    },
    {
      userId: 'u-cand',
      fullName: 'Đặng Minh Quân',
      email: 'minhquan.dang@gmail.com',
      role: 'CANDIDATE',
      responseStatus: 'PENDING', // FE23: 1 người pending => hiển thị chờ xác nhận
      attendanceStatus: null,
    },
  ],
};

const mockInterviewAllAccepted: DevInterviewItem = {
  ...mockInterviewWithPendingParticipant,
  id: 'iv-002',
  participants: [
    {
      userId: 'u-1',
      fullName: 'Võ Minh Trí',
      email: 'tri.vo@company.com',
      role: 'INTERVIEWER',
      responseStatus: 'ACCEPTED',
      attendanceStatus: 'ATTENDED',
    },
    {
      userId: 'u-cand',
      fullName: 'Đặng Minh Quân',
      email: 'minhquan.dang@gmail.com',
      role: 'CANDIDATE',
      responseStatus: 'ACCEPTED',
      attendanceStatus: 'ATTENDED',
    },
  ],
};

const mockInterviewOutsideWindow: DevInterviewItem = {
  ...mockInterviewWithPendingParticipant,
  id: 'iv-003',
  // Bắt đầu 2 ngày sau => ngoài cửa sổ vào phòng
  startAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
};

describe('InterviewDetailPage (UI14, FE23, FE24)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders interview details and participant list correctly', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(
      mockInterviewWithPendingParticipant,
    );

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001']}>
        <Routes>
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui14-interview-detail')).toBeInTheDocument();
    expect(screen.getAllByText('Đặng Minh Quân', { exact: false }).length).toBeGreaterThan(0);
    expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
    expect(screen.getByText('Võ Minh Trí')).toBeInTheDocument();
  });

  it('FE23: displays pending confirmation banner when any participant has PENDING responseStatus', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(
      mockInterviewWithPendingParticipant,
    );

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001']}>
        <Routes>
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('schedule-pending-alert')).toBeInTheDocument();
    expect(screen.getByText(/Cuộc họp vẫn đang ở trạng thái/i)).toBeInTheDocument();
  });

  it('FE23: does NOT display pending banner when all participants accepted', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterviewAllAccepted);

    render(
      <MemoryRouter initialEntries={['/interviews/iv-002']}>
        <Routes>
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByTestId('ui14-interview-detail');
    expect(screen.queryByTestId('schedule-pending-alert')).not.toBeInTheDocument();
  });

  it('FE24: enables enter room button when current time is within [startAt - 10m, endAt + 30m]', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(
      mockInterviewWithPendingParticipant,
    );

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001']}>
        <Routes>
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const joinBtn = await screen.findByTestId('join-room-btn');
    expect(joinBtn).not.toBeDisabled();
    expect(screen.getByText(/Vào phòng phỏng vấn/i)).toBeInTheDocument();
  });

  it('FE24: disables enter room button when current time is outside window', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterviewOutsideWindow);

    render(
      <MemoryRouter initialEntries={['/interviews/iv-003']}>
        <Routes>
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const joinBtn = await screen.findByTestId('join-room-btn');
    expect(joinBtn).toBeDisabled();
    expect(screen.getByText(/Phòng họp mở trước giờ bắt đầu 10 phút/i)).toBeInTheDocument();
  });

  it('updates participant attendance status successfully', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(
      mockInterviewWithPendingParticipant,
    );
    vi.mocked(interviewsApi.recordAttendance).mockResolvedValue({
      ...mockInterviewWithPendingParticipant,
      participants: [
        {
          ...mockInterviewWithPendingParticipant.participants![0]!,
          attendanceStatus: 'ATTENDED',
        },
        mockInterviewWithPendingParticipant.participants![1]!,
      ],
    });

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001']}>
        <Routes>
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByTestId('ui14-interview-detail');

    // Click 'Có mặt' button for first participant
    const attendedBtns = screen.getAllByRole('button', { name: /Có mặt/i });
    fireEvent.click(attendedBtns[0]!);

    await waitFor(() => {
      expect(interviewsApi.recordAttendance).toHaveBeenCalledWith('iv-001', 'u-1', 'ATTENDED');
    });
  });
});
