import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCompanyContext } from '../../../companies/context/company-context';
import { recruiterJobsApi } from '../api/recruiter-jobs.api';
import { DataTable, type ColumnDef } from '../../../../components/data-table/data-table';
import { StatusBadge } from '../../../../components/ui/status-badge';
import { Dialog } from '../../../../components/ui/dialog';
import { ApiException } from '../../../../lib/http/api-client';
import type { JobSummaryDto, JobPostStatus } from '@rms/contracts/public';

export const RecruiterJobsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentCompanyId, currentCompany } = useCompanyContext();
  const [jobs, setJobs] = useState<JobSummaryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'ALL' | JobPostStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Close Job Modal state (BR04, FE27)
  const [closeTarget, setCloseTarget] = useState<JobSummaryDto | null>(null);
  const [closeReason, setCloseReason] = useState<string>('');
  const [closing, setClosing] = useState<boolean>(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Publish Draft Confirm Modal state
  const [publishTarget, setPublishTarget] = useState<JobSummaryDto | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!currentCompanyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await recruiterJobsApi.getCompanyJobs(currentCompanyId, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: searchQuery.trim() || undefined,
      });
      setJobs(response.data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải danh sách tin tuyển dụng');
      } else {
        setError('Đã có lỗi xảy ra');
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, statusFilter, searchQuery]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  const handleConfirmCloseJob = async () => {
    if (!closeTarget) return;
    const trimmedReason = closeReason.trim();
    if (!trimmedReason) {
      setCloseError('Vui lòng nhập lý do đóng tin tuyển dụng.');
      return;
    }

    setClosing(true);
    setCloseError(null);

    try {
      // Need full job detail to get the version
      const detail = await recruiterJobsApi.getJobDetail(
        closeTarget.id,
        currentCompanyId || undefined,
      );
      await recruiterJobsApi.closeJob(closeTarget.id, {
        version: detail.version,
        reason: trimmedReason,
      });
      setCloseTarget(null);
      setCloseReason('');
      setSuccessMessage(`Đã đóng tin tuyển dụng "${closeTarget.title}" thành công.`);
      await loadJobs();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setCloseError(err.message || 'Không thể đóng tin tuyển dụng');
      } else {
        setCloseError('Đã có lỗi xảy ra khi đóng tin');
      }
    } finally {
      setClosing(false);
    }
  };

  const handleConfirmPublishJob = async () => {
    if (!publishTarget) return;

    // Check company approval status (BR02, FE26)
    if (currentCompany?.approvalStatus !== 'APPROVED') {
      setPublishError(
        'Doanh nghiệp chưa được phê duyệt (APPROVED), không thể công bố tin tuyển dụng (BR02).',
      );
      return;
    }

    setPublishing(true);
    setPublishError(null);

    try {
      const detail = await recruiterJobsApi.getJobDetail(
        publishTarget.id,
        currentCompanyId || undefined,
      );
      await recruiterJobsApi.publishJob(publishTarget.id, {
        version: detail.version,
        deadline: detail.deadline,
      });
      setPublishTarget(null);
      setSuccessMessage(`Công bố tin "${publishTarget.title}" thành công.`);
      await loadJobs();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setPublishError(err.message || 'Không thể công bố tin tuyển dụng');
      } else {
        setPublishError('Đã có lỗi xảy ra');
      }
    } finally {
      setPublishing(false);
    }
  };

  const formatDeadline = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  const formatSalary = (salary: JobSummaryDto['salary']) => {
    if (!salary || (!salary.min && !salary.max)) {
      return 'Thỏa thuận';
    }
    const fmt = new Intl.NumberFormat('vi-VN');
    return `${fmt.format(salary.min)} - ${fmt.format(salary.max)} ${salary.currency}`;
  };

  const columns = useMemo<ColumnDef<JobSummaryDto>[]>(
    () => [
      {
        key: 'title',
        header: 'Vị trí tuyển dụng',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.title}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              {row.jobType} • {row.workplaceMode} • {row.location}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        key: 'salary',
        header: 'Mức lương',
        render: (row) => formatSalary(row.salary),
      },
      {
        key: 'deadline',
        header: 'Hạn nộp hồ sơ',
        render: (row) => formatDeadline(row.deadline),
        sortable: true,
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (row) => <StatusBadge status={row.status} size="sm" />,
      },
      {
        key: 'actions',
        header: 'Thao tác',
        render: (row) => {
          const isClosed = row.status === 'CLOSED';
          const isDraft = row.status === 'DRAFT';
          const isPublished = row.status === 'PUBLISHED';

          return (
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              {/* Sửa tin: disabled if CLOSED */}
              {!isClosed ? (
                <button
                  type="button"
                  data-testid={`edit-job-btn-${row.id}`}
                  onClick={() => navigate(`/recruiter/jobs/${row.id}/edit`)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-border)',
                    background: 'transparent',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Sửa
                </button>
              ) : (
                <span
                  data-testid={`closed-job-no-edit-${row.id}`}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                    fontStyle: 'italic',
                  }}
                >
                  Đã khóa
                </span>
              )}

              {/* Nút Công bố cho DRAFT */}
              {isDraft && (
                <button
                  type="button"
                  data-testid={`publish-job-btn-${row.id}`}
                  onClick={() => setPublishTarget(row)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-success)',
                    background: 'var(--color-success-subtle)',
                    color: 'var(--color-success)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Công bố
                </button>
              )}

              {/* Nút Đóng tin cho PUBLISHED */}
              {isPublished && (
                <button
                  type="button"
                  data-testid={`close-job-btn-${row.id}`}
                  onClick={() => setCloseTarget(row)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-danger)',
                    background: 'var(--color-danger-subtle)',
                    color: 'var(--color-danger)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Đóng tin
                </button>
              )}

              {/* BR04 & FE27 Check: Tin CLOSED TUYỆT ĐỐI KHÔNG có nút mở lại tin! */}
            </div>
          );
        },
      },
    ],
    [navigate],
  );

  if (!currentCompanyId) {
    return (
      <div className="recruiter-jobs-page" data-testid="ui17-jobs-list" style={{ padding: '2rem' }}>
        <h2>Quản lý Tin tuyển dụng</h2>
        <p data-testid="ui17-jobs-empty">
          Vui lòng chọn doanh nghiệp hoạt động để xem danh sách tin tuyển dụng.
        </p>
      </div>
    );
  }

  return (
    <div
      className="recruiter-jobs-page"
      data-testid="ui17-jobs-list"
      style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Quản lý Tin tuyển dụng
          </h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            Toàn bộ tin tuyển dụng (nháp, công bố, đã đóng) của công ty.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px', background: 'var(--soft)', padding: '3px', borderRadius: '10px' }}>
            <button
              type="button"
              className={`btn sm ${viewMode === 'table' ? 'primary' : ''}`}
              onClick={() => setViewMode('table')}
            >
              Bảng dữ liệu
            </button>
            <button
              type="button"
              className={`btn sm ${viewMode === 'cards' ? 'primary' : ''}`}
              onClick={() => setViewMode('cards')}
            >
              Thẻ việc làm
            </button>
          </div>
          <Link
            to="/recruiter/jobs/new"
            data-testid="create-job-btn"
            className="btn primary sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
            }}
          >
            + Đăng tin mới
          </Link>
        </div>
      </div>

      {/* Success notification */}
      {successMessage && (
        <div
          data-testid="success-alert"
          style={{
            padding: '12px 18px',
            background: 'var(--p2b)',
            border: '1px solid var(--green)',
            borderRadius: '12px',
            marginBottom: '1rem',
            color: 'var(--green)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Error notification */}
      {error && (
        <div
          data-testid="jobs-error-alert"
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

      {/* Status Filter Tabs & Search */}
      <div
        className="card"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          backgroundColor: 'var(--card)',
          padding: '12px 16px',
          borderRadius: '16px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--sh-s)',
        }}
      >
        <div className="tabs" style={{ margin: 0 }}>
          {(['ALL', 'DRAFT', 'PUBLISHED', 'CLOSED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              className={statusFilter === status ? 'on' : ''}
              data-testid={`filter-tab-${status.toLowerCase()}`}
              onClick={() => setStatusFilter(status)}
              style={{ padding: '6px 12px', fontSize: '13px', fontWeight: statusFilter === status ? 600 : 400 }}
            >
              {status === 'ALL'
                ? 'Tất cả'
                : status === 'DRAFT'
                  ? 'Bản nháp'
                  : status === 'PUBLISHED'
                    ? 'Đang công bố'
                    : 'Đã đóng'}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '240px', flex: '0 1 300px' }}>
          <input
            type="text"
            data-testid="jobs-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tiêu đề tin..."
            style={{
              width: '100%',
              padding: '8px 12px',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              backgroundColor: 'var(--card)',
              fontSize: '13.5px',
              color: 'var(--ink)',
            }}
          />
        </div>
      </div>

      {viewMode === 'cards' ? (
        /* Talento Job Cards Grid */
        jobs.length === 0 ? (
          <div className="card empty" style={{ padding: '40px 16px', textAlign: 'center' }}>
            Không có tin tuyển dụng nào phù hợp.
          </div>
        ) : (
          <div className="jgrid" style={{ marginBottom: '1.5rem' }}>
            {jobs.map((job) => (
              <article key={job.id} className="card jc">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'flex-start' }}>
                  <h4 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--ink)' }}>{job.title}</h4>
                  <StatusBadge status={job.status} size="sm" />
                </div>
                <div className="meta" style={{ fontSize: '12.5px', color: 'var(--muted)' }}>
                  {job.location} • {job.workplaceMode} • {job.jobType}
                </div>
                {job.salary && (
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--blue)' }}>
                    {formatSalary(job.salary)}
                  </div>
                )}
                <div className="acts" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                  <button
                    type="button"
                    className="btn sm"
                    onClick={() => navigate(`/recruiter/jobs/${job.id}`)}
                  >
                    Xem chi tiết
                  </button>
                  {job.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      className="btn sm danger"
                      onClick={() => setCloseTarget(job)}
                    >
                      Đóng tin
                    </button>
                  )}
                  {job.status === 'DRAFT' && (
                    <button
                      type="button"
                      className="btn sm primary"
                      onClick={() => setPublishTarget(job)}
                    >
                      Công bố tin
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )
      ) : (
        /* DataTable */
        <DataTable
          data={jobs}
          columns={columns}
          keyExtractor={(item) => item.id}
          loading={loading}
          emptyMessage="Không có tin tuyển dụng nào phù hợp."
        />
      )}

      {/* Dialog Đóng tin (BR04, FE27) */}
      <Dialog
        open={Boolean(closeTarget)}
        onClose={() => setCloseTarget(null)}
        title="Đóng tin tuyển dụng"
        description="Quy tắc nghiệp vụ: Tin sau khi đóng (CLOSED) sẽ dừng tiếp nhận hồ sơ mới và không thể mở lại."
      >
        <div data-testid="close-job-dialog-content">
          {closeError && (
            <div
              data-testid="close-job-error"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {closeError}
            </div>
          )}

          <p style={{ margin: '0 0 1rem', fontSize: '0.95rem' }}>
            Bạn đang chuẩn bị đóng tin: <strong>{closeTarget?.title}</strong>.
            <br />
            <span style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>
              Lưu ý: Hành động này không thể hoàn tác (BR04).
            </span>
          </p>

          <div style={{ marginBottom: '1.25rem' }}>
            <label
              htmlFor="close-job-reason"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Lý do đóng tin <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              id="close-job-reason"
              data-testid="close-job-reason-input"
              rows={3}
              required
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="VD: Đã tuyển đủ chỉ tiêu hoặc tạm hoãn kế hoạch tuyển dụng..."
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setCloseTarget(null)}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              data-testid="confirm-close-job-btn"
              disabled={closing || !closeReason.trim()}
              onClick={() => void handleConfirmCloseJob()}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-danger)',
                color: '#fff',
                fontWeight: 600,
                cursor: closing || !closeReason.trim() ? 'not-allowed' : 'pointer',
                opacity: closing || !closeReason.trim() ? 0.6 : 1,
              }}
            >
              {closing ? 'Đang xử lý...' : 'Xác nhận đóng tin'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Dialog Công bố tin nháp */}
      <Dialog
        open={Boolean(publishTarget)}
        onClose={() => setPublishTarget(null)}
        title="Công bố tin tuyển dụng"
        description="Tin tuyển dụng sẽ được chuyển sang trạng thái PUBLISHED và hiển thị công khai cho ứng viên nộp hồ sơ."
      >
        <div data-testid="publish-job-dialog-content">
          {publishError && (
            <div
              data-testid="publish-job-error"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {publishError}
            </div>
          )}

          <p style={{ margin: '0 0 1.25rem', fontSize: '0.95rem' }}>
            Bạn có chắc chắn muốn công bố tin tuyển dụng <strong>{publishTarget?.title}</strong>?
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setPublishTarget(null)}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="button"
              data-testid="confirm-publish-job-btn"
              disabled={publishing}
              onClick={() => void handleConfirmPublishJob()}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-success)',
                color: '#fff',
                fontWeight: 600,
                cursor: publishing ? 'not-allowed' : 'pointer',
                opacity: publishing ? 0.7 : 1,
              }}
            >
              {publishing ? 'Đang công bố...' : 'Xác nhận công bố'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
