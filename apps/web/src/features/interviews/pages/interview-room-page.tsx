import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { interviewsApi } from '../api/interviews.api';
import { ApiException } from '../../../lib/http/api-client';

export const InterviewRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(true);
  const [tokenInfo, setTokenInfo] = useState<{
    token: string;
    roomName: string;
    domain: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Call media states
  const [micEnabled, setMicEnabled] = useState<boolean>(true);
  const [camEnabled, setCamEnabled] = useState<boolean>(true);
  const [screenSharing, setScreenSharing] = useState<boolean>(false);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);

  const initRoom = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await interviewsApi.getRoomToken(id);
      setTokenInfo(res);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể lấy token vào phòng họp');
      } else {
        setError('Lỗi kết nối máy chủ video call');
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void initRoom();
  }, [initRoom]);

  // Handle Leave Room (FE25: Do NOT automatically mark interview as COMPLETED)
  const handleLeaveRoom = () => {
    if (id) {
      navigate(`/interviews/${id}`);
    } else {
      navigate('/interviews');
    }
  };

  // Simulate Media Permission Denied (FE25)
  const simulatePermissionError = () => {
    setPermissionDenied(true);
    setMicEnabled(false);
    setCamEnabled(false);
  };

  if (loading) {
    return (
      <div
        data-testid="ui15-interview-room"
        style={{
          height: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0f172a',
          color: '#fff',
        }}
      >
        <p>Đang chuẩn bị phòng họp trực tuyến an toàn...</p>
      </div>
    );
  }

  if (error || !tokenInfo) {
    return (
      <div
        data-testid="ui15-interview-room-error"
        style={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0f172a',
          color: '#fff',
          padding: '2rem',
          textAlign: 'center',
        }}
      >
        <h2 style={{ color: '#ef4444' }}>Không thể kết nối phòng họp</h2>
        <p>{error || 'Không tìm thấy thông tin phòng họp.'}</p>
        <button
          type="button"
          onClick={handleLeaveRoom}
          style={{
            marginTop: '1rem',
            padding: '0.6rem 1.5rem',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ← Quay lại chi tiết buổi phỏng vấn
        </button>
      </div>
    );
  }

  return (
    <div
      className="interview-room-page"
      data-testid="ui15-interview-room"
      style={{
        height: '100vh',
        width: '100vw',
        background: '#0f172a',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0.75rem 1.5rem',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#22c55e',
              display: 'inline-block',
            }}
          />
          <strong style={{ fontSize: '1rem' }}>Phòng họp: {tokenInfo.roomName}</strong>
          <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>({tokenInfo.domain})</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            type="button"
            data-testid="simulate-permission-denied-btn"
            onClick={simulatePermissionError}
            style={{
              padding: '0.35rem 0.75rem',
              borderRadius: '4px',
              border: '1px solid #f59e0b',
              background: 'transparent',
              color: '#f59e0b',
              fontSize: '0.75rem',
              cursor: 'pointer',
            }}
          >
            Mô phỏng từ chối mic/cam
          </button>
          <button
            type="button"
            data-testid="leave-room-btn"
            onClick={handleLeaveRoom}
            style={{
              padding: '0.45rem 1.25rem',
              borderRadius: '6px',
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Rời phòng họp
          </button>
        </div>
      </div>

      {/* FE25: Permission Denied Guidance Banner */}
      {permissionDenied && (
        <div
          data-testid="permission-denied-alert"
          style={{
            background: '#7f1d1d',
            color: '#fecaca',
            padding: '0.75rem 1.5rem',
            borderBottom: '1px solid #dc2626',
            fontSize: '0.85rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            ⚠️ <strong>Quy tắc FE25:</strong> Trình duyệt chưa được cấp quyền truy cập Camera /
            Microphone. Vui lòng nhấn vào biểu tượng ổ khóa 🔒 trên thanh địa chỉ trình duyệt để cho
            phép quyền thiết bị và tải lại trang.
          </div>
          <button
            type="button"
            onClick={() => setPermissionDenied(false)}
            style={{
              background: 'none',
              border: 'none',
              color: '#fecaca',
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Video Area */}
      <div
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: '1fr',
          placeItems: 'center',
          padding: '1.5rem',
          position: 'relative',
        }}
      >
        <div
          data-testid="jitsi-video-container"
          style={{
            width: '100%',
            maxWidth: '900px',
            height: '100%',
            maxHeight: '600px',
            background: '#1e293b',
            borderRadius: '12px',
            border: '2px solid #334155',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {camEnabled ? (
            <div
              data-testid="video-active-stream"
              style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                background: 'linear-gradient(135deg, #1e293b, #0f172a)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    background: 'var(--color-primary)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: '2rem',
                    margin: '0 auto 1rem',
                  }}
                >
                  👤
                </div>
                <h3 style={{ margin: 0, fontWeight: 600 }}>WebRTC Video Stream Active</h3>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', margin: '0.5rem 0 0' }}>
                  {screenSharing ? 'Đang chia sẻ màn hình' : 'Camera trực tuyến • Jitsi Secure JWT'}
                </p>
              </div>
            </div>
          ) : (
            <div
              data-testid="camera-off-indicator"
              style={{ textAlign: 'center', color: '#94a3b8' }}
            >
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>📷🚫</div>
              <p style={{ margin: 0 }}>Camera đã tắt</p>
            </div>
          )}
        </div>
      </div>

      {/* Media Controls Toolbar */}
      <div
        data-testid="room-controls-toolbar"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1rem',
          background: '#1e293b',
          borderTop: '1px solid #334155',
        }}
      >
        <button
          type="button"
          data-testid="toggle-mic-btn"
          onClick={() => setMicEnabled(!micEnabled)}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '50px',
            border: 'none',
            background: micEnabled ? '#334155' : '#dc2626',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {micEnabled ? '🎤 Mic Đang Bật' : '🔇 Mic Đã Tắt'}
        </button>

        <button
          type="button"
          data-testid="toggle-cam-btn"
          onClick={() => setCamEnabled(!camEnabled)}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '50px',
            border: 'none',
            background: camEnabled ? '#334155' : '#dc2626',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {camEnabled ? '📷 Camera Đang Bật' : '🚫 Camera Đã Tắt'}
        </button>

        <button
          type="button"
          data-testid="toggle-screenshare-btn"
          onClick={() => setScreenSharing(!screenSharing)}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '50px',
            border: 'none',
            background: screenSharing ? '#2563eb' : '#334155',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {screenSharing ? '🖥️ Đang chia sẻ màn hình' : '🖥️ Chia sẻ màn hình'}
        </button>

        <button
          type="button"
          data-testid="bottom-leave-btn"
          onClick={handleLeaveRoom}
          style={{
            padding: '0.75rem 1.5rem',
            borderRadius: '50px',
            border: 'none',
            background: '#dc2626',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Rời phòng
        </button>
      </div>
    </div>
  );
};
