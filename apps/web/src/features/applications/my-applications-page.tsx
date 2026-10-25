import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { CandidateApplicationDto, ApplicationStatus } from '@rms/contracts/public';
import { listCandidateApplications } from './api/candidate-applications.api';
import { StatusBadge } from '../../components/ui/status-badge';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Đã nộp hồ sơ', value: 'SUBMITTED' },
  { label: 'Đang sàng lọc', value: 'SCREENING' },
  { label: 'Được chọn vào vòng sau', value: 'SHORTLISTED' },
  { label: 'Lên lịch phỏng vấn', value: 'INTERVIEW_SCHEDULED' },
  { label: 'Đã phỏng vấn', value: 'INTERVIEWED' },
  { label: 'Được tuyển dụng', value: 'HIRED' },
  { label: 'Không phù hợp', value: 'REJECTED' },
  { label: 'Đã rút hồ sơ', value: 'WITHDRAWN' },
];

export function MyApplicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // FE18: URL status filter sync
  const statusFilter = searchParams.get('status') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  const [applications, setApplications] = useState<CandidateApplicationDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listCandidateApplications(page, 20);
      setApplications(response.data);
      setTotal(response.meta.total);
    } catch {
      setError('Đã xảy ra lỗi khi tải danh sách hồ sơ ứng tuyển.');
      setApplications([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void fetchApplications();
  }, [fetchApplications]);

  const handleStatusFilterChange = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status) {
      params.set('status', status);
    } else {
      params.delete('status');
    }
    params.set('page', '1');
    setSearchParams(params);
  };

  // Filter list by selected status
  const filteredApps = statusFilter
    ? applications.filter((app) => app.status === (statusFilter as ApplicationStatus))
    : applications;

  return (
    <div
      data-testid="my-applications-page"
      style={{ maxWidth: '1000px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}
    >
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-foreground)',
          }}
        >
          Hồ sơ đã ứng tuyển (UI10)
        </h1>
        <p
          style={{
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-sm)',
            marginTop: 'var(--space-1)',
          }}
        >
          Theo dõi tiến độ xét duyệt và kết quả ứng tuyển các vị trí việc làm của bạn
        </p>
      </div>

      {/* Filter tabs/select (FE18) */}
      <div
        style={{
          marginBottom: 'var(--space-6)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          flexWrap: 'wrap',
        }}
      >
        <label
          htmlFor="application-status-filter"
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-foreground)',
          }}
        >
          Lọc theo trạng thái:
        </label>
        <select
          id="application-status-filter"
          value={statusFilter}
          onChange={(e) => handleStatusFilterChange(e.target.value)}
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-foreground)',
            fontSize: 'var(--font-size-sm)',
            minHeight: '36px',
            outline: 'none',
          }}
        >
          {STATUS_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>

        {statusFilter && (
          <Button variant="outline" size="sm" onClick={() => handleStatusFilterChange('')}>
            Xóa lọc
          </Button>
        )}
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {isLoading ? (
        <div
          style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--color-muted)' }}
        >
          Đang tải hồ sơ ứng tuyển...
        </div>
      ) : filteredApps.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: 'var(--space-2)' }}>📑</div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Không có hồ sơ ứng tuyển nào
          </h2>
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            {statusFilter
              ? 'Không tìm thấy hồ sơ ở trạng thái này. Bạn có thể xóa bộ lọc để xem tất cả.'
              : 'Bạn chưa nộp hồ sơ ứng tuyển vị trí việc làm nào.'}
          </p>
          <Link to="/jobs">
            <Button variant="primary">Khám phá cơ hội việc làm</Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)' }}>
            Hiển thị <strong>{filteredApps.length}</strong> / {total} hồ sơ ứng tuyển
          </div>

          {filteredApps.map((app) => (
            <article
              key={app.applicationId}
              className="card"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 'var(--space-4)',
                backgroundColor: 'var(--card)',
                borderRadius: '18px',
                border: '1px solid var(--hair)',
                padding: '20px 24px',
                boxShadow: 'var(--sh-s)',
                transition: 'transform 0.3s var(--spring), box-shadow 0.25s',
              }}
            >
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                  }}
                >
                  <h2
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    <Link
                      to={`/candidate/applications/${app.applicationId}`}
                      style={{ color: 'var(--color-foreground)', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'var(--color-foreground)')
                      }
                    >
                      Mã hồ sơ: #{app.applicationId.slice(0, 8)} (Tin #{app.jobId.slice(0, 8)})
                    </Link>
                  </h2>
                  <StatusBadge status={app.status} />
                </div>

                <div
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-muted)',
                    marginTop: 'var(--space-2)',
                  }}
                >
                  Ngày nộp: {new Date(app.submittedAt).toLocaleDateString('vi-VN')} • Cập nhật lần
                  cuối: {new Date(app.updatedAt).toLocaleDateString('vi-VN')}
                </div>
              </div>

              <div>
                <Link to={`/candidate/applications/${app.applicationId}`}>
                  <Button variant="outline" size="sm">
                    Chi tiết tiến độ
                  </Button>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
