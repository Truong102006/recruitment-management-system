import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { applicationsApi } from '../api/applications.api';
import { StatusBadge } from '../../../components/ui/status-badge';
import { Dialog } from '../../../components/ui/dialog';
import { ApiException } from '../../../lib/http/api-client';
import type { CandidateHistoryDto, ResultStatus } from '@rms/contracts/public';
import type { DevApplicationItem } from '../../../lib/mocks/dev-mock-store';

export const RecruiterApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<DevApplicationItem | null>(null);
  const [history, setHistory] = useState<CandidateHistoryDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // CV Change Review Action state (FE31, BR08)
  const [reviewingCv, setReviewingCv] = useState<boolean>(false);

  // Status Change Loading state (UC07, BR09)
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false);

  // UI23: Publish Result Dialog state (UC09, BR13)
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [resultChoice, setResultChoice] = useState<ResultStatus>('HIRED');
  const [resultMessage, setResultMessage] = useState<string>('');
  const [rejectReason, setRejectReason] = useState<string>('');
  const [publishingResult, setPublishingResult] = useState<boolean>(false);
  const [resultModalError, setResultModalError] = useState<string | null>(null);

  // CV Preview Modal state
  const [showCvModal, setShowCvModal] = useState<boolean>(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [appData, historyData] = await Promise.all([
        applicationsApi.getApplicationDetail(id),
        applicationsApi.getApplicationHistory(id),
      ]);
      setApplication(appData);
      setHistory(historyData);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải chi tiết hồ sơ ứng viên');
      } else {
        setError('Đã có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Transition status (UC07, BR09)
  const handleTransitionStatus = async (newStatus: 'SCREENING' | 'SHORTLISTED') => {
    if (!application || !id) return;
    setUpdatingStatus(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await applicationsApi.reviewApplication(id, {
        status: newStatus,
        version: application.version,
      });
      setSuccessMessage(`Đã chuyển trạng thái hồ sơ sang ${newStatus} thành công.`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể cập nhật trạng thái hồ sơ');
      } else {
        setError('Lỗi khi cập nhật trạng thái');
      }
    } finally {
      setUpdatingStatus(false);
    }
  };

  // Approve CV Change Request (FE31, UC06, BR08)
  const handleApproveCvChange = async () => {
    if (!application || !id || !application.pendingCvChange) return;
    setReviewingCv(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await applicationsApi.reviewCvChange(id, {
        applicationVersion: application.version,
        requestVersion: application.pendingCvChange.requestVersion,
      });
      setSuccessMessage('Đã duyệt thay đổi CV mới thành công! Phiên bản CV đã được cập nhật.');
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể duyệt đề nghị thay đổi CV');
      } else {
        setError('Đã có lỗi xảy ra');
      }
    } finally {
      setReviewingCv(false);
    }
  };

  // Publish Recruitment Result (UI23, UC09, BR13)
  const handleConfirmPublishResult = async () => {
    if (!application || !id) return;

    if (!resultMessage.trim()) {
      setResultModalError('Vui lòng nhập thông điệp thông báo gửi cho ứng viên.');
      return;
    }

    if (resultChoice === 'REJECTED' && !rejectReason.trim()) {
      setResultModalError(
        'Quy định nghiệp vụ (BR13): Bắt buộc nhập lý do từ chối nội bộ khi REJECTED.',
      );
      return;
    }

    setPublishingResult(true);
    setResultModalError(null);

    try {
      await applicationsApi.publishResult(id, {
        result: resultChoice,
        message: resultMessage.trim(),
        reason: resultChoice === 'REJECTED' ? rejectReason.trim() : undefined,
        version: application.version,
      });
      setShowResultModal(false);
      setSuccessMessage(`Đã công bố kết quả tuyển dụng: ${resultChoice} thành công!`);
      await loadData();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setResultModalError(err.message || 'Không thể công bố kết quả tuyển dụng');
      } else {
        setResultModalError('Đã có lỗi xảy ra');
      }
    } finally {
      setPublishingResult(false);
    }
  };

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return '—';
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

  if (loading) {
    return (
      <div
        className="application-detail-page"
        data-testid="ui20-application-detail"
        style={{ padding: '2rem' }}
      >
        <p>Đang tải chi tiết hồ sơ ứng viên...</p>
      </div>
    );
  }

  if (!application) {
    return (
      <div
        className="application-detail-page"
        data-testid="ui20-application-detail"
        style={{ padding: '2rem' }}
      >
        <h2>Chi tiết Hồ sơ</h2>
        {error ? (
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
        ) : (
          <p>Không tìm thấy thông tin hồ sơ ứng viên yêu cầu.</p>
        )}
        <button
          type="button"
          onClick={() => navigate('/recruiter/applications')}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← Quay lại danh sách
        </button>
      </div>
    );
  }

  const isFinalStatus =
    application.status === 'HIRED' ||
    application.status === 'REJECTED' ||
    application.status === 'WITHDRAWN';

  return (
    <div
      className="application-detail-page"
      data-testid="ui20-application-detail"
      style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <button
            type="button"
            className="btn sm"
            data-testid="back-to-list-btn"
            onClick={() => navigate('/recruiter/applications')}
            style={{
              padding: '6px 12px',
              marginBottom: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← Quay lại danh sách hồ sơ
          </button>
          <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.85rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.35rem' }}>
            Hồ sơ: {application.candidateSnapshot.name}
          </h1>
          <p style={{ color: 'var(--ink2)', margin: 0, fontSize: '0.95rem' }}>
            Ứng tuyển vị trí: <strong style={{ color: 'var(--blue)' }}>{application.jobTitle || application.jobId}</strong>
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.5rem',
          }}
        >
          <StatusBadge status={application.status} size="md" />
          <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            Phiên bản hồ sơ: v{application.version}
          </span>
        </div>
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
            marginBottom: '1.25rem',
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
            marginBottom: '1.25rem',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </div>
      )}

      {/* FE31 & BR08: Pending CV Change Request Panel */}
      {application.pendingCvChange && application.status === 'SCREENING' && (
        <div
          data-testid="pending-cv-change-panel"
          style={{
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '8px',
            padding: '1.25rem',
            marginBottom: '1.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.75rem',
            }}
          >
            <h3 style={{ margin: 0, color: '#92400e', fontSize: '1.1rem', fontWeight: 700 }}>
              ⚡ Đề nghị thay đổi CV từ ứng viên (FE31, BR08)
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#b45309' }}>
              Gửi lúc: {formatDate(application.pendingCvChange.createdAt)}
            </span>
          </div>

          <p style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', color: '#78350f' }}>
            Ứng viên muốn thay thế CV hiện tại bằng phiên bản mới:{' '}
            <strong data-testid="new-cv-id-label">{application.pendingCvChange.newCvId}</strong>
            {application.pendingCvChange.newCvName && ` (${application.pendingCvChange.newCvName})`}
          </p>

          {application.pendingCvChange.reason && (
            <div
              style={{
                fontSize: '0.85rem',
                color: '#92400e',
                marginBottom: '1rem',
                fontStyle: 'italic',
              }}
            >
              &quot;{application.pendingCvChange.reason}&quot;
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              data-testid="approve-cv-change-btn"
              disabled={reviewingCv}
              onClick={() => void handleApproveCvChange()}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: '#16a34a',
                color: '#fff',
                fontWeight: 600,
                cursor: reviewingCv ? 'not-allowed' : 'pointer',
              }}
            >
              {reviewingCv ? 'Đang duyệt...' : '✓ Chấp thuận thay đổi CV'}
            </button>
          </div>
        </div>
      )}

      {/* Main Content Grid: Candidate Info & Actions */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        {/* Left Column: Candidate Snapshot & Cover Letter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Candidate Card */}
          <div
            className="card"
            style={{
              padding: '1.4rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-d)' }}>
              Thông tin Ứng viên (Snapshot)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '1rem',
                fontSize: '0.9rem',
              }}
            >
              <div>
                <span
                  style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}
                >
                  Họ và tên
                </span>
                <strong data-testid="candidate-name" style={{ fontSize: '1rem', color: 'var(--ink)' }}>{application.candidateSnapshot.name}</strong>
              </div>
              <div>
                <span
                  style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}
                >
                  Địa chỉ Email
                </span>
                <span data-testid="candidate-email" style={{ color: 'var(--ink2)' }}>{application.candidateSnapshot.email}</span>
              </div>
              <div>
                <span
                  style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}
                >
                  Số điện thoại
                </span>
                <span style={{ color: 'var(--ink2)' }}>{application.candidateSnapshot.phone || 'Chưa cung cấp'}</span>
              </div>
              <div>
                <span
                  style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem', marginBottom: '2px' }}
                >
                  Thời điểm nộp
                </span>
                <span style={{ color: 'var(--ink2)' }}>{formatDate(application.submittedAt)}</span>
              </div>
            </div>

            {application.candidateSnapshot.headline && (
              <div
                style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--hair)',
                }}
              >
                <span
                  style={{ color: 'var(--muted)', display: 'block', fontSize: '0.8rem' }}
                >
                  Tiêu đề nghề nghiệp
                </span>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.95rem', color: 'var(--ink)' }}>
                  {application.candidateSnapshot.headline}
                </p>
              </div>
            )}
          </div>

          {/* Cover Letter Card */}
          <div
            className="card"
            style={{
              padding: '1.4rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-d)' }}>
              Thư giới thiệu (Cover Letter)
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '0.9rem',
                lineHeight: 1.6,
                color: 'var(--ink2)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {application.coverLetter || 'Ứng viên không đính kèm thư giới thiệu.'}
            </p>
          </div>
        </div>

        {/* Right Column: CV Info & Workflow Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* CV Version Card */}
          <div
            className="card"
            style={{
              padding: '1.4rem',
            }}
          >
            <h3 style={{ margin: '0 0 0.75rem', fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-d)' }}>
              Tệp CV Ứng tuyển
            </h3>
            <div style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              <div style={{ marginBottom: '0.35rem' }}>
                <span style={{ color: 'var(--muted)' }}>CV Gốc: </span>
                <code style={{ fontSize: '0.8rem', background: 'var(--soft)', padding: '2px 6px', borderRadius: '4px' }}>{application.originalCvVersionId}</code>
              </div>
              <div>
                <span style={{ color: 'var(--muted)' }}>CV Đang xét: </span>
                <code
                  data-testid="current-cv-id"
                  style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--blue)', background: 'var(--tint-bg)', padding: '2px 6px', borderRadius: '4px' }}
                >
                  {application.currentCvVersionId}
                </code>
              </div>
            </div>

            <button
              type="button"
              className="btn sm"
              data-testid="preview-cv-btn"
              onClick={() => setShowCvModal(true)}
              style={{
                width: '100%',
                fontWeight: 600,
              }}
            >
              📄 Xem tệp PDF CV
            </button>
          </div>

          {/* Workflow Action Panel (UC07, UC09, BR09) */}
          <div
            className="card"
            style={{
              padding: '1.4rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-d)' }}>
              Thao tác Xử lý Hồ sơ
            </h3>

            {!isFinalStatus ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {application.status === 'SUBMITTED' && (
                  <button
                    type="button"
                    className="btn primary"
                    data-testid="move-to-screening-btn"
                    disabled={updatingStatus}
                    onClick={() => void handleTransitionStatus('SCREENING')}
                    style={{
                      width: '100%',
                      fontWeight: 600,
                    }}
                  >
                    Chuyển sang Sàng lọc (SCREENING)
                  </button>
                )}

                {(application.status === 'SUBMITTED' || application.status === 'SCREENING') && (
                  <button
                    type="button"
                    className="btn"
                    data-testid="move-to-shortlisted-btn"
                    disabled={updatingStatus}
                    onClick={() => void handleTransitionStatus('SHORTLISTED')}
                    style={{
                      width: '100%',
                      fontWeight: 600,
                    }}
                  >
                    Đưa vào Danh sách ngắn (SHORTLISTED)
                  </button>
                )}

                {/* Xếp lịch phỏng vấn */}
                <button
                  type="button"
                  className="btn"
                  data-testid="schedule-interview-btn"
                  onClick={() => navigate('/interviews')}
                  style={{
                    width: '100%',
                    fontWeight: 600,
                    background: 'var(--p1b)',
                    color: 'var(--p1f)',
                    borderColor: 'var(--amber)',
                  }}
                >
                  🗓️ Xem lịch phỏng vấn
                </button>

                {/* UI23: Nút công bố kết quả sau khi phỏng vấn */}
                {application.status === 'INTERVIEWED' && (
                  <button
                    type="button"
                    className="btn"
                    data-testid="publish-result-modal-btn"
                    onClick={() => setShowResultModal(true)}
                    style={{
                      width: '100%',
                      background: 'var(--green)',
                      borderColor: 'var(--green)',
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  >
                    📢 Công bố kết quả tuyển dụng (UI23)
                  </button>
                )}
              </div>
            ) : (
              <div
                style={{
                  padding: '0.85rem',
                  background: 'var(--soft)',
                  borderRadius: '10px',
                  fontSize: '0.85rem',
                  color: 'var(--muted)',
                }}
              >
                Hồ sơ đã đạt trạng thái kết thúc ({application.status}). Không thể chuyển trạng thái
                tiếp theo (BR09).
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Application Timeline / History (CandidateHistoryDto) */}
      <div
        className="card"
        style={{
          padding: '1.4rem',
          marginTop: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-d)' }}>
          Dòng thời gian & Lịch sử xử lý hồ sơ (History Timeline)
        </h3>

        <div
          data-testid="application-history-timeline"
          style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
        >
          {history.length > 0 ? (
            history.map((event) => (
              <div
                key={event.id}
                data-testid={`history-item-${event.eventType}`}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  padding: '0.75rem',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '6px',
                  borderLeft: '4px solid var(--color-primary)',
                }}
              >
                <div
                  style={{
                    minWidth: '160px',
                    fontSize: '0.8rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {formatDate(event.createdAt)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      alignItems: 'center',
                      marginBottom: '0.2rem',
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{event.eventType}</span>
                    {event.toStatus && <StatusBadge status={event.toStatus} size="sm" />}
                  </div>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text)' }}>
                    {event.publicMessage || 'Cập nhật trạng thái hồ sơ.'}
                  </p>
                  {event.newCvId && (
                    <div
                      style={{
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        marginTop: '2px',
                      }}
                    >
                      Phiên bản CV: {event.newCvId}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Chưa có sự kiện lịch sử nào được ghi nhận.
            </p>
          )}
        </div>
      </div>

      {/* UI23: Dialog Công bố kết quả tuyển dụng (UC09, BR13) */}
      <Dialog
        open={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Công bố kết quả tuyển dụng (UI23)"
        description="Quy tắc nghiệp vụ UC09: Công bố trạng thái HIRED hoặc REJECTED. Lý do từ chối nội bộ tuyệt đối không gửi cho ứng viên (BR13)."
      >
        <div data-testid="publish-result-modal-content">
          {resultModalError && (
            <div
              data-testid="result-modal-error"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {resultModalError}
            </div>
          )}

          {/* Result Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}>
              Kết quả tuyển dụng <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="resultChoice"
                  data-testid="result-hired-radio"
                  value="HIRED"
                  checked={resultChoice === 'HIRED'}
                  onChange={() => setResultChoice('HIRED')}
                />
                <span style={{ color: '#16a34a', fontWeight: 600 }}>Tuyển dụng (HIRED)</span>
              </label>

              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}
              >
                <input
                  type="radio"
                  name="resultChoice"
                  data-testid="result-rejected-radio"
                  value="REJECTED"
                  checked={resultChoice === 'REJECTED'}
                  onChange={() => setResultChoice('REJECTED')}
                />
                <span style={{ color: '#dc2626', fontWeight: 600 }}>Từ chối (REJECTED)</span>
              </label>
            </div>
          </div>

          {/* Public Message for Candidate */}
          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="result-message"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Thông điệp gửi cho ứng viên <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <textarea
              id="result-message"
              data-testid="result-message-input"
              rows={3}
              value={resultMessage}
              onChange={(e) => setResultMessage(e.target.value)}
              placeholder="VD: Cảm ơn bạn đã tham gia buổi phỏng vấn. Ban tuyển dụng Talento rất hân hạnh thông báo..."
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Internal Reject Reason (BR13: Required for REJECTED, strictly hidden from candidate) */}
          {resultChoice === 'REJECTED' && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label
                htmlFor="reject-reason"
                style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
              >
                Lý do từ chối nội bộ (BR13) <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <textarea
                id="reject-reason"
                data-testid="reject-reason-input"
                rows={2}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Ghi chú nội bộ đánh giá năng lực chưa phù hợp (không bao giờ gửi cho ứng viên)..."
                style={{
                  width: '100%',
                  padding: '0.6rem 0.8rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  fontSize: '0.9rem',
                }}
              />
              <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
                Bảo mật BR13: Lý do này chỉ lưu nội bộ phục vụ báo cáo và kiểm duyệt, ứng viên không
                thấy.
              </small>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setShowResultModal(false)}
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
              data-testid="confirm-publish-result-btn"
              disabled={publishingResult}
              onClick={() => void handleConfirmPublishResult()}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: resultChoice === 'HIRED' ? '#16a34a' : '#dc2626',
                color: '#fff',
                fontWeight: 600,
                cursor: publishingResult ? 'not-allowed' : 'pointer',
                opacity: publishingResult ? 0.7 : 1,
              }}
            >
              {publishingResult ? 'Đang công bố...' : 'Xác nhận công bố kết quả'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* CV Preview Modal */}
      <Dialog
        open={showCvModal}
        onClose={() => setShowCvModal(false)}
        title={`Xem CV: ${application.candidateSnapshot.name}`}
        description={`Phiên bản: ${application.currentCvVersionId}`}
      >
        <div
          data-testid="cv-preview-modal-content"
          style={{ textAlign: 'center', padding: '1rem' }}
        >
          <div
            style={{
              padding: '3rem 1rem',
              background: 'var(--color-bg-secondary)',
              border: '2px dashed var(--color-border)',
              borderRadius: '8px',
              marginBottom: '1rem',
            }}
          >
            <p style={{ margin: 0, fontWeight: 600 }}>
              Tệp PDF: {application.currentCvVersionId}.pdf
            </p>
            <p
              style={{
                color: 'var(--color-text-muted)',
                fontSize: '0.85rem',
                margin: '0.5rem 0 0',
              }}
            >
              Mã bảo mật chống mã độc đã kiểm duyệt an toàn (BR06)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCvModal(false)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '6px',
              background: 'var(--color-primary)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Đóng xem trước
          </button>
        </div>
      </Dialog>
    </div>
  );
};
