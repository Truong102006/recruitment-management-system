import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { RecruiterStatisticsPage } from './recruiter-statistics-page';
import { statisticsApi } from '../api/statistics.api';
import * as CompanyContextModule from '../../companies/context/company-context';
import type { CompanyDto } from '@rms/contracts/public';
import type { RecruitmentFunnelDto } from '../../../lib/mocks/dev-mock-store';

vi.mock('../api/statistics.api');

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

const mockFunnelZeroApplications: RecruitmentFunnelDto = {
  submitted: 0,
  screening: 0,
  interviewed: 0,
  hired: 0,
  rejected: 0,
  rates: {
    submittedToScreening: 0,
    screeningToInterviewed: 0,
    interviewedToHired: 0,
    overallHiredRate: 0,
  },
  asOf: '2026-10-23T15:00:00Z',
  period: '30 ngày qua',
};

const mockFunnelNormalData: RecruitmentFunnelDto = {
  submitted: 100,
  screening: 50,
  interviewed: 20,
  hired: 5,
  rejected: 30,
  rates: {
    submittedToScreening: 50.0,
    screeningToInterviewed: 40.0,
    interviewedToHired: 25.0,
    overallHiredRate: 5.0,
  },
  asOf: '2026-10-23T15:00:00Z',
  period: '30 ngày qua',
};

describe('RecruiterStatisticsPage (UI25, FE38)', () => {
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

  it('renders recruitment funnel statistics and asOf timestamp correctly', async () => {
    vi.mocked(statisticsApi.getRecruitmentFunnel).mockResolvedValue(mockFunnelNormalData);

    render(
      <MemoryRouter>
        <RecruiterStatisticsPage />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('ui25-statistics')).toBeInTheDocument();
    expect(screen.getByText('Thống kê Tuyển dụng (UI25)')).toBeInTheDocument();
    expect(screen.getByTestId('count-submitted')).toHaveTextContent('100');
    expect(screen.getByTestId('count-hired')).toHaveTextContent('5');
    expect(screen.getByTestId('statistics-asof')).toBeInTheDocument();
  });

  it('FE38: handles zero applications safely without showing NaN% or Infinity%', async () => {
    vi.mocked(statisticsApi.getRecruitmentFunnel).mockResolvedValue(mockFunnelZeroApplications);

    render(
      <MemoryRouter>
        <RecruiterStatisticsPage />
      </MemoryRouter>,
    );

    await screen.findByTestId('ui25-statistics');

    // Confirm all percentage texts are safe and never NaN or Infinity
    const bodyText = document.body.textContent ?? '';
    expect(bodyText).not.toContain('NaN');
    expect(bodyText).not.toContain('Infinity');
    expect(screen.getByTestId('overall-hired-rate')).toHaveTextContent('0.0%');
  });

  it('FE38: contains parallel HTML table for full accessibility compliance', async () => {
    vi.mocked(statisticsApi.getRecruitmentFunnel).mockResolvedValue(mockFunnelNormalData);

    render(
      <MemoryRouter>
        <RecruiterStatisticsPage />
      </MemoryRouter>,
    );

    const a11yTable = await screen.findByTestId('statistics-html-table');
    expect(a11yTable).toBeInTheDocument();
    expect(screen.getByText('1. Đã nộp hồ sơ (Submitted)')).toBeInTheDocument();
    expect(screen.getByText('4. Trúng tuyển chính thức (Hired)')).toBeInTheDocument();
  });

  it('FE38: validates maximum period limit of 366 days in custom date range', async () => {
    vi.mocked(statisticsApi.getRecruitmentFunnel).mockResolvedValue(mockFunnelNormalData);

    render(
      <MemoryRouter>
        <RecruiterStatisticsPage />
      </MemoryRouter>,
    );

    await screen.findByTestId('ui25-statistics');

    // Open custom date range form
    fireEvent.click(screen.getByTestId('toggle-custom-range-btn'));

    const startInput = screen.getByTestId('custom-start-date-input');
    const endInput = screen.getByTestId('custom-end-date-input');

    // Range > 366 days: 2024-01-01 to 2025-06-01 (approx 517 days)
    fireEvent.change(startInput, { target: { value: '2024-01-01' } });
    fireEvent.change(endInput, { target: { value: '2025-06-01' } });

    fireEvent.click(screen.getByTestId('apply-custom-range-btn'));

    expect(screen.getByTestId('date-range-error-alert')).toBeInTheDocument();
    expect(
      screen.getByText(/Khoảng thời gian thống kê tối đa không được vượt quá 366 ngày/i),
    ).toBeInTheDocument();
  });
});
