import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCompanyContext } from '../../companies/context/company-context';
import { applicationsApi } from '../api/applications.api';
import { recruiterJobsApi } from '../../jobs/recruiter/api/recruiter-jobs.api';
import { DataTable, type ColumnDef } from '../../../components/data-table/data-table';
import { StatusBadge } from '../../../components/ui/status-badge';
import { ApiException } from '../../../lib/http/api-client';
import { burst } from '../../../lib/talento-effects';
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
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

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

  const KANBAN_STAGES = [
    { id: 'SUBMITTED', name: 'Ứng tuyển', color: 'var(--cyan)' },
    { id: 'SCREENING', name: 'Sàng lọc', color: 'var(--blue)' },
    { id: 'SHORTLISTED', name: 'Danh sách ngắn', color: '#8b5cf6' },
    { id: 'INTERVIEWS', name: 'Phỏng vấn', color: 'var(--amber)', statuses: ['INTERVIEW_SCHEDULED', 'INTERVIEWED'] },
    { id: 'HIRED', name: 'Trúng tuyển', color: 'var(--green)' },
    { id: 'REJECTED', name: 'Từ chối', color: 'var(--red)', statuses: ['REJECTED', 'WITHDRAWN'] },
  ];

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const p1 = parts[parts.length - 2] ?? '';
      const p2 = parts[parts.length - 1] ?? '';
      return `${p1.charAt(0)}${p2.charAt(0)}`.toUpperCase();
    }
    const single = parts[0] ?? '';
    return single.slice(0, 2).toUpperCase();
  };

  const getPalIndex = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return hash % 5;
  };

  return (
    <div
      className="recruiter-applications-page"
      data-testid="ui19-applications-list"
      style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 600,
              fontFamily: 'var(--font-d)',
              letterSpacing: '-0.02em',
              color: 'var(--ink)',
              margin: 0,
            }}
          >
            Hồ sơ Ứng viên (UI19)
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' }}>
            Quản lý toàn bộ hồ sơ ứng tuyển, lọc theo vị trí tuyển dụng và trạng thái xét duyệt (FE30).
          </p>
        </div>

        {/* View Mode Switcher */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className={`btn sm ${viewMode === 'table' ? 'primary' : ''}`}
            onClick={() => setViewMode('table')}
          >
            Bảng dữ liệu
          </button>
          <button
            type="button"
            className={`btn sm ${viewMode === 'kanban' ? 'primary' : ''}`}
            onClick={() => setViewMode('kanban')}
          >
            Quy trình Kanban
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div
          data-testid="applications-error-alert"
          style={{
            padding: '12px 18px',
            background: 'var(--p3b)',
            border: '1px solid var(--red)',
            borderRadius: '12px',
            marginBottom: '1rem',
            color: 'var(--red)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--card)',
          padding: '1.25rem',
          borderRadius: '18px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--sh-s)',
        }}
      >
        <div>
          <label
            htmlFor="filter-job"
            style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--ink2)',
              marginBottom: '6px',
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
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--card)',
              fontSize: '13.5px',
              color: 'var(--ink)',
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
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--ink2)',
              marginBottom: '6px',
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
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--card)',
              fontSize: '13.5px',
              color: 'var(--ink)',
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
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--ink2)',
              marginBottom: '6px',
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
              padding: '9px 12px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--card)',
              fontSize: '13.5px',
              color: 'var(--ink)',
            }}
          />
        </div>
      </div>

      {viewMode === 'kanban' ? (
        /* Talento Kanban Pipeline Board */
        <div className="board" style={{ marginTop: '1rem' }}>
          {KANBAN_STAGES.map((stage) => {
            const stageApps = applications.filter((app) =>
              stage.statuses ? stage.statuses.includes(app.status) : app.status === stage.id,
            );
            return (
              <div key={stage.id} className="col" data-stage={stage.id.toLowerCase()}>
                <div className="col-h" style={{ '--c': stage.color } as React.CSSProperties}>
                  <i className="sq" />
                  {stage.name}
                  <span className="n">{stageApps.length}</span>
                </div>
                {stageApps.length === 0 ? (
                  <div className="empty" style={{ padding: '24px 8px', fontSize: '12px' }}>
                    Chưa có hồ sơ
                  </div>
                ) : (
                  stageApps.map((app) => (
                    <article
                      key={app.applicationId}
                      className="kc"
                      tabIndex={0}
                      onClick={(e) => {
                        if (app.status === 'HIRED') {
                          burst(e.clientX, e.clientY, 32);
                        }
                        navigate(`/recruiter/applications/${app.applicationId}`);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <div className="kc-top">
                        <span className={`av p${getPalIndex(app.candidateSnapshot.name)}`} style={{ '--s': '32px' } as React.CSSProperties}>
                          {getInitials(app.candidateSnapshot.name)}
                        </span>
                        <div>
                          <b>{app.candidateSnapshot.name}</b>
                          <span className="j">{app.jobTitle || 'Vị trí công việc'}</span>
                        </div>
                      </div>
                      <div className="kc-meta">
                        <span className="chip" style={{ fontFamily: 'monospace' }}>
                          CV: {app.currentCvVersionId}
                        </span>
                        <StatusBadge status={app.status} size="sm" />
                      </div>
                      {app.pendingCvChange && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--amber)',
                            fontWeight: 600,
                            padding: '3px 6px',
                            background: 'var(--p1b)',
                            borderRadius: '6px',
                          }}
                        >
                          ⚡ Có đề nghị đổi CV
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* Applications DataTable */
        <DataTable
          data={applications}
          columns={columns}
          keyExtractor={(item) => item.applicationId}
          loading={loading}
          emptyMessage="Không tìm thấy hồ sơ ứng viên nào phù hợp với bộ lọc."
        />
      )}
    </div>
  );
};
