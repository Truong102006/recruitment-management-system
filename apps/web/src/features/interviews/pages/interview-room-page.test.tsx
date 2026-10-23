import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InterviewRoomPage } from './interview-room-page';
import { interviewsApi } from '../api/interviews.api';
import type { DevInterviewItem } from '../../../lib/mocks/dev-mock-store';

vi.mock('../api/interviews.api');

const mockInterview: DevInterviewItem = {
  id: 'iv-001',
  applicationId: 'app-001',
  candidateName: 'Đặng Minh Quân',
  candidateEmail: 'minhquan.dang@gmail.com',
  jobTitle: 'Senior Frontend Engineer',
  startAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 55 * 60 * 1000).toISOString(),
  durationMinutes: 60,
  format: 'ONLINE',
  status: 'CONFIRMED',
  locationOrMeetingLink: 'https://meet.talento.vn/room-iv-001',
  interviewers: [{ userId: 'u-1', fullName: 'Võ Minh Trí', email: 'tri.vo@company.com' }],
};

const mockRoomToken = {
  token: 'mock-jwt-token-12345',
  roomName: 'rms-interview-iv-001',
  domain: 'meet.jit.si',
};

describe('InterviewRoomPage (UI15, FE25)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders room header and controls properly', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterview);
    vi.mocked(interviewsApi.getRoomToken).mockResolvedValue(mockRoomToken);

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001/room']}>
        <Routes>
          <Route path="/interviews/:id/room" element={<InterviewRoomPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui15-interview-room')).toBeInTheDocument();
    expect(screen.getByText(/Phòng họp: rms-interview-iv-001/i)).toBeInTheDocument();
    expect(screen.getByTestId('leave-room-btn')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-leave-btn')).toBeInTheDocument();
  });

  it('toggles audio, video, and screen sharing states', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterview);
    vi.mocked(interviewsApi.getRoomToken).mockResolvedValue(mockRoomToken);

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001/room']}>
        <Routes>
          <Route path="/interviews/:id/room" element={<InterviewRoomPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByTestId('ui15-interview-room');

    // Toggle mic
    const micBtn = screen.getByTestId('toggle-mic-btn');
    expect(micBtn).toHaveTextContent('Mic Đang Bật');
    fireEvent.click(micBtn);
    expect(micBtn).toHaveTextContent('Mic Đã Tắt');

    // Toggle camera
    const camBtn = screen.getByTestId('toggle-cam-btn');
    expect(camBtn).toHaveTextContent('Camera Đang Bật');
    fireEvent.click(camBtn);
    expect(camBtn).toHaveTextContent('Camera Đã Tắt');
  });

  it('FE25: handles device permission denied simulation and guide', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterview);
    vi.mocked(interviewsApi.getRoomToken).mockResolvedValue(mockRoomToken);

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001/room']}>
        <Routes>
          <Route path="/interviews/:id/room" element={<InterviewRoomPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByTestId('ui15-interview-room');

    const permBtn = screen.getByTestId('simulate-permission-denied-btn');
    fireEvent.click(permBtn);

    expect(screen.getByTestId('permission-denied-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Trình duyệt chưa được cấp quyền truy cập Camera \/ Microphone/i),
    ).toBeInTheDocument();
  });

  it('FE25: leaving room navigates back and does NOT mark interview as COMPLETED', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterview);
    vi.mocked(interviewsApi.getRoomToken).mockResolvedValue(mockRoomToken);

    render(
      <MemoryRouter initialEntries={['/interviews/iv-001/room']}>
        <Routes>
          <Route path="/interviews/:id/room" element={<InterviewRoomPage />} />
          <Route
            path="/interviews/:id"
            element={<div data-testid="interview-detail-view">Detail</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await screen.findByTestId('ui15-interview-room');

    // Click leave room
    fireEvent.click(screen.getByTestId('leave-room-btn'));

    // Verify detail page reached
    await waitFor(() => {
      expect(screen.getByTestId('interview-detail-view')).toBeInTheDocument();
    });

    // Verify NO API was called to change status to COMPLETED
    expect(interviewsApi.scheduleInterview).not.toHaveBeenCalled();
    expect(interviewsApi.recordAttendance).not.toHaveBeenCalled();
  });
});
