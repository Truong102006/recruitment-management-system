import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyContext } from '../../companies/context/company-context';
import { applicationsApi } from '../api/applications.api';
import { recruiterJobsApi } from '../../jobs/recruiter/api/recruiter-jobs.api';
import { DataTable, type ColumnDef } from '../../../components/data-table/data-table';
import { StatusBadge } from '../../../components/ui/status-badge';
import { ApiException } from '../../../lib/http/api-client';
import type { ApplicationStatus, JobSummaryDto } from '@rms/contracts/public';
import type { DevApplicationItem } from '../../../lib/mocks/dev-mock-store';

const STATUS_OPTIONS: { value: 'ALL' | ApplicationStatus; label: string }[] = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'SUBMITTED', label: 'Đã nộp (SUBMITTED)' },
  { value: 'SCREENING', label: 'Sàng lọc (SCREENING)' },
  { value: 'SHORTLISTED', label: 'Danh sách ngắn (SHORTLISTED)' },
  { value: 'INTERVIEW_SCHEDULED', label: 'Đã xếp lịch (INTERVIEW_SCHEDULED)' },
  { value: 'INTERVIEWED', label: 'Đã phỏng vấn (INTERVIEWED)' },
  { value: 'HIRED', label: 'Trúng tuyển (HIRED)' },
  { value: 'REJECTED', label: 'Từ chối (REJECTED)' },
  { value: 'WITHDRAWN', label: 'Đã rút (WITHDRAWN)' },
];

export const RecruiterApplicationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompanyId } = useCompanyContext();

  const [applications, setApplications] = useState<DevApplicationItem[]>([]);
  const [jobs, setJobs] = useState<JobSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedJobId, setSelectedJobId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | ApplicationStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Load company jobs for filter dropdown
  useEffect(() => {
    if (!currentCompanyId) return;
    void recruiterJobsApi
      .getCompanyJobs(currentCompanyId)
      .then((res) => setJobs(res.data))
      .catch(() => setJobs([]));
  }, [currentCompanyId]);

  // 2. Load applications based on company & filters (FE30: Scope per company)
  const loadApplications = useCallback(async () => {
    if (!currentCompanyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await applicationsApi.getCompanyApplications(currentCompanyId, {
        jobId: selectedJobId === 'ALL' ? undefined : selectedJobId,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
        q: searchQuery.trim() || undefined,
      });
      setApplications(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải danh sách hồ sơ ứng viên');
      } else {
        setError('Đã có lỗi xảy ra khi tải danh sách hồ sơ');
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, selectedJobId, selectedStatus, searchQuery]);

  useEffect(() => {
    void loadApplications();
  }, [loadApplications]);

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  const columns = useMemo<ColumnDef<DevApplicationItem>[]>(
    () => [
      {
        key: 'candidate',
        header: 'Ứng viên',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
              {row.candidateSnapshot.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {row.candidateSnapshot.email}{' '}
              {row.candidateSnapshot.phone ? `• ${row.candidateSnapshot.phone}` : ''}
            </div>
            {row.candidateSnapshot.headline && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--color-text-secondary)',
                  marginTop: '2px',
                }}
              >
                {row.candidateSnapshot.headline}
              </div>
            )}
          </div>
        ),
        sortable: true,
      },
      {
        key: 'job',
        header: 'Vị trí ứng tuyển',
        render: (row) => (
          <span style={{ fontWeight: 500 }}>{row.jobTitle || 'Vị trí công việc'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (row) => <StatusBadge status={row.status} size="sm" />,
      },
      {
        key: 'cv',
        header: 'Phiên bản CV',
        render: (row) => (
          <div>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.8rem',
                background: 'var(--color-bg-secondary)',
                padding: '2px 6px',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
              }}
            >
              {row.currentCvVersionId}
            </span>
            {row.pendingCvChange && (
              <div style={{ marginTop: '4px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#b45309',
                    background: '#fef3c7',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}
                >
                  ⚡ Có đề nghị đổi CV
                </span>
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'submittedAt',
        header: 'Thời điểm nộp',
        render: (row) => formatDate(row.submittedAt),
        sortable: true,
      },
      {
        key: 'actions',
        header: 'Thao tác',
        render: (row) => (
          <button
            type="button"
            data-testid={`view-application-btn-${row.applicationId}`}
            onClick={() => navigate(`/recruiter/applications/${row.applicationId}`)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-primary)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Chi tiết hồ sơ →
          </button>
        ),
      },
    ],
    [navigate],
  );

  if (!currentCompanyId) {
    return (
      <div
        className="recruiter-applications-page"
        data-testid="ui19-applications-list"
        style={{ padding: '2rem' }}
      >
        <h2>Quản lý Hồ sơ Tuyển dụng</h2>
        <p data-testid="ui19-applications-empty">
          Vui lòng chọn doanh nghiệp hoạt động để xem danh sách hồ sơ ứng viên.
        </p>
      </div>
    );
  }

  return (
    <div
      className="recruiter-applications-page"
      data-testid="ui19-applications-list"
      style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Hồ sơ Ứng viên (UI19)</h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
          Quản lý toàn bộ hồ sơ ứng tuyển, lọc theo vị trí tuyển dụng và trạng thái xét duyệt
          (FE30).
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div
          data-testid="applications-error-alert"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.25rem',
          background: 'var(--color-bg-surface)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div>
          <label
            htmlFor="filter-job"
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '0.3rem',
            }}
          >
            Vị trí tuyển dụng
          </label>
          <select
            id="filter-job"
            data-testid="filter-job-select"
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
            }}
          >
            <option value="ALL">Tất cả vị trí tin tuyển dụng</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="filter-status"
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '0.3rem',
            }}
          >
            Trạng thái xét duyệt
          </label>
          <select
            id="filter-status"
            data-testid="filter-status-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'ALL' | ApplicationStatus)}
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
            }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="search-input"
            style={{
              display: 'block',
              fontSize: '0.85rem',
              fontWeight: 600,
              marginBottom: '0.3rem',
            }}
          >
            Tìm kiếm ứng viên
          </label>
          <input
            id="search-input"
            data-testid="applications-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tên, email, headline..."
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
            }}
          />
        </div>
      </div>

      {/* Applications DataTable */}
      <DataTable
        data={applications}
        columns={columns}
        keyExtractor={(item) => item.applicationId}
        loading={loading}
        emptyMessage="Không tìm thấy hồ sơ ứng viên nào phù hợp với bộ lọc."
      />
    </div>
  );
};
