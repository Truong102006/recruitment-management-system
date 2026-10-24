import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { InterviewListPage } from './interview-list-page';
import { interviewsApi } from '../api/interviews.api';
import { applicationsApi } from '../../applications/api/applications.api';
import { companiesApi } from '../../companies/api/companies.api';
import * as CompanyContextModule from '../../companies/context/company-context';
import type { DevInterviewItem, DevApplicationItem } from '../../../lib/mocks/dev-mock-store';
import type { CompanyMemberDto, CompanyDto } from '@rms/contracts/public';
import { ApiException } from '../../../lib/http/api-client';

vi.mock('../api/interviews.api');
vi.mock('../../applications/api/applications.api');
vi.mock('../../companies/api/companies.api');

const mockCompany: CompanyDto = {
  id: 'c1111111-1111-1111-1111-111111111111',
  name: 'Acme Corp',
  taxCode: 'TAX-123456',
  address: '123 Wall Street',
  website: null,
  description: null,
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 1,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
};

const mockInterviews: DevInterviewItem[] = [
  {
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
  },
];

const mockApplications: DevApplicationItem[] = [
  {
    applicationId: 'app-001',
    jobId: 'j-01',
    jobTitle: 'Senior Frontend Engineer',
    candidateSnapshot: {
      name: 'Nguyễn Văn An',
      email: 'an.nguyen@example.com',
      phone: '0901234567',
      headline: 'Frontend Lead',
    },
    status: 'SHORTLISTED',
    originalCvVersionId: 'cv_v1_an',
    currentCvVersionId: 'cv_v1_an',
    submittedAt: '2026-10-20T08:30:00Z',
    updatedAt: '2026-10-20T08:30:00Z',
    coverLetter: '',
    resultMessage: null,
    resultPublishedAt: null,
    version: 1,
  },
];

const mockMembers: CompanyMemberDto[] = [
  {
    userId: 'u-tech-lead',
    email: 'tri.vo@company.com',
    fullName: 'Võ Minh Trí',
    role: 'INTERVIEWER',
    permissions: ['INTERVIEWER'],
    active: true,
    version: 1,
    joinedAt: '2026-01-01T00:00:00Z',
  },
  {
    userId: 'u-recruiter',
    email: 'hr@company.com',
    fullName: 'Lê HR',
    role: 'RECRUITER',
    permissions: ['RECRUITER'],
    active: true,
    version: 1,
    joinedAt: '2026-01-01T00:00:00Z',
  },
];

describe('InterviewListPage (UI13 & UI21, BR10, BR11)', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.spyOn(CompanyContextModule, 'useCompanyContext').mockReturnValue({
      currentCompanyId: mockCompany.id,
      currentCompany: mockCompany,
      currentRole: 'OWNER',
      memberships: [{ company: mockCompany, role: 'OWNER' }],
      setMemberships: vi.fn(),
      switchCompany: vi.fn(),
    });

    vi.mocked(interviewsApi.getInterviews).mockResolvedValue(mockInterviews);
    vi.mocked(applicationsApi.getCompanyApplications).mockResolvedValue({
      data: mockApplications,
      meta: { total: 1 },
    });
    vi.mocked(companiesApi.getCompanyMembers).mockResolvedValue(mockMembers);
  });

  const renderComponent = () =>
    render(
      <MemoryRouter initialEntries={['/interviews']}>
        <Routes>
          <Route path="/interviews" element={<InterviewListPage />} />
          <Route
            path="/interviews/:id/evaluation"
            element={<div data-testid="eval-page">Trang đánh giá</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

  it('renders interview calendar and existing interview events', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Lịch phỏng vấn/i })).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
      expect(screen.getByText(/Backend Node\.js Developer/)).toBeInTheDocument();
      expect(screen.getByTestId('open-schedule-modal-btn')).toBeInTheDocument();
    });
  });

  it('opens schedule modal (UI21) and validates required future start time (BR10)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('open-schedule-modal-btn')).toBeInTheDocument();
    });

    // Open modal
    fireEvent.click(screen.getByTestId('open-schedule-modal-btn'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Xếp lịch phỏng vấn mới/i })).toBeInTheDocument();
    });

    // Set past date
    const dateInput = screen.getByLabelText(/Thời gian bắt đầu/i);
    fireEvent.change(dateInput, { target: { value: '2020-01-01T10:00' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Xác nhận xếp lịch' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Thời gian bắt đầu phỏng vấn phải ở tương lai/i)).toBeInTheDocument();
    });
  });

  it('validates at least one interviewer must be selected (BR10)', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('open-schedule-modal-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-schedule-modal-btn'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Xếp lịch phỏng vấn mới/i })).toBeInTheDocument();
    });

    // Future date
    const dateInput = screen.getByLabelText(/Thời gian bắt đầu/i);
    fireEvent.change(dateInput, { target: { value: '2026-12-01T14:00' } });

    // Submit without selecting interviewer
    const submitBtn = screen.getByRole('button', { name: 'Xác nhận xếp lịch' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Vui lòng phân công ít nhất một người phỏng vấn/i),
      ).toBeInTheDocument();
    });
  });

  it('schedules interview successfully when fields are valid', async () => {
    vi.mocked(interviewsApi.scheduleInterview).mockResolvedValue({
      id: 'iv-002',
      applicationId: 'app-001',
      candidateName: 'Nguyễn Văn An',
      candidateEmail: 'an.nguyen@example.com',
      jobTitle: 'Senior Frontend Engineer',
      startAt: '2026-12-01T14:00:00.000Z',
      endAt: '2026-12-01T15:00:00.000Z',
      durationMinutes: 60,
      status: 'CONFIRMED',
      format: 'ONLINE',
      locationOrMeetingLink: 'Google Meet',
      interviewers: [
        {
          userId: 'u-tech-lead',
          fullName: 'Võ Minh Trí',
          email: 'tri.vo@company.com',
        },
      ],
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId('open-schedule-modal-btn')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('open-schedule-modal-btn'));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Xếp lịch phỏng vấn mới/i })).toBeInTheDocument();
    });

    // Pick future date
    const dateInput = screen.getByLabelText(/Thời gian bắt đầu/i);
    fireEvent.change(dateInput, { target: { value: '2026-12-01T14:00' } });

    // Select interviewer chip
    const interviewerChip = screen.getByTestId('interviewer-chip-u-tech-lead');
    fireEvent.click(interviewerChip);

    // Fill location
    const locationInput = screen.getByTestId('schedule-location-input');
    fireEvent.change(locationInput, { target: { value: 'Google Meet' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: 'Xác nhận xếp lịch' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(interviewsApi.scheduleInterview).toHaveBeenCalledWith(
        expect.objectContaining({
          applicationId: 'app-001',
          format: 'ONLINE',
          interviewerIds: ['u-tech-lead'],
          location: 'Google Meet',
        }),
      );
      expect(screen.getByText(/Xếp lịch phỏng vấn mới thành công!/i)).toBeInTheDocument();
    });
  });

  it('handles error state when loading interviews fails', async () => {
    vi.mocked(interviewsApi.getInterviews).mockRejectedValueOnce(
      new ApiException(500, { message: 'Không thể kết nối đến máy chủ' }),
    );

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Không thể kết nối đến máy chủ')).toBeInTheDocument();
    });
  });
});
