import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import type { SavedJobDto } from '@rms/contracts/public';
import { getSavedJobs, unsaveJob } from '../jobs/public-jobs.api';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { Alert } from '../../components/ui/alert';

export function SavedJobsPage() {
  const [savedJobs, setSavedJobs] = useState<SavedJobDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchSavedJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await getSavedJobs(1, 100);
      setSavedJobs(response.data);
    } catch {
      setError('Đã xảy ra lỗi khi tải danh sách tin đã lưu.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchSavedJobs();
  }, [fetchSavedJobs]);

  const handleUnsave = async (jobId: string) => {
    setActionError(null);
    try {
      await unsaveJob(jobId);
      setSavedJobs((prev) => prev.filter((j) => j.jobId !== jobId));
    } catch {
      setActionError('Không thể bỏ lưu tin tuyển dụng.');
    }
  };

  return (
    <div
      data-testid="saved-jobs-page"
      style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}
    >
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-foreground)',
          }}
        >
          Tin tuyển dụng đã lưu (UI12)
        </h1>
        <p
          style={{
            color: 'var(--color-muted)',
            fontSize: 'var(--font-size-sm)',
            marginTop: 'var(--space-1)',
          }}
        >
          Danh sách các cơ hội việc làm bạn quan tâm và lưu lại để ứng tuyển sau
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {actionError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="error">{actionError}</Alert>
        </div>
      )}

      {isLoading ? (
        <div
          style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--color-muted)' }}
        >
          Đang tải danh sách tin đã lưu...
        </div>
      ) : savedJobs.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: 'var(--space-2)' }}>⭐</div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Bạn chưa lưu tin tuyển dụng nào
          </h2>
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-sm)',
              marginBottom: 'var(--space-4)',
            }}
          >
            Bấm vào biểu tượng "Lưu tin" ở bất kỳ trang việc làm nào để theo dõi tại đây.
          </p>
          <Link to="/jobs">
            <Button variant="primary">Tìm việc làm ngay</Button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {savedJobs.map((item) => {
            // FE22: If job is not accepting applications or unavailable -> CLOSED state
            const isClosed = !item.acceptingApplications || !item.available;

            return (
              <div
                key={item.jobId}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  backgroundColor: 'var(--color-surface)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--color-border)',
                  padding: 'var(--space-6)',
                  boxShadow: 'var(--shadow-sm)',
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
                        to={`/jobs/${item.jobId}`}
                        style={{ color: 'var(--color-foreground)', textDecoration: 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.color = 'var(--color-foreground)')
                        }
                      >
                        {item.title || `Tin tuyển dụng #${item.jobId.slice(0, 8)}`}
                      </Link>
                    </h2>

                    {/* FE22: Closed / Accepting badge */}
                    {isClosed ? (
                      <StatusBadge status="CLOSED" />
                    ) : (
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          backgroundColor: 'var(--color-success-bg, rgba(34, 197, 94, 0.1))',
                          color: 'var(--color-success, #16a34a)',
                          padding: 'var(--space-1) var(--space-2)',
                          borderRadius: 'var(--radius-sm)',
                          fontWeight: 'var(--font-weight-medium)',
                        }}
                      >
                        Đang nhận hồ sơ
                      </span>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-2)',
                    }}
                  >
                    Đã lưu ngày: {new Date(item.savedAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                {/* Actions (FE22) */}
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {isClosed ? (
                    <Button variant="secondary" size="sm" disabled>
                      Đã đóng nhận hồ sơ
                    </Button>
                  ) : (
                    <Link to={`/jobs/${item.jobId}`}>
                      <Button variant="primary" size="sm">
                        Ứng tuyển ngay
                      </Button>
                    </Link>
                  )}

                  <Button variant="outline" size="sm" onClick={() => void handleUnsave(item.jobId)}>
                    Bỏ lưu
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
