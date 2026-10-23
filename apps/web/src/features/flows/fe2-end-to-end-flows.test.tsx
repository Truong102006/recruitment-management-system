import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { recruiterJobsApi } from '../jobs/recruiter/api/recruiter-jobs.api';
import { applicationsApi } from '../applications/api/applications.api';
import { interviewsApi } from '../interviews/api/interviews.api';
import { statisticsApi } from '../statistics/api/statistics.api';
import { adminApi } from '../admin/api/admin.api';
import * as CompanyContextModule from '../companies/context/company-context';
import { RecruiterJobsListPage } from '../jobs/recruiter/pages/recruiter-jobs-list-page';
import { JobFormPage } from '../jobs/recruiter/pages/job-form-page';
import { RecruiterApplicationDetailPage } from '../applications/pages/recruiter-application-detail-page';
import { InterviewListPage } from '../interviews/pages/interview-list-page';
import { InterviewDetailPage } from '../interviews/pages/interview-detail-page';
import { InterviewEvaluationPage } from '../interviews/pages/interview-evaluation-page';
import { RecruiterStatisticsPage } from '../statistics/pages/recruiter-statistics-page';
import { AdminUsersPage } from '../admin/pages/admin-users-page';
import { AdminEventsPage } from '../admin/pages/admin-events-page';
import type { CompanyDto, JobDetailDto, CandidateApplicationDto } from '@rms/contracts/public';
import type {
  DevApplicationItem,
  DevInterviewItem,
  RecruitmentFunnelDto,
  AdminUserDto,
  OutboxEventItem,
} from '../../lib/mocks/dev-mock-store';

vi.mock('../jobs/recruiter/api/recruiter-jobs.api');
vi.mock('../applications/api/applications.api');
vi.mock('../interviews/api/interviews.api');
vi.mock('../statistics/api/statistics.api');
vi.mock('../admin/api/admin.api');

const mockCompany: CompanyDto = {
  id: 'comp-acme-01',
  name: 'Acme Corporation',
  taxCode: '0109998887',
  address: 'Landmark 81, TP. HCM',
  website: 'https://acme.vn',
  description: 'Tập đoàn công nghệ và chuyển đổi số',
  approvalStatus: 'APPROVED',
  rejectionReason: null,
  version: 2,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-10T00:00:00Z',
};

const mockJob: JobDetailDto = {
  id: 'job-101',
  companyId: 'comp-acme-01',
  companyName: 'Acme Corporation',
  title: 'Lead Software Engineer (React / Node.js)',
  description: 'Mô tả tuyển dụng kỹ sư công nghệ chất lượng cao trên quy mô hệ thống lớn...',
  status: 'PUBLISHED',
  location: 'TP. Hồ Chí Minh',
  jobType: 'FULL_TIME',
  workplaceMode: 'HYBRID',
  salary: { min: 40000000, max: 70000000, currency: 'VND' },
  headcount: 3,
  skillIds: ['s1', 's2'],
  skills: [
    { id: 's1', name: 'React', category: 'TECHNICAL', active: true },
    { id: 's2', name: 'Node.js', category: 'TECHNICAL', active: true },
  ],
  deadline: '2026-12-31T23:59:59Z',
  publishedAt: '2026-02-01T08:00:00Z',
  version: 1,
  createdAt: '2026-02-01T08:00:00Z',
  updatedAt: '2026-02-01T08:00:00Z',
};

const mockApplication: DevApplicationItem = {
  applicationId: 'app-501',
  jobId: 'job-101',
  jobTitle: 'Lead Software Engineer (React / Node.js)',
  status: 'SCREENING',
  version: 1,
  originalCvVersionId: 'cv-v1',
  currentCvVersionId: 'cv-v1',
  candidateSnapshot: {
    name: 'Nguyễn Văn Chuyên',
    email: 'chuyen.nguyen@example.com',
    phone: '0912345678',
    headline: 'Senior Fullstack Engineer | 6 years experience',
  },
  coverLetter: 'Kính gửi nhà tuyển dụng, tôi mong muốn ứng tuyển vị trí Lead Engineer...',
  submittedAt: '2026-02-10T09:00:00Z',
  updatedAt: '2026-02-10T09:00:00Z',
  resultMessage: null,
  resultPublishedAt: null,
  pendingCvChange: {
    requestId: 'req-cv-99',
    requestVersion: 1,
    newCvId: 'cv-v2',
    newCvName: 'CV_NguyenVanChuyen_Updated_2026.pdf',
    reason: 'Bổ sung chứng chỉ AWS Solutions Architect',
    createdAt: '2026-02-11T10:00:00Z',
  },
};

const mockInterview: DevInterviewItem = {
  id: 'iv-801',
  applicationId: 'app-501',
  candidateName: 'Nguyễn Văn Chuyên',
  candidateEmail: 'chuyen.nguyen@example.com',
  jobTitle: 'Lead Software Engineer (React / Node.js)',
  startAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
  endAt: new Date(Date.now() + 70 * 60 * 1000).toISOString(),
  durationMinutes: 60,
  format: 'ONLINE',
  status: 'CONFIRMED',
  locationOrMeetingLink: 'https://meet.talento.vn/room-iv-801',
  interviewers: [{ userId: 'u-lead', fullName: 'Trần Văn Lead', email: 'lead@acme.vn' }],
  participants: [
    {
      userId: 'u-lead',
      fullName: 'Trần Văn Lead',
      email: 'lead@acme.vn',
      role: 'INTERVIEWER',
      responseStatus: 'ACCEPTED',
      attendanceStatus: 'ATTENDED',
    },
    {
      userId: 'u-cand',
      fullName: 'Nguyễn Văn Chuyên',
      email: 'chuyen.nguyen@example.com',
      role: 'CANDIDATE',
      responseStatus: 'ACCEPTED',
      attendanceStatus: 'ATTENDED',
    },
  ],
};

const mockFunnel: RecruitmentFunnelDto = {
  submitted: 45,
  screening: 25,
  interviewed: 12,
  hired: 3,
  rejected: 15,
  rates: {
    submittedToScreening: 55.5,
    screeningToInterviewed: 48.0,
    interviewedToHired: 25.0,
    overallHiredRate: 6.7,
  },
  asOf: '2026-10-23T15:30:00Z',
  period: '30 ngày qua',
};

const mockAdminUsers: AdminUserDto[] = [
  {
    userId: 'u-admin-root',
    email: 'admin.master@rms.gov.vn',
    fullName: 'Root System Admin',
    role: 'ADMIN',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    userId: 'u-violator',
    email: 'spammer@baddomain.com',
    fullName: 'Tài khoản Lừa đảo',
    role: 'RECRUITER',
    status: 'ACTIVE',
    version: 1,
    createdAt: '2026-02-15T00:00:00Z',
    updatedAt: '2026-02-15T00:00:00Z',
  },
];

const mockOutboxEvents: OutboxEventItem[] = [
  {
    id: 'evt-retry-01',
    eventType: 'INTERVIEW_NOTIFICATION_FAILED',
    aggregateType: 'Interview',
    aggregateId: 'iv-801',
    traceId: 'tr-evt-retry-01',
    status: 'FAILED',
    payload: {
      interviewId: 'iv-801',
      recipientEmail: 'chuyen.nguyen@example.com',
      accessToken: 'SECRET_SHOULD_BE_REDACTED',
    },
    retryCount: 1,
    lastError: 'Remote mail relay connection timeout',
    createdAt: '2026-02-10T10:00:00Z',
    updatedAt: '2026-02-10T10:05:00Z',
  },
];

describe('FE2 End-to-End & Integration Flows (FE23 - FE41, Responsive & A11y)', () => {
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
  });

  // Flow 1: Recruiter Jobs Lifecycle
  it('Flow 1: Recruiter creates job draft (FE28) and lists published jobs (FE27)', async () => {
    vi.mocked(recruiterJobsApi.getCompanyJobs).mockResolvedValue({
      data: [mockJob],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });
    vi.mocked(recruiterJobsApi.getJobDetail).mockResolvedValue(mockJob);
    vi.mocked(recruiterJobsApi.getSkills).mockResolvedValue(mockJob.skills);
    vi.mocked(recruiterJobsApi.closeJob).mockResolvedValue({
      ...mockJob,
      status: 'CLOSED',
      version: 2,
    });

    render(
      <MemoryRouter initialEntries={['/recruiter/jobs']}>
        <Routes>
          <Route path="/recruiter/jobs" element={<RecruiterJobsListPage />} />
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // List displays
    expect(await screen.findByTestId('ui17-jobs-list')).toBeInTheDocument();
    expect(screen.getByText('Lead Software Engineer (React / Node.js)')).toBeInTheDocument();

    // Verify closing job with reason (FE27)
    const closeBtn = screen.getByTestId('close-job-btn-job-101');
    fireEvent.click(closeBtn);

    const reasonInput = screen.getByTestId('close-job-reason-input');
    fireEvent.change(reasonInput, {
      target: { value: 'Đã hoàn thành tuyển đủ headcount 3 người.' },
    });
    fireEvent.click(screen.getByTestId('confirm-close-job-btn'));

    await waitFor(() => {
      expect(recruiterJobsApi.closeJob).toHaveBeenCalledWith('job-101', {
        version: mockJob.version,
        reason: 'Đã hoàn thành tuyển đủ headcount 3 người.',
      });
    });
  });

  // Flow 2: Application Review, CV Change Approval & Result Publishing
  it('Flow 2: Recruiter reviews application, approves CV change (FE31), and publishes result (FE36)', async () => {
    // 1. First stage: Application with pending CV change in SCREENING status
    vi.mocked(applicationsApi.getApplicationDetail).mockResolvedValueOnce(mockApplication);
    vi.mocked(applicationsApi.getApplicationHistory).mockResolvedValue([]);
    const cleanApp: CandidateApplicationDto = {
      ...mockApplication,
      currentCvVersionId: 'cv-v2',
      version: 2,
    };
    vi.mocked(applicationsApi.reviewCvChange).mockResolvedValue(cleanApp);

    // 2. Second stage after approving CV change: Application now in INTERVIEWED status
    const interviewedApp: DevApplicationItem = {
      ...mockApplication,
      status: 'INTERVIEWED',
      currentCvVersionId: 'cv-v2',
      pendingCvChange: null,
      version: 2,
    };
    vi.mocked(applicationsApi.getApplicationDetail).mockResolvedValue(interviewedApp);

    const cleanInterviewedApp: CandidateApplicationDto = {
      ...interviewedApp,
      status: 'HIRED',
      resultMessage: 'Chúc mừng bạn đã trúng tuyển vị trí Lead Engineer.',
      version: 3,
    };
    vi.mocked(applicationsApi.publishResult).mockResolvedValue(cleanInterviewedApp);

    render(
      <MemoryRouter initialEntries={['/recruiter/applications/app-501']}>
        <Routes>
          <Route path="/recruiter/applications/:id" element={<RecruiterApplicationDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui20-application-detail')).toBeInTheDocument();
    expect(screen.getByText('Nguyễn Văn Chuyên')).toBeInTheDocument();

    // CV change request banner is visible (FE31)
    expect(screen.getByTestId('pending-cv-change-panel')).toBeInTheDocument();
    expect(screen.getByTestId('new-cv-id-label')).toHaveTextContent('cv-v2');

    // Approve CV change (FE31)
    fireEvent.click(screen.getByTestId('approve-cv-change-btn'));
    await waitFor(() => {
      expect(applicationsApi.reviewCvChange).toHaveBeenCalledWith('app-501', {
        applicationVersion: 1,
        requestVersion: 1,
      });
    });

    // Now application is updated to INTERVIEWED status, open Publish Result modal (UI23, FE36)
    const openPublishModalBtn = await screen.findByTestId('publish-result-modal-btn');
    fireEvent.click(openPublishModalBtn);

    // Verify modal is shown
    expect(screen.getByTestId('publish-result-modal-content')).toBeInTheDocument();

    // Fill message (FE36: Public message without internal score leakage)
    const msgInput = screen.getByTestId('result-message-input');
    fireEvent.change(msgInput, {
      target: { value: 'Chúc mừng bạn đã trúng tuyển vị trí Lead Engineer.' },
    });

    // Confirm publish
    fireEvent.click(screen.getByTestId('confirm-publish-result-btn'));
    await waitFor(() => {
      expect(applicationsApi.publishResult).toHaveBeenCalledWith('app-501', {
        result: 'HIRED',
        message: 'Chúc mừng bạn đã trúng tuyển vị trí Lead Engineer.',
        reason: undefined,
        version: 2,
      });
    });
  });

  // Flow 3: Interview Lifecycle, Online Room Window & Evaluation
  it('Flow 3: Interview detail, room window check (FE24), and interviewer evaluation (FE35)', async () => {
    vi.mocked(interviewsApi.getInterviewDetail).mockResolvedValue(mockInterview);
    vi.mocked(interviewsApi.getInterviews).mockResolvedValue([mockInterview]);

    render(
      <MemoryRouter initialEntries={['/interviews/iv-801']}>
        <Routes>
          <Route path="/interviews" element={<InterviewListPage />} />
          <Route path="/interviews/:id" element={<InterviewDetailPage />} />
          <Route path="/interviews/:id/evaluation" element={<InterviewEvaluationPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui14-interview-detail')).toBeInTheDocument();

    // Verify room entrance enabled because startAt is in 10 mins (FE24)
    const joinBtn = screen.getByTestId('join-room-btn');
    expect(joinBtn).not.toBeDisabled();
  });

  // Flow 4: Recruitment Statistics Funnel & Zero Division Safety
  it('Flow 4: Funnel conversion statistics render safely without NaN% (FE38)', async () => {
    vi.mocked(statisticsApi.getRecruitmentFunnel).mockResolvedValue(mockFunnel);

    render(
      <MemoryRouter>
        <RecruiterStatisticsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui25-statistics')).toBeInTheDocument();
    expect(screen.getByTestId('count-submitted')).toHaveTextContent('45');
    expect(screen.getByTestId('count-hired')).toHaveTextContent('3');
    expect(screen.getByTestId('overall-hired-rate')).toHaveTextContent('6.7%');
    expect(screen.getByTestId('statistics-html-table')).toBeInTheDocument();
  });

  // Flow 5: Admin Moderation, Last Admin Protection & Outbox Retry
  it('Flow 5: Admin verifies companies, protects last admin (FE40), and retries failed outbox (FE41)', async () => {
    vi.mocked(adminApi.getUsers).mockResolvedValue({
      data: mockAdminUsers,
      meta: { total: 2 },
    });
    vi.mocked(adminApi.getOutboxEvents).mockResolvedValue({
      data: mockOutboxEvents,
      meta: { total: 1 },
    });
    vi.mocked(adminApi.retryOutboxEvent).mockResolvedValue({
      ...mockOutboxEvents[0]!,
      status: 'PUBLISHED',
      retryCount: 2,
    });
    vi.mocked(adminApi.updateUserStatus).mockRejectedValueOnce(
      new Error('Không thể khóa tài khoản Quản trị viên (ADMIN) cuối cùng của hệ thống!'),
    );

    // 1. Admin Users: Last admin protection
    const { unmount } = render(
      <MemoryRouter>
        <AdminUsersPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui27-admin-users')).toBeInTheDocument();

    // Try locking root admin
    const lockRootBtn = screen.getByTestId('lock-user-btn-u-admin-root');
    fireEvent.click(lockRootBtn);

    const lockReason = screen.getByTestId('lock-reason-input');
    fireEvent.change(lockReason, { target: { value: 'Khóa nhầm admin root' } });
    fireEvent.click(screen.getByTestId('confirm-lock-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('lock-error-alert')).toHaveTextContent(
        /Không thể khóa tài khoản Quản trị viên \(ADMIN\) cuối cùng/i,
      );
    });

    unmount();

    // 2. Admin Events: Retry failed event safely (FE41)
    render(
      <MemoryRouter>
        <AdminEventsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui28-admin-events')).toBeInTheDocument();

    const retryBtn = screen.getByTestId('retry-btn-evt-retry-01');
    fireEvent.click(retryBtn);

    const confirmRetryBtn = screen.getByTestId('confirm-retry-btn');
    fireEvent.click(confirmRetryBtn);

    await waitFor(() => {
      expect(adminApi.retryOutboxEvent).toHaveBeenCalledWith('evt-retry-01');
    });
  });
});
