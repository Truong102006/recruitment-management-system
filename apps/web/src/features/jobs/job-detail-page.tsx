import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { JobDetailDto } from '@rms/contracts/public';
import { getPublicJobDetail, saveJob, unsaveJob, getSavedJobs } from './public-jobs.api';
import { useAuth } from '../auth/context/auth-context';
import { Button } from '../../components/ui/button';
import { StatusBadge } from '../../components/ui/status-badge';
import { Alert } from '../../components/ui/alert';
import { ApplyJobDialog } from '../applications/components/apply-job-dialog';

export function JobDetailPage() {
  const { jobId, id } = useParams<{ jobId?: string; id?: string }>();
  const activeJobId = jobId || id;
  const navigate = useNavigate();
  const { isAuthenticated, hasRole } = useAuth();

  const [job, setJob] = useState<JobDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isApplyDialogOpen, setIsApplyDialogOpen] = useState<boolean>(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  const fetchJob = useCallback(async () => {
    if (!activeJobId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPublicJobDetail(activeJobId);
      setJob(data);

      // Check if job is saved if user is authenticated
      if (isAuthenticated) {
        try {
          const savedResponse = await getSavedJobs(1, 100);
          const found = savedResponse.data.some((s) => s.jobId === activeJobId);
          setIsSaved(found);
        } catch {
          // Ignore saved jobs check error
        }
      }
    } catch {
      setError('Không tìm thấy thông tin tin tuyển dụng hoặc tin đã bị xóa.');
    } finally {
      setIsLoading(false);
    }
  }, [activeJobId, isAuthenticated]);

  useEffect(() => {
    void fetchJob();
  }, [fetchJob]);

  const isExpired = job
    ? new Date(job.deadline).getTime() < Date.now() || job.status === 'CLOSED'
    : false;

  const handleApplyClick = () => {
    if (!activeJobId) return;

    // FE05: Redirect to login with safe internal returnTo
    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(`/jobs/${activeJobId}`)}`);
      return;
    }

    // FE06: Check expired job
    if (isExpired) {
      setApplyError('Tin tuyển dụng này đã hết hạn nhận hồ sơ ứng tuyển.');
      return;
    }

    // Candidate can apply
    if (hasRole('CANDIDATE')) {
      setIsApplyDialogOpen(true);
    } else {
      setApplyError('Tài khoản của bạn không có vai trò Ứng viên để ứng tuyển.');
    }
  };

  // FE07: Toggle Save Job
  const handleToggleSave = async () => {
    if (!activeJobId) return;

    if (!isAuthenticated) {
      navigate(`/login?returnTo=${encodeURIComponent(`/jobs/${activeJobId}`)}`);
      return;
    }

    setIsSaving(true);
    try {
      if (isSaved) {
        await unsaveJob(activeJobId);
        setIsSaved(false);
      } else {
        await saveJob(activeJobId);
        setIsSaved(true);
      }
    } catch {
      // Server error handling
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div
        data-testid="job-detail-page"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-4)',
          textAlign: 'center',
          color: 'var(--color-muted)',
        }}
      >
        Đang tải thông tin tin tuyển dụng...
      </div>
    );
  }

  if (error || !job) {
    return (
      <div
        data-testid="job-detail-page"
        style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}
      >
        <Alert variant="error">{error || 'Không tìm thấy tin tuyển dụng.'}</Alert>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Link to="/jobs">
            <Button variant="secondary">Quay lại danh sách việc làm</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="job-detail-page"
      style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}
    >
      {/* Breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        style={{
          marginBottom: 'var(--space-4)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-muted)',
        }}
      >
        <Link to="/" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>
          Trang chủ
        </Link>
        {' / '}
        <Link to="/jobs" style={{ color: 'var(--color-muted)', textDecoration: 'none' }}>
          Việc làm
        </Link>
        {' / '}
        <span style={{ color: 'var(--color-foreground)' }}>{job.title}</span>
      </nav>

      {applyError && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="error">{applyError}</Alert>
        </div>
      )}

      {/* Main Job Card Header */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 'var(--space-4)',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: 'var(--font-d)',
                fontSize: '1.85rem',
                fontWeight: 600,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
                marginBottom: '0.35rem',
              }}
            >
              {job.title}
            </h1>
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 500,
                color: 'var(--blue)',
              }}
            >
              {job.companyName}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={job.jobType} />
            <StatusBadge status={job.workplaceMode} />
            {isExpired && <StatusBadge status="CLOSED" />}
          </div>
        </div>

        {/* Quick specs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--hair)',
            fontSize: '0.9rem',
          }}
        >
          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '2px' }}>Địa điểm làm việc</div>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {job.location}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '2px' }}>Mức lương</div>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--green)',
              }}
            >
              {job.salary
                ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ${job.salary.currency}`
                : 'Thỏa thuận'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '2px' }}>Số lượng tuyển</div>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {job.headcount} người
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '2px' }}>Hạn nộp hồ sơ</div>
            <div
              style={{
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {new Date(job.deadline).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
          <Button
            variant="primary"
            size="lg"
            disabled={isExpired}
            onClick={handleApplyClick}
            style={{ flex: 1, maxWidth: '240px', fontWeight: 600 }}
          >
            {isExpired ? 'Hết hạn ứng tuyển' : 'Ứng tuyển ngay'}
          </Button>

          <Button
            variant={isSaved ? 'secondary' : 'outline'}
            size="lg"
            isLoading={isSaving}
            onClick={() => void handleToggleSave()}
            style={{ fontWeight: 600 }}
          >
            {isSaved ? '★ Đã lưu tin' : '☆ Lưu tin tuyển dụng'}
          </Button>
        </div>
      </div>

      {/* Skills Required */}
      {job.skills && job.skills.length > 0 && (
        <div
          className="card"
          style={{
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-d)',
              fontSize: '1.15rem',
              fontWeight: 600,
              marginBottom: '0.75rem',
              color: 'var(--ink)',
            }}
          >
            Kỹ năng yêu cầu
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {job.skills.map((skill) => (
              <span
                key={skill.id}
                className="chip"
                style={{
                  fontSize: '0.85rem',
                  padding: '4px 12px',
                  fontWeight: 500,
                }}
              >
                {skill.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Job Description */}
      <div
        className="card"
        style={{
          padding: '1.75rem',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-d)',
            fontSize: '1.25rem',
            fontWeight: 600,
            marginBottom: '1rem',
            color: 'var(--ink)',
          }}
        >
          Mô tả công việc & Yêu cầu chi tiết
        </h2>
        <div
          style={{
            color: 'var(--ink2)',
            lineHeight: 1.65,
            fontSize: '0.95rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {job.description}
        </div>
      </div>

      {/* Apply Dialog */}
      <ApplyJobDialog
        isOpen={isApplyDialogOpen}
        onClose={() => setIsApplyDialogOpen(false)}
        jobId={job.id}
        jobTitle={job.title}
        companyName={job.companyName}
      />
    </div>
  );
}
