import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import type { JobSummaryDto, JobType, WorkplaceMode } from '@rms/contracts/public';
import { searchPublicJobs } from './public-jobs.api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { StatusBadge } from '../../components/ui/status-badge';
import { Alert } from '../../components/ui/alert';
import { LocationFilterPopover } from './components/location-filter-popover';
import { CustomSelect } from './components/custom-select';
import { useLanguage } from '../../lib/i18n';

export function JobListPage() {
  const { language, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const jobTypeOptions = useMemo(
    () => [
      { value: '', label: t('jobs.allJobTypes') },
      { value: 'FULL_TIME', label: t('jobs.fullTime') },
      { value: 'PART_TIME', label: t('jobs.partTime') },
      { value: 'CONTRACT', label: t('jobs.contract') },
      { value: 'INTERNSHIP', label: t('jobs.internship') },
    ],
    [t]
  );

  const workplaceModeOptions = useMemo(
    () => [
      { value: '', label: t('jobs.allWorkplaceModes') },
      { value: 'ON_SITE', label: t('jobs.onSite') },
      { value: 'HYBRID', label: t('jobs.hybrid') },
      { value: 'REMOTE', label: t('jobs.remote') },
    ],
    [t]
  );

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
          {t('jobs.pageTitle')}
        </h1>
        <p
          style={{
            color: 'var(--muted)',
            fontSize: '15px',
            marginTop: '6px',
          }}
        >
          {t('jobs.pageSubtitle')}
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
          label={t('jobs.keywordLabel')}
          placeholder={t('jobs.keywordPlaceholder')}
          value={keywordInput}
          onChange={(e) => setKeywordInput(e.target.value)}
          style={{ borderRadius: '14px', minHeight: '44px', padding: '10px 16px' }}
        />

        <LocationFilterPopover
          id="search-location"
          label={t('jobs.locationLabel')}
          placeholder={t('jobs.locationPlaceholder')}
          value={locationInput}
          onChange={setLocationInput}
        />

        <CustomSelect
          id="search-jobType"
          label={t('jobs.jobTypeLabel')}
          value={jobTypeInput}
          onChange={(val) => setJobTypeInput(val as JobType)}
          options={jobTypeOptions}
        />

        <CustomSelect
          id="search-workplaceMode"
          label={t('jobs.workplaceModeLabel')}
          value={workplaceModeInput}
          onChange={(val) => setWorkplaceModeInput(val as WorkplaceMode)}
          options={workplaceModeOptions}
        />

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 'var(--space-2)' }}>
          <Button
            type="submit"
            variant="primary"
            style={{ flex: 1, minHeight: '44px', borderRadius: '14px', fontWeight: 600 }}
          >
            {t('jobs.searchBtn')}
          </Button>
          {(q || location || jobType || workplaceMode) && (
            <Button
              type="button"
              variant="outline"
              onClick={handleResetFilters}
              style={{ minHeight: '44px', borderRadius: '14px' }}
            >
              {t('jobs.clearFiltersBtn')}
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
              {language === 'en' ? 'Retry' : 'Thử lại'}
            </Button>
          </div>
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          style={{ textAlign: 'center', padding: 'var(--space-12) 0', color: 'var(--color-muted)' }}
        >
          {t('jobs.loading')}
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
            {t('jobs.notFoundTitle')}
          </h2>
          <p style={{ color: 'var(--color-muted)', marginBottom: 'var(--space-4)' }}>
            {t('jobs.notFoundDesc')}
          </p>
          <Button variant="primary" onClick={handleResetFilters}>
            {t('jobs.clearFiltersBtn')}
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
            {t('jobs.foundCount', { count: total })}
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
                <div>
                  {job.salary
                    ? t('jobs.salaryRange', {
                        min: job.salary.min.toLocaleString(),
                        max: job.salary.max.toLocaleString(),
                        currency: job.salary.currency,
                      })
                    : t('jobs.salaryNegotiable')}
                </div>
                <div>
                  {t('jobs.deadline', {
                    date: new Date(job.deadline).toLocaleDateString(
                      language === 'en' ? 'en-US' : 'vi-VN'
                    ),
                  })}
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
                    {t('jobs.viewDetails')}
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
                {t('jobs.prevPage')}
              </Button>
              <span
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-muted)',
                  margin: '0 var(--space-2)',
                }}
              >
                {t('jobs.pageInfo', { page, totalPages })}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
              >
                {t('jobs.nextPage')}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
