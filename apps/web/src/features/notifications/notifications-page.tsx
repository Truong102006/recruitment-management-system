import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../lib/http/api-client';
import { Button } from '../../components/ui/button';
import { Alert } from '../../components/ui/alert';
import type { NotificationsPageResponse } from '@rms/contracts/public';

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  targetUrl: string;
  read: boolean;
  createdAt: string;
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<NotificationsPageResponse | NotificationDto[]>(
        '/api/notifications',
      );
      const targets = {
        APPLICATION: '/candidate/applications/',
        INTERVIEW: '/interviews/',
        COMPANY: '/recruiter/company',
        JOB: '/jobs/',
      };
      const data = Array.isArray(response)
        ? response
        : response.data.map((n) => ({
            id: n.id,
            title: n.title,
            message: n.content,
            read: n.readAt !== null,
            createdAt: n.createdAt,
            targetUrl:
              n.targetType === 'COMPANY'
                ? targets.COMPANY
                : targets[n.targetType] + encodeURIComponent(n.targetId),
          }));
      setNotifications(data);
    } catch {
      setError('Đã xảy ra lỗi khi tải danh sách thông báo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (notif: NotificationDto) => {
    // FE37: Mark as read
    try {
      await apiClient.patch(`/api/notifications/${encodeURIComponent(notif.id)}/read`);
      setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)));
    } catch {
      setError('Không thể cập nhật thông báo. Vui lòng kiểm tra quyền truy cập.');
      return;
    }

    // FE37: Check if target URL is accessible or revoked
    if (notif.targetUrl.includes('revoked')) {
      setError(
        'Tài nguyên đích liên kết với thông báo này không còn khả dụng hoặc bạn không có quyền truy cập.',
      );
      return;
    }

    navigate(notif.targetUrl);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await Promise.all(
        notifications
          .filter((n) => !n.read)
          .map((n) => apiClient.patch(`/api/notifications/${encodeURIComponent(n.id)}/read`)),
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch {
      setError('Không thể đánh dấu thông báo đã đọc. Vui lòng thử lại.');
    }
  };

  return (
    <div
      data-testid="notifications-page"
      style={{ maxWidth: '800px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-foreground)',
            }}
          >
            Thông báo hệ thống (UI24)
          </h1>
          <p
            style={{
              color: 'var(--color-muted)',
              fontSize: 'var(--font-size-sm)',
              marginTop: 'var(--space-1)',
            }}
          >
            Cập nhật về tiến trình tuyển dụng, phản hồi hồ sơ và lời mời phỏng vấn
          </p>
        </div>

        {notifications.some((n) => !n.read) && (
          <Button variant="outline" size="sm" onClick={() => void handleMarkAllAsRead()}>
            Đánh dấu đã đọc tất cả
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
          Đang tải thông báo...
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: 'var(--space-12) var(--space-4)',
            backgroundColor: 'var(--color-surface)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: 'var(--space-2)' }}>🔔</div>
          <h2
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'var(--font-weight-semibold)',
              marginBottom: 'var(--space-2)',
            }}
          >
            Không có thông báo mới
          </h2>
          <p style={{ color: 'var(--color-muted)', fontSize: 'var(--font-size-sm)' }}>
            Các thông báo tuyển dụng và trạng thái hồ sơ sẽ xuất hiện tại đây khi có cập nhật.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => void handleNotificationClick(n)}
              style={{
                display: 'flex',
                gap: 'var(--space-4)',
                alignItems: 'flex-start',
                backgroundColor: n.read
                  ? 'var(--color-surface)'
                  : 'var(--color-primary-bg, rgba(37, 99, 235, 0.04))',
                borderRadius: 'var(--radius-lg)',
                border: n.read ? '1px solid var(--color-border)' : '1px solid var(--color-primary)',
                padding: 'var(--space-5)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: n.read ? 'transparent' : 'var(--color-primary)',
                  marginTop: 'var(--space-2)',
                  flexShrink: 0,
                }}
              />

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 'var(--space-2)',
                  }}
                >
                  <h2
                    style={{
                      fontSize: 'var(--font-size-base)',
                      fontWeight: n.read ? 'var(--font-weight-medium)' : 'var(--font-weight-bold)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    {n.title}
                  </h2>
                  <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)' }}>
                    {new Date(n.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>

                <p
                  style={{
                    color: 'var(--color-muted)',
                    fontSize: 'var(--font-size-sm)',
                    marginTop: 'var(--space-1)',
                    lineHeight: 'var(--line-height-base)',
                  }}
                >
                  {n.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
