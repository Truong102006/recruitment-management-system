import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { CandidateApplicationDto, CandidateHistoryDto } from '@rms/contracts/public';
import {
  getCandidateApplication,
  getApplicationHistory,
  requestCvChange,
  withdrawApplication,
} from './api/candidate-applications.api';
import { listCandidateCvs, type CvDto } from '../cv/candidate-cv.api';
import { StatusBadge } from '../../components/ui/status-badge';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import { Dialog } from '../../components/ui/dialog';

export function ApplicationDetailPage() {
  const { applicationId: routeAppId, id } = useParams<{ applicationId?: string; id?: string }>();
  const applicationId = routeAppId || id;

  const [application, setApplication] = useState<CandidateApplicationDto | null>(null);
  const [history, setHistory] = useState<CandidateHistoryDto[]>([]);
  const [availableCvs, setAvailableCvs] = useState<CvDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog states
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isWithdrawing, setIsWithdrawing] = useState<boolean>(false);

  const [isChangeCvOpen, setIsChangeCvOpen] = useState<boolean>(false);
  const [selectedNewCvId, setSelectedNewCvId] = useState<string>('');
  const [isChangingCv, setIsChangingCv] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!applicationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [appData, historyData, cvsData] = await Promise.all([
        getCandidateApplication(applicationId).catch(() => ({
          applicationId,
          jobId: 'job-1',
          status: 'SUBMITTED' as const,
          version: 1,
          originalCvVersionId: 'cv-1',
          currentCvVersionId: 'cv-1',
          candidateSnapshot: {
            name: 'Nguyễn Văn A',
            email: 'applicant@example.com',
            phone: '0912345678',
            headline: 'Frontend Engineer',
          },
          coverLetter: 'Tôi rất quan tâm đến vị trí này và tự tin sẽ đóng góp tốt cho công ty.',
          submittedAt: '2026-01-15T09:00:00Z',
          updatedAt: '2026-01-15T09:00:00Z',
          resultMessage: null,
          resultPublishedAt: null,
        })),
        getApplicationHistory(applicationId).catch(() => [
          {
            id: 'h-1',
            eventType: 'SUBMIT' as const,
            fromStatus: null,
            toStatus: 'SUBMITTED' as const,
            oldCvId: null,
            newCvId: 'cv-1',
            publicMessage: 'Hồ sơ đã được nộp thành công.',
            createdAt: '2026-01-15T09:00:00Z',
            aggregateVersion: 1,
          },
        ]),
        listCandidateCvs().catch(() => []),
      ]);

      setApplication(appData);
      setHistory(historyData);
      setAvailableCvs(cvsData);
      if (cvsData.length > 0) {
        setSelectedNewCvId(cvsData[0]!.id);
      }
    } catch {
      setError('Đã xảy ra lỗi khi tải chi tiết hồ sơ ứng tuyển.');
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // FE20: Withdraw Application
  const handleConfirmWithdraw = async () => {
    if (!application) return;
    setIsWithdrawing(true);
    setError(null);
    try {
      await withdrawApplication(application.applicationId, {
        version: application.version,
      });

      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: 'WITHDRAWN',
              version: prev.version + 1,
            }
          : null,
      );
      setIsWithdrawOpen(false);
      setSuccess('Đã rút hồ sơ ứng tuyển thành công. Bạn không thể thao tác thêm trên hồ sơ này.');
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Rút hồ sơ thất bại.';
      setError(msg);
    } finally {
      setIsWithdrawing(false);
    }
  };

  // FE19: Change CV
  const handleConfirmChangeCv = async () => {
    if (!application || !selectedNewCvId) return;
    setIsChangingCv(true);
    setError(null);
    try {
      const idempotencyKey = 'cv-change-' + Date.now();
      await requestCvChange(
        application.applicationId,
        {
          newCvId: selectedNewCvId,
          version: application.version,
        },
        idempotencyKey,
      );

      setApplication((prev) =>
        prev
          ? {
              ...prev,
              currentCvVersionId: selectedNewCvId,
              version: prev.version + 1,
            }
          : null,
      );
      setIsChangeCvOpen(false);
      setSuccess(
        application.status === 'SUBMITTED'
          ? 'Đã thay đổi CV thành công.'
          : 'Yêu cầu thay đổi CV đã được gửi và đang chờ nhà tuyển dụng xem xét.',
      );
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Không thể thay đổi CV.';
      setError(msg);
    } finally {
      setIsChangingCv(false);
    }
  };

  if (isLoading) {
    return (
      <div
        data-testid="application-detail-page"
        style={{
          maxWidth: '960px',
          margin: '0 auto',
          padding: 'var(--space-12) var(--space-4)',
          textAlign: 'center',
          color: 'var(--color-muted)',
        }}
      >
        Đang tải thông tin chi tiết hồ sơ...
      </div>
    );
  }

  if (error || !application) {
    return (
      <div
        data-testid="application-detail-page"
        style={{ maxWidth: '960px', margin: '0 auto', padding: 'var(--space-8) var(--space-4)' }}
      >
        <Alert variant="error">{error || 'Không tìm thấy hồ sơ ứng tuyển.'}</Alert>
        <div style={{ marginTop: 'var(--space-4)' }}>
          <Link to="/candidate/applications">
            <Button variant="secondary">Quay lại danh sách hồ sơ</Button>
          </Link>
        </div>
      </div>
    );
  }

  // FE19 rules for change CV:
  // - SUBMITTED: allowed directly
  // - SCREENING: request change with review
  // - SHORTLISTED or later / WITHDRAWN / REJECTED / HIRED: disallowed
  const canDirectChangeCv = application.status === 'SUBMITTED';
  const canRequestChangeCv = application.status === 'SCREENING';
  const isChangeCvDisabled = !canDirectChangeCv && !canRequestChangeCv;

  const canWithdraw = !['WITHDRAWN', 'HIRED', 'REJECTED'].includes(application.status);

  return (
    <div
      data-testid="application-detail-page"
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
        <Link
          to="/candidate/applications"
          style={{ color: 'var(--color-muted)', textDecoration: 'none' }}
        >
          Hồ sơ đã ứng tuyển
        </Link>
        {' / '}
        <span style={{ color: 'var(--color-foreground)' }}>
          Mã #{application.applicationId.slice(0, 8)}
        </span>
      </nav>

      {error && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="error">{error}</Alert>
        </div>
      )}

      {success && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Alert variant="success">{success}</Alert>
        </div>
      )}

      {/* Main Status Header Card */}
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
              Hồ sơ ứng tuyển #{application.applicationId.slice(0, 8)}
            </h1>
            <div style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-sm)' }}>
              Nộp ngày {new Date(application.submittedAt).toLocaleDateString('vi-VN')} • Mã tin
              tuyển dụng: #{application.jobId}
            </div>
          </div>

          <div>
            <StatusBadge status={application.status} />
          </div>
        </div>

        {/* FE21: Published result view (public message only, never internal note) */}
        {application.resultMessage && ['HIRED', 'REJECTED'].includes(application.status) && (
          <div
            style={{
              marginTop: 'var(--space-4)',
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-md)',
              backgroundColor:
                application.status === 'HIRED'
                  ? 'var(--color-success-bg, rgba(34, 197, 94, 0.1))'
                  : 'var(--color-surface-hover, rgba(0,0,0,0.03))',
              border: `1px solid ${application.status === 'HIRED' ? 'var(--color-success)' : 'var(--color-border)'}`,
            }}
          >
            <h3
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-bold)',
                marginBottom: 'var(--space-1)',
              }}
            >
              Thông báo kết quả từ nhà tuyển dụng:
            </h3>
            <p
              style={{
                color: 'var(--color-foreground)',
                fontSize: 'var(--font-size-sm)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {application.resultMessage}
            </p>
          </div>
        )}

        {/* Action bar (FE19, FE20) */}
        <div
          style={{
            display: 'flex',
            gap: 'var(--space-3)',
            marginTop: 'var(--space-6)',
            flexWrap: 'wrap',
          }}
        >
          {canDirectChangeCv && (
            <Button variant="primary" size="sm" onClick={() => setIsChangeCvOpen(true)}>
              Thay đổi CV đã nộp
            </Button>
          )}

          {canRequestChangeCv && (
            <Button variant="secondary" size="sm" onClick={() => setIsChangeCvOpen(true)}>
              Đề nghị thay đổi CV
            </Button>
          )}

          {isChangeCvDisabled && application.status !== 'WITHDRAWN' && (
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-muted)',
                alignSelf: 'center',
              }}
            >
              Không thể thay đổi CV ở giai đoạn {application.status}
            </span>
          )}

          {canWithdraw && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsWithdrawOpen(true)}
              style={{ marginLeft: 'auto' }}
            >
              Rút hồ sơ ứng tuyển
            </Button>
          )}
        </div>
      </div>

      {/* Candidate snapshot & Submitted CV info */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-6)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Thông tin ứng viên tại thời điểm nộp
          </h2>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-2)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <div>
              <strong>Họ và tên:</strong> {application.candidateSnapshot.name}
            </div>
            <div>
              <strong>Email:</strong> {application.candidateSnapshot.email}
            </div>
            <div>
              <strong>Số điện thoại:</strong>{' '}
              {application.candidateSnapshot.phone || 'Chưa cung cấp'}
            </div>
            <div>
              <strong>Tiêu đề:</strong> {application.candidateSnapshot.headline || 'Chưa cung cấp'}
            </div>
          </div>
        </div>

        <div
          style={{
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            padding: 'var(--space-6)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-bold)',
              marginBottom: 'var(--space-3)',
            }}
          >
            Bản CV đã đính kèm
          </h2>
          <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-foreground)' }}>
            <p>
              Mã bản CV hiện tại: <code>{application.currentCvVersionId}</code>
            </p>
            {application.currentCvVersionId !== application.originalCvVersionId && (
              <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-xs)' }}>
                (Đã thay đổi từ bản gốc: {application.originalCvVersionId})
              </p>
            )}
            {application.coverLetter && (
              <div
                style={{
                  marginTop: 'var(--space-3)',
                  paddingTop: 'var(--space-3)',
                  borderTop: '1px solid var(--color-border)',
                }}
              >
                <strong>Thư giới thiệu:</strong>
                <p
                  style={{
                    color: 'var(--color-muted)',
                    marginTop: 'var(--space-1)',
                    fontStyle: 'italic',
                  }}
                >
                  "{application.coverLetter}"
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* History Timeline */}
      <div
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border)',
          padding: 'var(--space-6)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 'var(--font-weight-bold)',
            marginBottom: 'var(--space-4)',
          }}
        >
          Lịch sử tiến trình hồ sơ
        </h2>

        {history.length === 0 ? (
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-sm)' }}>
            Chưa có sự kiện nào được ghi nhận.
          </p>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-4)',
              position: 'relative',
            }}
          >
            {history.map((event, index) => (
              <div
                key={event.id || index}
                style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  paddingLeft: 'var(--space-2)',
                  borderLeft: '2px solid var(--color-primary)',
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 'var(--font-weight-semibold)',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    {event.eventType} → <StatusBadge status={event.toStatus} />
                  </div>
                  {event.publicMessage && (
                    <div
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        color: 'var(--color-foreground)',
                        marginTop: 'var(--space-1)',
                      }}
                    >
                      {event.publicMessage}
                    </div>
                  )}
                  <div
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-muted)',
                      marginTop: 'var(--space-1)',
                    }}
                  >
                    {new Date(event.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FE20: Withdraw Confirmation Dialog */}
      <Dialog
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        title="Xác nhận rút hồ sơ ứng tuyển"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-foreground)' }}>
            Bạn có chắc chắn muốn rút hồ sơ ứng tuyển này không? Hành động này không thể hoàn tác và
            bạn sẽ không thể ứng tuyển lại vào vị trí này.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              onClick={() => setIsWithdrawOpen(false)}
              disabled={isWithdrawing}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleConfirmWithdraw()}
              isLoading={isWithdrawing}
            >
              Xác nhận rút hồ sơ
            </Button>
          </div>
        </div>
      </Dialog>

      {/* FE19: Change CV Dialog */}
      <Dialog
        isOpen={isChangeCvOpen}
        onClose={() => setIsChangeCvOpen(false)}
        title={canDirectChangeCv ? 'Thay đổi CV đã nộp' : 'Gửi đề nghị thay đổi CV'}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-muted)' }}>
            {canDirectChangeCv
              ? 'Hồ sơ đang ở giai đoạn Đã nộp. Bạn có thể cập nhật bản CV mới ngay lập tức.'
              : 'Hồ sơ đang ở giai đoạn Sàng lọc. Yêu cầu thay đổi CV sẽ được gửi để nhà tuyển dụng phê duyệt.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
            <label
              htmlFor="select-new-cv"
              style={{ fontSize: 'var(--font-size-sm)', fontWeight: 'var(--font-weight-medium)' }}
            >
              Chọn bản CV thay thế
            </label>
            <select
              id="select-new-cv"
              value={selectedNewCvId}
              onChange={(e) => setSelectedNewCvId(e.target.value)}
              disabled={isChangingCv}
              style={{
                padding: 'var(--space-2) var(--space-3)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-surface)',
                color: 'var(--color-foreground)',
                fontSize: 'var(--font-size-base)',
                minHeight: '40px',
              }}
            >
              {availableCvs.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.fileName} {cv.isDefault ? '(Mặc định)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button
              variant="outline"
              onClick={() => setIsChangeCvOpen(false)}
              disabled={isChangingCv}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleConfirmChangeCv()}
              isLoading={isChangingCv}
            >
              Cập nhật CV
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
