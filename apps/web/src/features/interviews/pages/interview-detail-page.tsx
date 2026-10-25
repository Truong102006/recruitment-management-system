import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews.api';
import { StatusBadge } from '../../../components/ui/status-badge';
import { ApiException } from '../../../lib/http/api-client';
import type { DevInterviewItem } from '../../../lib/mocks/dev-mock-store';

export const InterviewDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<DevInterviewItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [updatingAttendance, setUpdatingAttendance] = useState<boolean>(false);

  // Time state for countdown & room window check (FE24)
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await interviewsApi.getInterviewDetail(id);
      setInterview(data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải chi tiết lịch phỏng vấn');
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

  const formatDate = (isoStr: string) => {
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

  // FE23: If any participant is PENDING, overall schedule is pending confirmation
  const isPendingConfirmation = useMemo(() => {
    if (!interview?.participants || interview.participants.length === 0) return false;
    return interview.participants.some((p) => p.responseStatus === 'PENDING');
  }, [interview]);

  // FE24: Room access window check (start_at - 10 min to end_at + 30 min)
  const roomWindow = useMemo(() => {
    if (!interview) {
      return { isAllowed: false, reason: 'Chưa có thông tin cuộc họp' };
    }
    const startMs = new Date(interview.startAt).getTime();
    const endMs = new Date(interview.endAt).getTime();
    const windowStartMs = startMs - 10 * 60 * 1000;
    const windowEndMs = endMs + 30 * 60 * 1000;

    if (currentTime < windowStartMs) {
      const minsLeft = Math.ceil((windowStartMs - currentTime) / 60000);
      return {
        isAllowed: false,
        reason: `Phòng họp mở trước giờ bắt đầu 10 phút (còn khoảng ${minsLeft} phút).`,
      };
    }
    if (currentTime > windowEndMs) {
      return {
        isAllowed: false,
        reason: 'Buổi phỏng vấn đã kết thúc quá 30 phút, phòng họp đã đóng.',
      };
    }
    return { isAllowed: true, reason: 'Phòng họp đang mở. Bạn có thể vào phòng ngay.' };
  }, [interview, currentTime]);

  // Handle Record Attendance
  const handleRecordAttendance = async (
    participantId: string,
    status: 'ATTENDED' | 'ABSENT' | 'NO_SHOW',
  ) => {
    if (!id) return;
    setUpdatingAttendance(true);
    setError(null);
    try {
      const updated = await interviewsApi.recordAttendance(id, participantId, status);
      setInterview(updated);
      setSuccessMessage(`Đã cập nhật điểm danh: ${status}`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Lỗi cập nhật điểm danh');
      } else {
        setError('Không thể cập nhật điểm danh');
      }
    } finally {
      setUpdatingAttendance(false);
    }
  };

  if (loading) {
    return (
      <div
        className="interview-detail-page"
        data-testid="ui14-interview-detail"
        style={{ padding: '2rem' }}
      >
        <p>Đang tải thông tin buổi phỏng vấn...</p>
      </div>
    );
  }

  if (!interview) {
    return (
      <div
        className="interview-detail-page"
        data-testid="ui14-interview-detail"
        style={{ padding: '2rem' }}
      >
        <h2>Chi tiết Buổi Phỏng vấn</h2>
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
          <p>Không tìm thấy buổi phỏng vấn yêu cầu.</p>
        )}
        <button
          type="button"
          onClick={() => navigate('/interviews')}
          style={{ padding: '0.5rem 1rem', borderRadius: '6px', cursor: 'pointer' }}
        >
          ← Quay lại Lịch phỏng vấn
        </button>
      </div>
    );
  }

  return (
    <div
      className="interview-detail-page"
      data-testid="ui14-interview-detail"
      style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}
    >
      {/* Top Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <button
          type="button"
          className="btn sm"
          onClick={() => navigate('/interviews')}
          style={{
            padding: '6px 12px',
            marginBottom: '0.75rem',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          ← Quay lại danh sách lịch
        </button>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-d)', fontSize: '1.85rem', fontWeight: 600, letterSpacing: '-0.02em', margin: '0 0 0.35rem' }}>
              Buổi phỏng vấn: {interview.candidateName}
            </h1>
            <p style={{ color: 'var(--ink2)', margin: 0, fontSize: '0.95rem' }}>
              Vị trí tuyển dụng: <strong style={{ color: 'var(--blue)' }}>{interview.jobTitle}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <StatusBadge status={interview.format} size="md" />
            <StatusBadge status={interview.status} size="md" />
          </div>
        </div>
      </div>

      {/* FE23: Pending confirmation banner */}
      {isPendingConfirmation && (
        <div
          data-testid="schedule-pending-alert"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--p1b)',
            border: '1px solid var(--amber)',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            color: 'var(--p1f)',
            fontSize: '0.9rem',
          }}
        >
          ⏳ <strong>Quy tắc FE23:</strong> Cuộc họp vẫn đang ở trạng thái <em>chờ xác nhận</em>{' '}
          (PROPOSED) do có người tham gia chưa phản hồi (PENDING). Lịch chưa chính thức chốt
          CONFIRMED.
        </div>
      )}

      {/* Notifications */}
      {successMessage && (
        <div
          data-testid="success-alert"
          style={{
            padding: '0.85rem 1.25rem',
            background: 'var(--p2b)',
            border: '1px solid var(--green)',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            color: 'var(--p2f)',
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
            background: 'var(--p3b)',
            border: '1px solid var(--red)',
            borderRadius: '12px',
            marginBottom: '1.25rem',
            color: 'var(--p3f)',
          }}
        >
          {error}
        </div>
      )}

      {/* Overview Card */}
      <div
        className="card"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          padding: '1.4rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>
            Thời gian bắt đầu
          </span>
          <strong data-testid="interview-start-time" style={{ color: 'var(--ink)' }}>{formatDate(interview.startAt)}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>
            Thời gian kết thúc
          </span>
          <strong data-testid="interview-end-time" style={{ color: 'var(--ink)' }}>{formatDate(interview.endAt)}</strong>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>
            Thời lượng
          </span>
          <span style={{ color: 'var(--ink)' }}>{interview.durationMinutes} phút</span>
        </div>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block', marginBottom: '2px' }}>
            Hình thức & Địa điểm
          </span>
          <span data-testid="interview-location" style={{ color: 'var(--ink)' }}>
            {interview.format === 'ONLINE' ? 'Trực tuyến (WebRTC)' : 'Trực tiếp tại văn phòng'} —{' '}
            {interview.locationOrMeetingLink}
          </span>
        </div>
      </div>

      {/* Join Room Section (FE24) */}
      {interview.format === 'ONLINE' && (
        <div
          className="card"
          data-testid="join-room-card"
          style={{
            background: roomWindow.isAllowed ? 'var(--p2b)' : 'var(--soft)',
            border: `1px solid ${roomWindow.isAllowed ? 'var(--green)' : 'var(--hair)'}`,
            padding: '1.4rem',
            marginBottom: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <h3 style={{ margin: '0 0 0.3rem', fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-d)' }}>
              📹 Phòng phỏng vấn trực tuyến Jitsi (UI15)
            </h3>
            <p
              data-testid="room-window-message"
              style={{
                margin: 0,
                fontSize: '0.85rem',
                color: roomWindow.isAllowed ? 'var(--p2f)' : 'var(--muted)',
              }}
            >
              {roomWindow.reason}
            </p>
          </div>
          <button
            type="button"
            className="btn primary"
            data-testid="join-room-btn"
            disabled={!roomWindow.isAllowed}
            onClick={() => navigate(`/interviews/${interview.id}/room`)}
            style={{
              padding: '0.65rem 1.5rem',
              fontWeight: 600,
              cursor: roomWindow.isAllowed ? 'pointer' : 'not-allowed',
              opacity: roomWindow.isAllowed ? 1 : 0.6,
            }}
          >
            Vào phòng phỏng vấn →
          </button>
        </div>
      )}

      {/* Participants & Responses Section (FE23) */}
      <div
        className="card"
        style={{
          padding: '1.4rem',
          marginBottom: '1.5rem',
        }}
      >
        <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem', fontWeight: 600, fontFamily: 'var(--font-d)' }}>
          Danh sách Người tham gia & Điểm danh
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {(interview.participants || []).map((p) => (
            <div
              key={p.userId}
              data-testid={`participant-row-${p.userId}`}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1.15rem',
                background: 'var(--soft)',
                borderRadius: '12px',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div>
                <strong style={{ fontSize: '0.95rem', color: 'var(--ink)' }}>{p.fullName}</strong>
                <span
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--muted)',
                    marginLeft: '0.5rem',
                  }}
                >
                  ({p.role}) • {p.email}
                </span>
                <div style={{ marginTop: '0.2rem', fontSize: '0.8rem' }}>
                  Trạng thái phản hồi:{' '}
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        p.responseStatus === 'ACCEPTED'
                          ? 'var(--green)'
                          : p.responseStatus === 'DECLINED'
                            ? 'var(--red)'
                            : 'var(--amber)',
                    }}
                  >
                    {p.responseStatus}
                  </span>
                  {p.attendanceStatus && (
                    <span style={{ marginLeft: '1rem', color: 'var(--blue)', fontWeight: 600 }}>
                      Điểm danh: {p.attendanceStatus}
                    </span>
                  )}
                </div>
              </div>

              {/* Attendance action buttons */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn sm"
                  data-testid={`mark-attended-${p.userId}`}
                  disabled={updatingAttendance}
                  onClick={() => void handleRecordAttendance(p.userId, 'ATTENDED')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--green)',
                    background: p.attendanceStatus === 'ATTENDED' ? 'var(--green)' : 'transparent',
                    color: p.attendanceStatus === 'ATTENDED' ? '#fff' : 'var(--green)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Có mặt
                </button>
                <button
                  type="button"
                  className="btn sm"
                  data-testid={`mark-absent-${p.userId}`}
                  disabled={updatingAttendance}
                  onClick={() => void handleRecordAttendance(p.userId, 'ABSENT')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--amber)',
                    background: p.attendanceStatus === 'ABSENT' ? 'var(--amber)' : 'transparent',
                    color: p.attendanceStatus === 'ABSENT' ? '#fff' : 'var(--amber)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Vắng mặt
                </button>
                <button
                  type="button"
                  className="btn sm"
                  data-testid={`mark-noshow-${p.userId}`}
                  disabled={updatingAttendance}
                  onClick={() => void handleRecordAttendance(p.userId, 'NO_SHOW')}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid var(--red)',
                    background: p.attendanceStatus === 'NO_SHOW' ? 'var(--red)' : 'transparent',
                    color: p.attendanceStatus === 'NO_SHOW' ? '#fff' : 'var(--red)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  No-show
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluation Link Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button
          type="button"
          className="btn primary"
          data-testid="go-to-evaluation-btn"
          onClick={() => navigate(`/interviews/${interview.id}/evaluation`)}
          style={{
            fontWeight: 600,
          }}
        >
          📝 Điền phiếu đánh giá phỏng vấn (UI22) →
        </button>
      </div>
    </div>
  );
};
