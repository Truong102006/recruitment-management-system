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
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: 'var(--space-6)',
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
                fontSize: 'var(--font-size-2xl)',
                fontWeight: 'var(--font-weight-bold)',
                color: 'var(--color-foreground)',
                marginBottom: 'var(--space-2)',
              }}
            >
              {job.title}
            </h1>
            <div
              style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-muted)',
              }}
            >
              {job.companyName}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
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
            gap: 'var(--space-4)',
            marginTop: 'var(--space-6)',
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--color-border)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          <div>
            <div style={{ color: 'var(--color-muted)' }}>Địa điểm làm việc</div>
            <div
              style={{
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
                marginTop: 'var(--space-1)',
              }}
            >
              {job.location}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--color-muted)' }}>Mức lương</div>
            <div
              style={{
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
                marginTop: 'var(--space-1)',
              }}
            >
              {job.salary
                ? `${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ${job.salary.currency}`
                : 'Thỏa thuận'}
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--color-muted)' }}>Số lượng tuyển</div>
            <div
              style={{
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
                marginTop: 'var(--space-1)',
              }}
            >
              {job.headcount} người
            </div>
          </div>

          <div>
            <div style={{ color: 'var(--color-muted)' }}>Hạn nộp hồ sơ</div>
            <div
              style={{
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-foreground)',
                marginTop: 'var(--space-1)',
              }}
            >
              {new Date(job.deadline).toLocaleDateString('vi-VN')}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
          <Button
            variant="primary"
            size="lg"
            disabled={isExpired}
            onClick={handleApplyClick}
            style={{ flex: 1, maxWidth: '240px' }}
          >
            {isExpired ? 'Hết hạn ứng tuyển' : 'Ứng tuyển ngay'}
          </Button>

          <Button
            variant={isSaved ? 'secondary' : 'outline'}
            size="lg"
            isLoading={isSaving}
            onClick={() => void handleToggleSave()}
          >
            {isSaved ? '★ Đã lưu tin' : '☆ Lưu tin tuyển dụng'}
          </Button>
        </div>
      </div>

      {/* Skills Required */}
      {job.skills && job.skills.length > 0 && (
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
            marginBottom: 'var(--space-6)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Kỹ năng yêu cầu
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            {job.skills.map((skill) => (
              <span
                key={skill.id}
                style={{
                  fontSize: 'var(--font-size-sm)',
                  backgroundColor: 'var(--color-secondary)',
                  color: 'var(--color-secondary-foreground)',
                  padding: 'var(--space-1) var(--space-3)',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: 'var(--font-weight-medium)',
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
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-8)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-4)',
            color: 'var(--color-foreground)',
          }}
        >
          Mô tả công việc & Yêu cầu chi tiết
        </h2>
        <div
          style={{
            color: 'var(--color-foreground)',
            lineHeight: 'var(--line-height-relaxed)',
            fontSize: 'var(--font-size-base)',
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
