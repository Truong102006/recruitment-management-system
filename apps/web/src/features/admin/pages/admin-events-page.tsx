import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';
import { Dialog } from '../../../components/ui/dialog';
import type { OutboxEventItem } from '../../../lib/mocks/dev-mock-store';

export const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<OutboxEventItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Detail Modal
  const [selectedEvent, setSelectedEvent] = useState<OutboxEventItem | null>(null);

  // Retry Confirmation Dialog (FE41)
  const [retryTargetEvent, setRetryTargetEvent] = useState<OutboxEventItem | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);

  const loadOutboxEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getOutboxEvents({
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setEvents(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách sự kiện Outbox');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    void loadOutboxEvents();
  }, [loadOutboxEvents]);

  const handleExecuteRetry = async () => {
    if (!retryTargetEvent) return;

    try {
      setRetrying(true);
      setError(null);
      await adminApi.retryOutboxEvent(retryTargetEvent.id);
      setSuccessMessage(
        `Đã kích hoạt retry thành công cho sự kiện #${retryTargetEvent.id}. Trạng thái đã được cập nhật.`,
      );
      setRetryTargetEvent(null);
      // Reload list
      await loadOutboxEvents();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kích hoạt retry thất bại');
    } finally {
      setRetrying(false);
    }
  };

  const formatDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  const getStatusBadge = (status: OutboxEventItem['status']) => {
    switch (status) {
      case 'PUBLISHED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
            }}
          >
            ✓ Đã phát hành (PUBLISHED)
          </span>
        );
      case 'FAILED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#fef2f2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            }}
          >
            ⚠ Thất bại (FAILED)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '2px 8px',
              borderRadius: '999px',
              fontSize: '0.75rem',
              fontWeight: 600,
              background: '#fffbeb',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          >
            ◷ Chờ xử lý (PENDING)
          </span>
        );
    }
  };

  // FE41: Sanitize payload to ensure no sensitive tokens/secrets are exposed in UI
  const sanitizePayload = (payload: unknown): unknown => {
    if (!payload || typeof payload !== 'object') return payload;

    const copy = JSON.parse(JSON.stringify(payload)) as Record<string, unknown>;
    const sensitiveKeys = [
      'token',
      'accesstoken',
      'refreshtoken',
      'secret',
      'password',
      'authorization',
    ];

    const redact = (obj: Record<string, unknown>) => {
      for (const [key, val] of Object.entries(obj)) {
        if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
          obj[key] = '***REDACTED***';
        } else if (val && typeof val === 'object') {
          redact(val as Record<string, unknown>);
        }
      }
    };

    redact(copy);
    return copy;
  };

  return (
    <div
      className="admin-events-page"
      data-testid="ui28-admin-events"
      style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem' }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: 'var(--color-primary-subtle)',
                color: 'var(--color-primary)',
              }}
            >
              UI28 • FE41
            </span>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                margin: 0,
                color: 'var(--color-text)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span role="img" aria-label="outbox-icon" style={{ fontSize: '1.5rem' }}>
                ⚡
              </span>
              Sự kiện Outbox & Giám sát Retry
            </h1>
          </div>
          <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Theo dõi tính toàn vẹn sự kiện phát hành qua Transactional Outbox và kích hoạt cơ chế
            Retry an toàn (FE41).
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadOutboxEvents()}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.55rem 1rem',
            borderRadius: '6px',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-surface)',
            color: 'var(--color-text)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <span>🔄</span> Làm mới
        </button>
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
            marginBottom: '1rem',
            color: 'var(--color-success)',
            fontSize: '0.9rem',
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
            marginBottom: '1rem',
            color: 'var(--color-danger)',
            fontSize: '0.9rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Đóng
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Trạng thái:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-surface)',
              color: 'var(--color-text)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="FAILED">⚠ FAILED (Sự kiện lỗi cần retry)</option>
            <option value="PENDING">◷ PENDING (Đang chờ phát)</option>
            <option value="PUBLISHED">✓ PUBLISHED (Đã phát thành công)</option>
          </select>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
          Tổng số sự kiện: <strong style={{ color: 'var(--color-text)' }}>{events.length}</strong>
        </div>
      </div>

      {/* Events Table */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          overflowX: 'auto',
          boxShadow: 'var(--sh-s, 0 1px 3px rgba(0,0,0,0.05))',
        }}
      >
        <table
          role="table"
          aria-label="Bảng sự kiện outbox"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '0.875rem',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--color-bg-secondary, #f8fafc)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Mã Event / Trace ID
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Tên Sự kiện (Type)
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Trạng thái
              </th>
              <th
                style={{
                  padding: '12px 14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  textAlign: 'center',
                }}
              >
                Số lần Retry
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Lỗi gần nhất
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--color-text)' }}>
                Thời gian tạo
              </th>
              <th
                style={{
                  padding: '12px 14px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  textAlign: 'right',
                }}
              >
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Đang tải danh sách sự kiện Outbox...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  Không có sự kiện outbox nào phù hợp với bộ lọc hiện tại.
                </td>
              </tr>
            ) : (
              events.map((evt) => (
                <tr
                  key={evt.id}
                  style={{
                    borderBottom: '1px solid var(--color-border)',
                  }}
                >
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        fontSize: '0.85rem',
                        color: 'var(--color-primary)',
                      }}
                    >
                      {evt.id}
                    </div>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.75rem',
                        color: 'var(--color-text-muted)',
                        maxWidth: '160px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {evt.traceId || evt.aggregateId}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        background: 'var(--color-bg-secondary, #f1f5f9)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        color: 'var(--color-text)',
                      }}
                    >
                      {evt.eventType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    {getStatusBadge(evt.status)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          evt.retryCount > 0 ? '#fef3c7' : 'var(--color-bg-secondary, #f1f5f9)',
                        color: evt.retryCount > 0 ? '#b45309' : 'var(--color-text-muted)',
                      }}
                    >
                      {evt.retryCount}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      color: evt.lastError ? '#dc2626' : 'var(--color-text-muted)',
                      maxWidth: '260px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {evt.lastError ? (
                      <span title={evt.lastError}>{evt.lastError}</span>
                    ) : (
                      <span style={{ fontStyle: 'italic' }}>Không có lỗi</span>
                    )}
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      fontSize: '0.8rem',
                      color: 'var(--color-text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatDateTime(evt.createdAt)}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        gap: '0.5rem',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedEvent(evt)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-border)',
                          background: 'var(--color-bg-surface)',
                          color: 'var(--color-text)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Chi tiết
                      </button>

                      {/* Retry Button: FE41 - only for FAILED events */}
                      {evt.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={() => setRetryTargetEvent(evt)}
                          data-testid={`retry-btn-${evt.id}`}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '4px',
                            border: '1px solid #d97706',
                            background: '#fef3c7',
                            color: '#92400e',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      <Dialog
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title="Chi tiết Sự kiện Outbox"
        description="Thông tin kỹ thuật, payload sự kiện đã che giấu khóa bí mật (FE41) và nhật ký lỗi."
      >
        {selectedEvent && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem',
                background: 'var(--color-bg-secondary, #f8fafc)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
              }}
            >
              <div>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}
                >
                  Mã Event ID:
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{selectedEvent.id}</span>
              </div>
              <div>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}
                >
                  Loại Event:
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedEvent.eventType}
                </span>
              </div>
              <div>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}
                >
                  Trạng thái:
                </span>
                {getStatusBadge(selectedEvent.status)}
              </div>
              <div>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}
                >
                  Số lần đã Retry:
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedEvent.retryCount}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}
                >
                  Aggregate Type & ID:
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
                  {selectedEvent.aggregateType} — {selectedEvent.aggregateId}
                </span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span
                  style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block' }}
                >
                  Mã vết Trace ID:
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    background: 'var(--color-bg)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'block',
                    marginTop: '2px',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedEvent.traceId}
                </span>
              </div>
            </div>

            {selectedEvent.lastError && (
              <div>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: '#dc2626',
                    display: 'block',
                    marginBottom: '0.4rem',
                  }}
                >
                  Chi tiết lỗi lần gần nhất:
                </span>
                <pre
                  style={{
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#991b1b',
                    padding: '0.8rem',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-all',
                    margin: 0,
                  }}
                >
                  {selectedEvent.lastError}
                </pre>
              </div>
            )}

            <div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.4rem',
                }}
              >
                Dữ liệu Payload (FE41 - Đã khử các khóa nhạy cảm token/secrets):
              </span>
              <pre
                style={{
                  background: '#0f172a',
                  color: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  overflowX: 'auto',
                  maxHeight: '220px',
                  margin: 0,
                }}
              >
                {JSON.stringify(sanitizePayload(selectedEvent.payload), null, 2)}
              </pre>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>

              {selectedEvent.status === 'FAILED' && (
                <button
                  type="button"
                  onClick={() => {
                    const target = selectedEvent;
                    setSelectedEvent(null);
                    setRetryTargetEvent(target);
                  }}
                  style={{
                    padding: '0.55rem 1.25rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#d97706',
                    color: '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Kích hoạt Retry
                </button>
              )}
            </div>
          </div>
        )}
      </Dialog>

      {/* Retry Confirmation Modal (FE41) */}
      <Dialog
        open={Boolean(retryTargetEvent)}
        onClose={() => {
          if (!retrying) setRetryTargetEvent(null);
        }}
        title="Xác nhận kích hoạt Retry sự kiện"
        description="Quy định an toàn & Audit (FE41): Sự kiện được đưa lại vào hàng đợi xử lý ngay lập tức."
      >
        {retryTargetEvent && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}
          >
            <p style={{ margin: 0 }}>
              Bạn có chắc chắn muốn phát lại sự kiện{' '}
              <strong style={{ fontFamily: 'monospace' }}>{retryTargetEvent.eventType}</strong> (ID:{' '}
              <span style={{ fontFamily: 'monospace' }}>{retryTargetEvent.id}</span>)?
            </p>

            <div
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
                borderRadius: '8px',
                padding: '0.85rem 1rem',
                fontSize: '0.8rem',
                color: '#92400e',
              }}
            >
              <p style={{ fontWeight: 600, margin: '0 0 0.4rem' }}>
                Quy định an toàn & Audit (FE41):
              </p>
              <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                <li>Sự kiện sẽ được đưa về hàng đợi xử lý ngay lập tức.</li>
                <li>Thao tác Retry này sẽ được ghi nhận vào nhật ký Audit của hệ thống.</li>
                <li>Không làm lộ thông tin bí mật hay thông tin đăng nhập trong payload.</li>
              </ul>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                marginTop: '0.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => setRetryTargetEvent(null)}
                disabled={retrying}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-bg-surface)',
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  cursor: retrying ? 'not-allowed' : 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => void handleExecuteRetry()}
                disabled={retrying}
                data-testid="confirm-retry-btn"
                style={{
                  padding: '0.55rem 1.25rem',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#d97706',
                  color: '#fff',
                  fontWeight: 600,
                  cursor: retrying ? 'not-allowed' : 'pointer',
                  opacity: retrying ? 0.6 : 1,
                }}
              >
                {retrying ? 'Đang kích hoạt...' : 'Xác nhận Retry'}
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
