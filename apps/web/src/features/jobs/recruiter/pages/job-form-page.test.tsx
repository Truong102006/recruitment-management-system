import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { JobFormPage } from './job-form-page';
import { recruiterJobsApi } from '../api/recruiter-jobs.api';
import { ApiException } from '../../../../lib/http/api-client';
import * as CompanyContextModule from '../../../companies/context/company-context';
import type { CompanyDto, SkillDto, JobDetailDto } from '@rms/contracts/public';

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

const mockSkills: SkillDto[] = [
  { id: 's1', name: 'React', active: true },
  { id: 's2', name: 'TypeScript', active: true },
  { id: 's3', name: 'Node.js', active: true },
];

const mockExistingJob: JobDetailDto = {
  id: 'j1111111-1111-1111-1111-111111111111',
  companyId: mockCompany.id,
  companyName: 'Acme Corp',
  title: 'Senior Frontend Developer',
  location: 'TP. Hồ Chí Minh',
  jobType: 'FULL_TIME',
  workplaceMode: 'HYBRID',
  salary: { min: 20000000, max: 35000000, currency: 'VND' },
  deadline: '2026-12-31T23:59:00+07:00',
  description:
    'Chúng tôi đang tìm kiếm Senior Frontend Developer có kinh nghiệm chuyên sâu về React và TypeScript để xây dựng hệ thống quy mô lớn.',
  headcount: 2,
  status: 'DRAFT',
  skillIds: ['s1', 's2'],
  skills: [mockSkills[0]!, mockSkills[1]!],
  version: 3,
  publishedAt: null,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
};

describe('JobFormPage (UI18)', () => {
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
    vi.mocked(recruiterJobsApi.getSkills).mockResolvedValue(mockSkills);
  });

  it('FE28: Lưu nháp cho phép thiếu trường bắt buộc', async () => {
    vi.mocked(recruiterJobsApi.createJob).mockResolvedValue({
      ...mockExistingJob,
      title: 'Nháp Frontend',
      description: '',
      deadline: '',
    });

    render(
      <MemoryRouter initialEntries={['/recruiter/jobs/new']}>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
          <Route path="/recruiter/jobs" element={<div>Jobs List Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ui18-job-create')).toBeInTheDocument();
    });

    // Only enter title, omit description, location, deadline
    fireEvent.change(screen.getByTestId('job-title-input'), {
      target: { value: 'Nháp Frontend' },
    });

    fireEvent.click(screen.getByTestId('save-draft-btn'));

    await waitFor(() => {
      expect(recruiterJobsApi.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: mockCompany.id,
          title: 'Nháp Frontend',
        }),
      );
    });

    // Navigates to jobs list
    expect(await screen.findByText('Jobs List Screen')).toBeInTheDocument();
  });

  it('FE28: Công bố ngay kiểm tra bắt buộc tất cả các trường còn thiếu', async () => {
    render(
      <MemoryRouter initialEntries={['/recruiter/jobs/new']}>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ui18-job-create')).toBeInTheDocument();
    });

    // Form is empty, try to Publish immediately
    fireEvent.click(screen.getByTestId('publish-btn'));

    // Should display all field errors
    expect(screen.getByTestId('error-title')).toHaveTextContent(
      'Vui lòng nhập tiêu đề tin tuyển dụng',
    );
    expect(screen.getByTestId('error-description')).toHaveTextContent(
      'Vui lòng nhập mô tả công việc',
    );
    expect(screen.getByTestId('error-location')).toHaveTextContent('Địa điểm làm việc là bắt buộc');
    expect(screen.getByTestId('error-deadline')).toHaveTextContent('Vui lòng chọn hạn nộp hồ sơ');

    expect(recruiterJobsApi.createJob).not.toHaveBeenCalled();
    expect(recruiterJobsApi.publishJob).not.toHaveBeenCalled();
  });

  it('FE29: deadline quá khứ báo lỗi; lương min > max báo lỗi', async () => {
    render(
      <MemoryRouter initialEntries={['/recruiter/jobs/new']}>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ui18-job-create')).toBeInTheDocument();
    });

    // Enter valid title & description
    fireEvent.change(screen.getByTestId('job-title-input'), {
      target: { value: 'Senior Frontend Engineer Position' },
    });
    fireEvent.change(screen.getByTestId('job-location-input'), {
      target: { value: 'TP. Hồ Chí Minh' },
    });
    fireEvent.change(screen.getByTestId('job-description-input'), {
      target: {
        value:
          'Mô tả công việc chi tiết dành cho vị trí Senior Frontend Engineer với hơn một trăm ký tự văn bản yêu cầu.',
      },
    });

    // Set past deadline
    fireEvent.change(screen.getByTestId('job-deadline-input'), {
      target: { value: '2020-01-01T12:00' },
    });

    // Uncheck negotiable salary and set min > max
    fireEvent.click(screen.getByTestId('job-salary-negotiable-checkbox'));
    fireEvent.change(screen.getByTestId('salary-min-input'), {
      target: { value: '30000000' },
    });
    fireEvent.change(screen.getByTestId('salary-max-input'), {
      target: { value: '15000000' },
    });

    fireEvent.click(screen.getByTestId('publish-btn'));

    // Verify errors
    expect(screen.getByTestId('error-deadline')).toHaveTextContent(
      'Hạn nộp hồ sơ phải ở tương lai so với thời điểm hiện tại (BR02, FE29)',
    );
    expect(screen.getByTestId('error-salary')).toHaveTextContent(
      'Lương tối thiểu không được lớn hơn lương tối đa (FE29)',
    );

    expect(recruiterJobsApi.publishJob).not.toHaveBeenCalled();
  });

  it('FE29 & BR01: phản hồi 409 Conflict giữ nguyên nội dung người dùng đang nhập dở', async () => {
    vi.mocked(recruiterJobsApi.getJobDetail).mockResolvedValue(mockExistingJob);
    vi.mocked(recruiterJobsApi.updateJob).mockRejectedValue(
      new ApiException(409, { code: 'VERSION_MISMATCH', message: 'Version conflict' }),
    );

    render(
      <MemoryRouter initialEntries={[`/recruiter/jobs/${mockExistingJob.id}/edit`]}>
        <Routes>
          <Route path="/recruiter/jobs/:id/edit" element={<JobFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('job-title-input')).toHaveValue(mockExistingJob.title);
    });

    // User edits title
    const modifiedTitle = 'Senior Frontend Developer - Specialization React 19';
    fireEvent.change(screen.getByTestId('job-title-input'), {
      target: { value: modifiedTitle },
    });

    // Submit save draft
    fireEvent.click(screen.getByTestId('save-draft-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('conflict-alert')).toBeInTheDocument();
    });

    // Form value MUST STILL be the user's modified text! (Not reset)
    expect(screen.getByTestId('job-title-input')).toHaveValue(modifiedTitle);
  });

  it('shows dirty form confirm dialog when clicking Cancel after modifying inputs', async () => {
    render(
      <MemoryRouter initialEntries={['/recruiter/jobs/new']}>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
          <Route path="/recruiter/jobs" element={<div>Jobs List Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ui18-job-create')).toBeInTheDocument();
    });

    // Modify title
    fireEvent.change(screen.getByTestId('job-title-input'), {
      target: { value: 'Something Changed' },
    });

    // Click Cancel
    fireEvent.click(screen.getByTestId('cancel-btn'));

    // Confirm dialog should appear
    expect(screen.getByText('Xác nhận hủy bỏ thay đổi')).toBeInTheDocument();
    expect(screen.getByText(/Bạn có thay đổi chưa được lưu trên biểu mẫu/i)).toBeInTheDocument();

    // Click confirm to exit
    fireEvent.click(screen.getByText('Rời khỏi trang'));

    expect(await screen.findByText('Jobs List Screen')).toBeInTheDocument();
  });

  it('hiển thị bộ đếm ký tự và cảnh báo dưới 100 ký tự khi người dùng nhập mô tả ngắn (ví dụ "123")', async () => {
    render(
      <MemoryRouter initialEntries={['/recruiter/jobs/new']}>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ui18-job-create')).toBeInTheDocument();
    });

    const descInput = screen.getByTestId('job-description-input');
    const descCounter = screen.getByTestId('desc-char-counter');

    // Initially 0 chars
    expect(descCounter).toHaveTextContent('0 / 100 ký tự tối thiểu');

    // Type "123" like the user screenshot
    fireEvent.change(descInput, { target: { value: '123' } });
    expect(descCounter).toHaveTextContent('3 / 100 ký tự tối thiểu (cần thêm 97 ký tự để công bố)');

    // Click "Công bố ngay"
    fireEvent.click(screen.getByTestId('publish-btn'));

    // Error banners should appear informing user of requirements
    expect(screen.getByTestId('error-description')).toHaveTextContent(
      'Mô tả công việc phải từ 100 đến 10.000 ký tự',
    );
    expect(screen.getByTestId('bottom-form-error-alert')).toBeInTheDocument();
    expect(screen.getByTestId('bottom-form-error-alert')).toHaveTextContent(
      'Mô tả công việc hiện chưa đủ 100 ký tự',
    );

    // API should not be called
    expect(recruiterJobsApi.createJob).not.toHaveBeenCalled();
    expect(recruiterJobsApi.publishJob).not.toHaveBeenCalled();
  });

  it('công bố ngay thành công khi mô tả >= 100 ký tự và gửi payload salaryMin/salaryMax chính xác', async () => {
    vi.mocked(recruiterJobsApi.createJob).mockResolvedValue({
      ...mockExistingJob,
      id: 'job-new-123',
      version: 1,
    });
    vi.mocked(recruiterJobsApi.publishJob).mockResolvedValue({
      ...mockExistingJob,
      id: 'job-new-123',
      status: 'PUBLISHED',
      version: 2,
    });

    render(
      <MemoryRouter initialEntries={['/recruiter/jobs/new']}>
        <Routes>
          <Route path="/recruiter/jobs/new" element={<JobFormPage />} />
          <Route path="/recruiter/jobs" element={<div>Jobs List Screen</div>} />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('ui18-job-create')).toBeInTheDocument();
    });

    // Enter valid inputs
    fireEvent.change(screen.getByTestId('job-title-input'), {
      target: { value: 'Tuyển dụng Kỹ sư Backend Go/NestJS chuyên sâu' },
    });
    fireEvent.change(screen.getByTestId('job-location-input'), {
      target: { value: 'Quận 1, TP. Hồ Chí Minh' },
    });
    fireEvent.change(screen.getByTestId('job-deadline-input'), {
      target: { value: '2026-12-31T18:00' },
    });

    const validDescription =
      'Chúng tôi đang tìm kiếm kỹ sư Backend tài năng với chuyên môn sâu về Go và NestJS. ' +
      'Trách nhiệm bao gồm phát triển hệ thống microservices quy mô cao, tối ưu hóa cơ sở dữ liệu và bảo mật dữ liệu doanh nghiệp.';
    fireEvent.change(screen.getByTestId('job-description-input'), {
      target: { value: validDescription },
    });

    expect(screen.getByTestId('desc-char-counter')).toHaveTextContent('✓ Đủ điều kiện công bố');

    // Uncheck negotiable salary and enter min/max
    fireEvent.click(screen.getByTestId('job-salary-negotiable-checkbox'));
    fireEvent.change(screen.getByTestId('salary-min-input'), {
      target: { value: '20000000' },
    });
    fireEvent.change(screen.getByTestId('salary-max-input'), {
      target: { value: '35000000' },
    });

    // Click "Công bố ngay"
    fireEvent.click(screen.getByTestId('publish-btn'));

    await waitFor(() => {
      expect(recruiterJobsApi.createJob).toHaveBeenCalledWith(
        expect.objectContaining({
          companyId: mockCompany.id,
          title: 'Tuyển dụng Kỹ sư Backend Go/NestJS chuyên sâu',
          location: 'Quận 1, TP. Hồ Chí Minh',
          salaryMin: 20000000,
          salaryMax: 35000000,
          currency: 'VND',
        }),
      );
      expect(recruiterJobsApi.publishJob).toHaveBeenCalledWith(
        'job-new-123',
        expect.objectContaining({
          version: 1,
        }),
      );
    });

    expect(await screen.findByText('Jobs List Screen')).toBeInTheDocument();
  });
});
