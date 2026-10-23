import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RecruiterApplicationsListPage } from './recruiter-applications-list-page';
import { applicationsApi } from '../api/applications.api';
import { recruiterJobsApi } from '../../jobs/recruiter/api/recruiter-jobs.api';
import * as CompanyContextModule from '../../companies/context/company-context';
import type { DevApplicationItem } from '../../../lib/mocks/dev-mock-store';
import type { JobSummaryDto, CompanyDto } from '@rms/contracts/public';
import { ApiException } from '../../../lib/http/api-client';

vi.mock('../api/applications.api');
vi.mock('../../jobs/recruiter/api/recruiter-jobs.api');

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
    salary: null,
    deadline: '2026-12-31T17:00:00+07:00',
    publishedAt: '2026-01-01T00:00:00Z',
    status: 'PUBLISHED',
    skillIds: [],
    skills: [],
  },
  {
    id: 'j2222222-2222-2222-2222-222222222222',
    companyId: mockCompany.id,
    companyName: 'Acme Corp',
    title: 'Backend Node.js Developer',
    location: 'Hà Nội',
    jobType: 'FULL_TIME',
    workplaceMode: 'REMOTE',
    salary: null,
    deadline: '2026-12-31T17:00:00+07:00',
    publishedAt: '2026-01-01T00:00:00Z',
    status: 'PUBLISHED',
    skillIds: [],
    skills: [],
  },
];

const mockApplications: DevApplicationItem[] = [
  {
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
    coverLetter: 'Tôi rất quan tâm đến vị trí này.',
    resultMessage: null,
    resultPublishedAt: null,
    version: 1,
    pendingCvChange: {
      requestId: 'req-01',
      requestVersion: 1,
      newCvId: 'cv_v2_an',
      reason: 'Cập nhật chứng chỉ mới',
      createdAt: '2026-10-21T10:00:00Z',
    },
  },
  {
    applicationId: 'app-002',
    jobId: 'j2222222-2222-2222-2222-222222222222',
    jobTitle: 'Backend Node.js Developer',
    candidateSnapshot: {
      name: 'Trần Thị Bình',
      email: 'binh.tran@example.com',
      phone: '0912345678',
      headline: 'Full-stack Engineer',
    },
    status: 'SCREENING',
    originalCvVersionId: 'cv_v1_binh',
    currentCvVersionId: 'cv_v1_binh',
    submittedAt: '2026-10-18T14:15:00Z',
    updatedAt: '2026-10-18T14:15:00Z',
    coverLetter: 'Xin gửi hồ sơ ứng tuyển.',
    resultMessage: null,
    resultPublishedAt: null,
    version: 2,
  },
];

describe('RecruiterApplicationsListPage (UI19)', () => {
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

    vi.mocked(recruiterJobsApi.getCompanyJobs).mockResolvedValue({
      data: mockJobs,
      meta: { page: 1, pageSize: 10, total: 2, totalPages: 1 },
    });

    vi.mocked(applicationsApi.getCompanyApplications).mockResolvedValue({
      data: mockApplications,
      meta: { total: 2 },
    });
  });

  it('renders application list and job filter options', async () => {
    render(
      <MemoryRouter>
        <RecruiterApplicationsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Hồ sơ Ứng viên/i })).toBeInTheDocument();
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
      expect(screen.getByText('Trần Thị Bình')).toBeInTheDocument();
    });

    // Check CV change notice badge is rendered for app-001
    expect(screen.getByText(/Có đề nghị đổi CV/i)).toBeInTheDocument();
  });

  it('filters by status when status select changes', async () => {
    render(
      <MemoryRouter>
        <RecruiterApplicationsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    const statusSelect = screen.getByLabelText(/Trạng thái xét duyệt/i);
    fireEvent.change(statusSelect, { target: { value: 'SUBMITTED' } });

    await waitFor(() => {
      expect(applicationsApi.getCompanyApplications).toHaveBeenCalledWith(
        mockCompany.id,
        expect.objectContaining({ status: 'SUBMITTED' }),
      );
    });
  });

  it('filters by job when job select changes', async () => {
    render(
      <MemoryRouter>
        <RecruiterApplicationsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    const jobSelect = screen.getByLabelText(/Vị trí tuyển dụng/i);
    fireEvent.change(jobSelect, { target: { value: mockJobs[0]!.id } });

    await waitFor(() => {
      expect(applicationsApi.getCompanyApplications).toHaveBeenCalledWith(
        mockCompany.id,
        expect.objectContaining({ jobId: mockJobs[0]!.id }),
      );
    });
  });

  it('searches applications by keyword', async () => {
    render(
      <MemoryRouter>
        <RecruiterApplicationsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    const searchInput = screen.getByLabelText(/Tìm kiếm ứng viên/i);
    fireEvent.change(searchInput, { target: { value: 'Nguyễn' } });

    await waitFor(() => {
      expect(applicationsApi.getCompanyApplications).toHaveBeenCalledWith(
        mockCompany.id,
        expect.objectContaining({ q: 'Nguyễn' }),
      );
    });
  });

  it('handles error state when API fails', async () => {
    vi.mocked(applicationsApi.getCompanyApplications).mockRejectedValueOnce(
      new ApiException(500, { message: 'Lỗi kết nối máy chủ' }),
    );

    render(
      <MemoryRouter>
        <RecruiterApplicationsListPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Lỗi kết nối máy chủ')).toBeInTheDocument();
    });
  });

  it('navigates to detail page when clicking Chi tiết hồ sơ', async () => {
    render(
      <MemoryRouter initialEntries={['/recruiter/applications']}>
        <Routes>
          <Route path="/recruiter/applications" element={<RecruiterApplicationsListPage />} />
          <Route
            path="/recruiter/applications/:id"
            element={<div data-testid="detail-page">Trang chi tiết</div>}
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Nguyễn Văn An')).toBeInTheDocument();
    });

    const detailButtons = screen.getAllByRole('button', { name: /Chi tiết hồ sơ/i });
    fireEvent.click(detailButtons[0]!);

    await waitFor(() => {
      expect(screen.getByTestId('detail-page')).toBeInTheDocument();
    });
  });
});
