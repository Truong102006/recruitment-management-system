import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterviewCalendar, type InterviewEvent } from './interview-calendar';

const mockEvents: InterviewEvent[] = [
  {
    id: 'evt-1',
    title: 'Phỏng vấn Frontend',
    startAt: '2026-10-24T10:00:00.000Z',
    endAt: '2026-10-24T11:00:00.000Z',
    status: 'CONFIRMED',
    candidateName: 'Nguyễn Văn A',
    jobTitle: 'Senior Frontend Developer',
    mode: 'ONLINE',
    interviewerNames: ['Lê Văn Sơn', 'Hồ Thị Mai'],
  },
  {
    id: 'evt-2',
    title: 'Phỏng vấn Backend',
    startAt: '2026-10-25T14:30:00.000Z',
    endAt: '2026-10-25T15:30:00.000Z',
    status: 'PROPOSED',
    candidateName: 'Trần Thị B',
    jobTitle: 'Backend Developer',
    mode: 'IN_PERSON',
  },
];

describe('InterviewCalendar', () => {
  it('renders agenda view by default with event cards', () => {
    const handleSelect = vi.fn();
    render(
      <InterviewCalendar events={mockEvents} onSelectEvent={handleSelect} defaultView="agenda" />,
    );

    expect(screen.getByTestId('agenda-view')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument();
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument();
    expect(screen.getByText('Đã xác nhận')).toBeInTheDocument();
    expect(screen.getByText('Đề xuất')).toBeInTheDocument();

    // Click event card
    fireEvent.click(screen.getByText('Nguyễn Văn A'));
    expect(handleSelect).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('switches to calendar month view and navigates months', () => {
    render(<InterviewCalendar events={mockEvents} defaultView="agenda" />);

    // Switch to calendar
    fireEvent.click(screen.getByTestId('tab-calendar'));
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument();

    // Check weekdays
    expect(screen.getByText('T2')).toBeInTheDocument();
    expect(screen.getByText('CN')).toBeInTheDocument();

    // Navigate month
    const nextBtn = screen.getByText('▶');
    fireEvent.click(nextBtn);

    const prevBtn = screen.getByText('◀');
    fireEvent.click(prevBtn);
  });

  it('displays empty state when there are no events in agenda view', () => {
    render(<InterviewCalendar events={[]} defaultView="agenda" />);
    expect(screen.getByText('Chưa có lịch phỏng vấn nào.')).toBeInTheDocument();
  });
});
