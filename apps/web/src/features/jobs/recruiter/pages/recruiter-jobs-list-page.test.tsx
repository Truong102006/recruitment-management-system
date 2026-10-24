import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RecruiterJobsListPage } from './recruiter-jobs-list-page';
import { recruiterJobsApi } from '../api/recruiter-jobs.api';
import * as CompanyContextModule from '../../../companies/context/company-context';
import type { JobSummaryDto, CompanyDto, JobDetailDto } from '@rms/contracts/public';

vi.mock('../api/recruiter-jobs.api');

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

const mockJobs: JobSummaryDto[] = [
  {
    id: 'j1111111-1111-1111-1111-111111111111',
    companyId: mockCompany.id,
    companyName: 'Acme Corp',
    title: 'Senior Frontend Engineer',
    location: 'TP.HCM',
    jobType: 'FULL_TIME',
    workplaceMode: 'HYBRID',
    salary: { min: 25000000, max: 40000000, currency: 'VND' },
    deadline: '2026-12-31T17:00:00+07:00',
    publishedAt: '2026-01-01T00:00:00Z',
    status: 'PUBLISHED',
    skillIds: ['s1'],
    skills: [{ id: 's1', name: 'React', active: true }],
  },
  {
    id: 'j2222222-2222-2222-2222-222222222222',
    companyId: mockCompany.id,
    companyName: 'Acme Corp',
    title: 'Junior QA Tester',
    location: 'Hà Nội',
    jobType: 'FULL_TIME',
    workplaceMode: 'ON_SITE',
    salary: null,
    deadline: '2026-11-30T17:00:00+07:00',
    publishedAt: null,
    status: 'DRAFT',
    skillIds: [],
    skills: [],
  },
  {
    id: 'j3333333-3333-3333-3333-333333333333',
    companyId: mockCompany.id,
    companyName: 'Acme Corp',
    title: 'DevOps Specialist (Archived)',
    location: 'Đà Nẵng',
    jobType: 'CONTRACT',
    workplaceMode: 'REMOTE',
    salary: { min: 30000000, max: 50000000, currency: 'VND' },
    deadline: '2026-01-01T17:00:00+07:00',
    publishedAt: '2025-12-01T00:00:00Z',
    status: 'CLOSED',
    skillIds: [],
    skills: [],
  },
];

describe('RecruiterJobsListPage (UI17)', () => {
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

  it('renders jobs list with data from API', async () => {
    vi.mocked(recruiterJobsApi.getCompanyJobs).mockResolvedValue({
      data: mockJobs,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <RecruiterJobsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
      expect(screen.getByText('Junior QA Tester')).toBeInTheDocument();
      expect(screen.getByText('DevOps Specialist (Archived)')).toBeInTheDocument();
    });

    expect(screen.getByText('Đang tuyển')).toBeInTheDocument();
    expect(screen.getAllByText('Bản nháp').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Đã đóng').length).toBeGreaterThanOrEqual(1);
  });

  it('FE27 & BR04: verifies CLOSED job does NOT have any re-open button and edit is disabled', async () => {
    vi.mocked(recruiterJobsApi.getCompanyJobs).mockResolvedValue({
      data: mockJobs,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <RecruiterJobsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('DevOps Specialist (Archived)')).toBeInTheDocument();
    });

    const closedJobId = mockJobs[2]!.id;

    // Check edit button is not present for CLOSED job (shows "Đã khóa")
    expect(screen.queryByTestId(`edit-job-btn-${closedJobId}`)).toBeNull();
    expect(screen.getByTestId(`closed-job-no-edit-${closedJobId}`)).toHaveTextContent('Đã khóa');

    // CRITICAL BR04 check: There must NOT be any "Mở lại" or re-open button in the DOM for this job!
    expect(screen.queryByText(/Mở lại/i)).toBeNull();
    expect(screen.queryByText(/Re-open/i)).toBeNull();
  });

  it('FE27: closes a published job with reason and updates list', async () => {
    vi.mocked(recruiterJobsApi.getCompanyJobs).mockResolvedValue({
      data: mockJobs,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    const jobDetail: JobDetailDto = {
      ...mockJobs[0]!,
      description: 'Job description text',
      headcount: 2,
      version: 4,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    vi.mocked(recruiterJobsApi.getJobDetail).mockResolvedValue(jobDetail);
    vi.mocked(recruiterJobsApi.closeJob).mockResolvedValue({
      ...jobDetail,
      status: 'CLOSED',
    });

    render(
      <MemoryRouter>
        <RecruiterJobsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Senior Frontend Engineer')).toBeInTheDocument();
    });

    const closeBtn = screen.getByTestId(`close-job-btn-${mockJobs[0]!.id}`);
    fireEvent.click(closeBtn);

    expect(screen.getByTestId('close-job-dialog-content')).toBeInTheDocument();

    const confirmCloseBtn = screen.getByTestId('confirm-close-job-btn');
    // Button is disabled until reason is entered
    expect(confirmCloseBtn).toBeDisabled();

    fireEvent.change(screen.getByTestId('close-job-reason-input'), {
      target: { value: 'Đã tuyển đủ 2 vị trí ứng viên xuất sắc' },
    });

    expect(confirmCloseBtn).not.toBeDisabled();
    fireEvent.click(confirmCloseBtn);

    await waitFor(() => {
      expect(recruiterJobsApi.closeJob).toHaveBeenCalledWith(mockJobs[0]!.id, {
        version: 4,
        reason: 'Đã tuyển đủ 2 vị trí ứng viên xuất sắc',
      });
    });

    expect(screen.getByTestId('success-alert')).toHaveTextContent(/Đã đóng tin tuyển dụng/i);
  });

  it('publishes draft job when company is APPROVED', async () => {
    vi.mocked(recruiterJobsApi.getCompanyJobs).mockResolvedValue({
      data: mockJobs,
      meta: { page: 1, pageSize: 10, total: 3, totalPages: 1 },
    });

    const draftDetail: JobDetailDto = {
      ...mockJobs[1]!,
      description: 'Draft QA description',
      headcount: 1,
      deadline: '2026-11-30T17:00:00+07:00',
      version: 2,
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    };
    vi.mocked(recruiterJobsApi.getJobDetail).mockResolvedValue(draftDetail);
    vi.mocked(recruiterJobsApi.publishJob).mockResolvedValue({
      ...draftDetail,
      status: 'PUBLISHED',
    });

    render(
      <MemoryRouter>
        <RecruiterJobsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Junior QA Tester')).toBeInTheDocument();
    });

    const publishBtn = screen.getByTestId(`publish-job-btn-${mockJobs[1]!.id}`);
    fireEvent.click(publishBtn);

    expect(screen.getByTestId('publish-job-dialog-content')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-publish-job-btn'));

    await waitFor(() => {
      expect(recruiterJobsApi.publishJob).toHaveBeenCalledWith(mockJobs[1]!.id, {
        version: 2,
        deadline: '2026-11-30T17:00:00+07:00',
      });
    });

    expect(screen.getByTestId('success-alert')).toHaveTextContent(/Công bố tin.*thành công/i);
  });

  it('filters jobs by status when clicking status tabs', async () => {
    vi.mocked(recruiterJobsApi.getCompanyJobs).mockResolvedValue({
      data: [mockJobs[1]!],
      meta: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    });

    render(
      <MemoryRouter>
        <RecruiterJobsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(recruiterJobsApi.getCompanyJobs).toHaveBeenCalledWith(mockCompany.id, {
        status: undefined,
        q: undefined,
      });
    });

    fireEvent.click(screen.getByTestId('filter-tab-draft'));

    await waitFor(() => {
      expect(recruiterJobsApi.getCompanyJobs).toHaveBeenCalledWith(mockCompany.id, {
        status: 'DRAFT',
        q: undefined,
      });
    });
  });
});
