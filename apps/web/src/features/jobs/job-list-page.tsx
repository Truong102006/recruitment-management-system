import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { JobSummaryDto, JobType, WorkplaceMode } from '@rms/contracts/public';
import { searchPublicJobs } from './public-jobs.api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { StatusBadge } from '../../components/ui/status-badge';
import { Alert } from '../../components/ui/alert';

export function JobListPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Extract filters from URL query
  const q = searchParams.get('q') || '';
  const location = searchParams.get('location') || '';
  const jobType = (searchParams.get('jobType') as JobType | null) || '';
  const workplaceMode = (searchParams.get('workplaceMode') as WorkplaceMode | null) || '';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Form input local state (controlled)
  const [keywordInput, setKeywordInput] = useState<string>(q);
  const [locationInput, setLocationInput] = useState<string>(location);
  const [jobTypeInput, setJobTypeInput] = useState<JobType | ''>(jobType);
  const [workplaceModeInput, setWorkplaceModeInput] = useState<WorkplaceMode | ''>(workplaceMode);

  // Data state
  const [jobs, setJobs] = useState<JobSummaryDto[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Sync inputs with URL on back/forward navigation (FE02)
  useEffect(() => {
    setKeywordInput(q);
    setLocationInput(location);
    setJobTypeInput(jobType);
    setWorkplaceModeInput(workplaceMode);
  }, [q, location, jobType, workplaceMode]);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await searchPublicJobs({
        q: q || undefined,
        location: location || undefined,
        jobType: jobType || undefined,
        workplaceMode: workplaceMode || undefined,
        page,
        pageSize: 10,
      });
      setJobs(response.data);
      setTotal(response.meta.total);
      setPageSize(response.meta.pageSize || 10);
    } catch {
      setError('Đã xảy ra lỗi khi tải danh sách tin tuyển dụng. Vui lòng thử lại sau.');
      setJobs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [q, location, jobType, workplaceMode, page]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keywordInput.trim()) params.set('q', keywordInput.trim());
    if (locationInput.trim()) params.set('location', locationInput.trim());
    if (jobTypeInput) params.set('jobType', jobTypeInput);
    if (workplaceModeInput) params.set('workplaceMode', workplaceModeInput);
    // FE02: Reset to page 1 on filter change
    params.set('page', '1');
    setSearchParams(params);
  };

  const handleResetFilters = () => {
    setKeywordInput('');
    setLocationInput('');
    setJobTypeInput('');
    setWorkplaceModeInput('');
    setSearchParams(new URLSearchParams({ page: '1' }));
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  return (
    <div
      data-testid="job-list-page"
      style={{ maxWidth: '1240px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}
    >
      {/* Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 600,
            fontFamily: 'var(--font-d)',
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
          }}
        >
          Cơ hội việc làm công nghệ
        </h1>
        <p
          style={{
            color: 'var(--muted)',
            fontSize: '15px',
            marginTop: '6px',
          }}
        >
          Tìm kiếm công việc lý tưởng phù hợp năng lực và định hướng tương lai của bạn
        </p>
      </div>

      {/* Search & Filter Form (FE01, FE04) */}
      <form
        onSubmit={handleSearchSubmit}
        aria-label="Bộ lọc tìm kiếm việc làm"
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--card)',
          padding: '24px',
          borderRadius: '20px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--sh-s)',
          marginBottom: 'var(--space-8)',
        }}
      >
        <Input
          id="search-keyword"
          label="Từ khóa tìm kiếm"
          placeholder="Tên công việc, vị trí, kỹ năng..."
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
        />

        <Input
          id="search-location"
          label="Địa điểm"
          placeholder="Hà Nội, TP.HCM, Đà Nẵng..."
          value={locationInput}
          onChange={(e) => setLocationInput(e.target.value)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label
            htmlFor="search-jobType"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-foreground)',
            }}
          >
            Hình thức công việc
          </label>
          <select
            id="search-jobType"
            value={jobTypeInput}
            onChange={(e) => setJobTypeInput(e.target.value as JobType)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-foreground)',
              fontSize: 'var(--font-size-base)',
              minHeight: '40px',
              outline: 'none',
            }}
          >
            <option value="">Tất cả hình thức</option>
            <option value="FULL_TIME">Toàn thời gian (Full-time)</option>
            <option value="PART_TIME">Bán thời gian (Part-time)</option>
            <option value="CONTRACT">Hợp đồng (Contract)</option>
            <option value="INTERNSHIP">Thực tập (Internship)</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
          <label
            htmlFor="search-workplaceMode"
            style={{
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              color: 'var(--color-foreground)',
            }}
          >
            Môi trường làm việc
          </label>
          <select
            id="search-workplaceMode"
            value={workplaceModeInput}
            onChange={(e) => setWorkplaceModeInput(e.target.value as WorkplaceMode)}
            style={{
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-surface)',
              color: 'var(--color-foreground)',
              fontSize: 'var(--font-size-base)',
              minHeight: '40px',
              outline: 'none',
            }}
          >
            <option value="">Tất cả môi trường</option>
            <option value="ON_SITE">Tại văn phòng (On-site)</option>
            <option value="HYBRID">Linh hoạt (Hybrid)</option>
            <option value="REMOTE">Từ xa (Remote)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          <Button type="submit" variant="primary" style={{ flex: 1, minHeight: '40px' }}>
            Tìm kiếm
          </Button>
          {(q || location || jobType || workplaceMode) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              style={{ minHeight: '40px' }}
            >
              Xóa bộ lọc
            </Button>
          )}
        </div>
      </form>

      {/* Error state with Retry button (FE03) */}
      {error && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <Alert variant="error">{error}</Alert>
          <div style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
            <Button variant="secondary" onClick={() => void fetchJobs()}>
              Thử lại
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--color-muted)' }}
        >
          Đang tải danh sách việc làm...
        </div>
      )}

      {/* Empty State (FE03) */}
      {!isLoading && !error && jobs.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Không tìm thấy việc làm phù hợp
          </h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-4)' }}>
            Hãy thử thay đổi từ khóa hoặc điều chỉnh các tiêu chí bộ lọc để có thêm kết quả.
          </p>
          <Button variant="primary" onClick={handleResetFilters}>
            Xóa bộ lọc
          </Button>
        </div>
      )}

      {/* Job list items */}
      {!isLoading && !error && jobs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-muted)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Tìm thấy <strong>{total}</strong> cơ hội việc làm
          </div>

          {jobs.map((job) => (
            <article
              key={job.id}
              className="card"
              style={{
                backgroundColor: 'var(--card)',
                borderRadius: '18px',
                border: '1px solid var(--hair)',
                padding: '22px 24px',
                boxShadow: 'var(--sh-s)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                transition: 'transform 0.3s var(--spring), box-shadow 0.25s, border-color 0.15s',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 'var(--space-2)',
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 'var(--font-size-xl)',
                      fontWeight: 'var(--font-weight-bold)',
                    }}
                  >
                    <Link
                      to={`/jobs/${job.id}`}
                      style={{ color: 'var(--color-foreground)', textDecoration: 'none' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-primary)')}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = 'var(--color-foreground)')
                      }
                    >
                      {job.title}
                    </Link>
                  </h2>
                  <div
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: 'var(--font-weight-medium)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    {job.companyName} • {job.location}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  <StatusBadge status={job.jobType} />
                  <StatusBadge status={job.workplaceMode} />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 'var(--space-4)',
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-foreground)',
                }}
              >
                {job.salary ? (
                  <div>
                    <strong>Mức lương: </strong>
                    {job.salary.min.toLocaleString()} - {job.salary.max.toLocaleString()}{' '}
                    {job.salary.currency}
                  </div>
                ) : (
                  <div>
                    <strong>Mức lương: </strong> Thỏa thuận
                  </div>
                )}
                <div>
                  <strong>Hạn nộp: </strong>
                  {new Date(job.deadline).toLocaleDateString('vi-VN')}
                </div>
              </div>

              {job.skills && job.skills.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                    marginTop: 'var(--space-1)',
                  }}
                >
                  {job.skills.map((skill) => (
                    <span
                      key={skill.id}
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        backgroundColor: 'var(--color-secondary)',
                        color: 'var(--color-secondary-foreground)',
                        padding: 'var(--space-1) var(--space-2)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              )}

              <div
                style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}
              >
                <Link to={`/jobs/${job.id}`}>
                  <Button variant="outline" size="sm">
                    Xem chi tiết & Ứng tuyển
                  </Button>
                </Link>
              </div>
            </article>
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 'var(--space-2)',
                marginTop: 'var(--space-6)',
              }}
            >
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => handlePageChange(page - 1)}
              >
                Trang trước
              </Button>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-muted)',
                  margin: '0 var(--space-2)',
                }}
              >
                Trang {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                Trang sau
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
