import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { DataTable, type ColumnDef } from '../../../components/data-table/data-table';
import { StatusBadge } from '../../../components/ui/status-badge';
import { Dialog } from '../../../components/ui/dialog';
import { ApiException } from '../../../lib/http/api-client';
import type { JobDetailDto } from '@rms/contracts/public';

export const AdminJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<JobDetailDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Close job dialog state
  const [closingJob, setClosingJob] = useState<JobDetailDto | null>(null);
  const [closeReason, setCloseReason] = useState<string>('');
  const [closeError, setCloseError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getJobs({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: searchQuery.trim() || undefined,
      });
      setJobs(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải danh sách tin tuyển dụng');
      } else {
        setError('Lỗi khi tải danh sách tin');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  // Handle Close Job Confirm
  const handleConfirmClose = async () => {
    if (!closingJob) return;
    const trimmed = closeReason.trim();
    if (!trimmed) {
      setCloseError('Vui lòng nhập lý do đóng tin tuyển dụng vi phạm.');
      return;
    }

    setSubmitting(true);
    setCloseError(null);
    try {
      await adminApi.closeJob(closingJob.id, {
        version: closingJob.version,
        reason: trimmed,
      });
      setSuccessMessage(`Đã đóng tin tuyển dụng "${closingJob.title}" thành công.`);
      setClosingJob(null);
      setCloseReason('');
      await loadJobs();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setCloseError(err.message || 'Không thể đóng tin tuyển dụng');
      } else {
        setCloseError('Lỗi khi đóng tin tuyển dụng');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<JobDetailDto>[]>(
    () => [
      {
        key: 'title',
        header: 'Tin tuyển dụng',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.title}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              Doanh nghiệp: <strong>{row.companyName}</strong> • v{row.version}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        key: 'location',
        header: 'Địa điểm / Hình thức',
        render: (row) => (
          <span style={{ fontSize: '0.85rem' }}>
            {row.location} ({row.workplaceMode})
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (row) => <StatusBadge status={row.status} size="sm" />,
      },
      {
        key: 'actions',
        header: 'Thao tác Admin',
        render: (row) => (
          <div>
            {row.status !== 'CLOSED' ? (
              <button
                type="button"
                data-testid={`admin-close-job-btn-${row.id}`}
                disabled={submitting}
                onClick={() => {
                  setClosingJob(row);
                  setCloseReason('');
                  setCloseError(null);
                }}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid #dc2626',
                  background: 'transparent',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng tin vi phạm
              </button>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Đã đóng</span>
            )}
          </div>
        ),
      },
    ],
    [submitting],
  );

  return (
    <div
      className="admin-jobs-page"
      data-testid="ui27-admin-jobs"
      style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          Kiểm duyệt Tin Tuyển dụng (UI27)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
          Đóng các tin tuyển dụng vi phạm chính sách hoặc phát hiện nội dung lừa đảo toàn hệ thống.
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          data-testid="success-alert"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--color-success-subtle)',
            border: '1px solid var(--color-success)',
            borderRadius: '8px',
            marginBottom: '1rem',
            color: 'var(--color-success)',
          }}
        >
          {successMessage}
        </div>
      )}

      {error && (
        <div
          data-testid="error-alert"
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

      {/* Filter Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          background: 'var(--color-bg-surface)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div>
          <label
            htmlFor="filter-job-status"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            Trạng thái tin
          </label>
          <select
            id="filter-job-status"
            data-testid="filter-job-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Tất cả</option>
            <option value="PUBLISHED">Đang tuyển (PUBLISHED)</option>
            <option value="DRAFT">Tin nháp (DRAFT)</option>
            <option value="CLOSED">Đã đóng (CLOSED)</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <label
            htmlFor="search-jobs-input"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            Tìm kiếm theo tiêu đề hoặc công ty
          </label>
          <input
            id="search-jobs-input"
            data-testid="search-jobs-input"
            type="text"
            placeholder="Tiêu đề tin, tên công ty..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Jobs DataTable */}
      <DataTable
        columns={columns}
        data={jobs}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc."
      />

      {/* Close Job Dialog */}
      <Dialog
        open={Boolean(closingJob)}
        onClose={() => setClosingJob(null)}
        title={`Đóng tin tuyển dụng vi phạm: ${closingJob?.title}`}
        description="Đóng tin sẽ chuyển trạng thái tin sang CLOSED ngay lập tức và hủy bỏ các lượt hiển thị trên trang chủ tìm việc."
      >
        <div style={{ padding: '0.5rem 0' }}>
          {closeError && (
            <div
              data-testid="close-error-alert"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {closeError}
            </div>
          )}
          <label
            htmlFor="close-reason-input"
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            Lý do đóng tin vi phạm <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="close-reason-input"
            data-testid="close-reason-input"
            rows={3}
            value={closeReason}
            onChange={(e) => setCloseReason(e.target.value)}
            placeholder="Nêu rõ điều khoản vi phạm, ví dụ: chứa nội dung quảng cáo đa cấp, yêu cầu đóng phí tuyển dụng..."
            style={{
              width: '100%',
              padding: '0.55rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setClosingJob(null)}
              style={{
                padding: '0.5rem 1rem',
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
              disabled={submitting}
              onClick={() => void handleConfirmClose()}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: '#dc2626',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận Đóng tin'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
