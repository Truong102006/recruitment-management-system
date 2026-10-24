import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';
import { Dialog } from '../../../components/ui/dialog';
import type { AuditLogItem } from '../../../lib/mocks/dev-mock-store';

export const AdminAuditPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('ALL');

  // Selected Log for detail modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const loadAuditLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getAuditLogs({
        entityType: entityTypeFilter !== 'ALL' ? entityTypeFilter : undefined,
        q: searchQuery.trim() || undefined,
      });
      setLogs(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải nhật ký audit');
    } finally {
      setLoading(false);
    }
  }, [entityTypeFilter, searchQuery]);

  useEffect(() => {
    void loadAuditLogs();
  }, [loadAuditLogs]);

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

  const getActionBadgeStyle = (action: string): React.CSSProperties => {
    if (
      action.includes('SUSPEND') ||
      action.includes('BAN') ||
      action.includes('CLOSE') ||
      action.includes('REJECT')
    ) {
      return {
        background: '#fef2f2',
        color: '#b91c1c',
        border: '1px solid #fecaca',
      };
    }
    if (
      action.includes('APPROVE') ||
      action.includes('ACTIVE') ||
      action.includes('UNSUSPEND') ||
      action.includes('RECOVER')
    ) {
      return {
        background: '#ecfdf5',
        color: '#047857',
        border: '1px solid #a7f3d0',
      };
    }
    if (action.includes('RETRY')) {
      return {
        background: '#fffbeb',
        color: '#b45309',
        border: '1px solid #fde68a',
      };
    }
    return {
      background: 'var(--tint-bg)',
      color: 'var(--tint-fg)',
      border: '1px solid var(--line)',
    };
  };

  return (
    <div
      className="admin-audit-page"
      data-testid="ui28-admin-audit"
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
                background: 'var(--tint-bg)',
                color: 'var(--tint-fg)',
              }}
            >
              UI28
            </span>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                margin: 0,
                color: 'var(--ink)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span role="img" aria-label="audit-icon" style={{ fontSize: '1.5rem' }}>
                📋
              </span>
              Nhật ký Audit Hệ thống
            </h1>
          </div>
          <p style={{ color: 'var(--muted)', margin: 0, fontSize: '0.9rem' }}>
            Tra cứu toàn bộ lịch sử thao tác, xác thực danh tính actor, loại đối tượng và mã vết
            traceId.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadAuditLogs()}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: '1px solid var(--line)',
            background: 'var(--card)',
            color: 'var(--ink)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          <span>🔄</span> Làm mới
        </button>
      </div>

      {/* Filter Bar */}
      <div
        style={{
          background: 'var(--card)',
          padding: '1rem',
          borderRadius: '12px',
          border: '1px solid var(--line)',
          marginBottom: '1.25rem',
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: '280px' }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Actor ID, Entity ID, Trace ID, Hành động..."
            style={{
              width: '100%',
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              fontSize: '0.9rem',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Thực thể:</span>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card)',
              color: 'var(--ink)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="ALL">Tất cả thực thể</option>
            <option value="COMPANY">COMPANY (Doanh nghiệp)</option>
            <option value="USER">USER (Người dùng)</option>
            <option value="JOB">JOB (Tin tuyển dụng)</option>
            <option value="OUTBOX">OUTBOX (Sự kiện Outbox)</option>
            <option value="INTERVIEW">INTERVIEW (Phỏng vấn)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
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
            onClick={() => void loadAuditLogs()}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-danger)',
              textDecoration: 'underline',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Section */}
      <div
        style={{
          background: 'var(--card)',
          border: '1px solid var(--line)',
          borderRadius: '16px',
          overflowX: 'auto',
          boxShadow: 'var(--sh-s)',
        }}
      >
        <table
          role="table"
          aria-label="Bảng nhật ký audit"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13.5px',
          }}
        >
          <thead>
            <tr
              style={{
                background: 'var(--soft2)',
                borderBottom: '1px solid var(--line)',
              }}
            >
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink2)' }}>
                Thời gian
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink2)' }}>
                Hành động
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink2)' }}>
                Loại thực thể
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink2)' }}>
                ID Thực thể
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink2)' }}>
                Người thực hiện
              </th>
              <th style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--ink2)' }}>
                Trace ID
              </th>
              <th
                style={{
                  padding: '12px 14px',
                  fontWeight: 600,
                  color: 'var(--ink2)',
                  textAlign: 'right',
                }}
              >
                Chi tiết
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
                    color: 'var(--muted)',
                  }}
                >
                  Đang tải nhật ký audit...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem',
                    color: 'var(--muted)',
                  }}
                >
                  Không tìm thấy bản ghi nhật ký audit nào phù hợp.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr
                  key={log.id}
                  style={{
                    borderBottom: '1px solid var(--line)',
                  }}
                >
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <div
                      style={{
                        fontFamily: 'monospace',
                        fontSize: '0.8rem',
                        color: 'var(--muted)',
                      }}
                    >
                      {formatDateTime(log.createdAt)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        ...getActionBadgeStyle(log.action),
                      }}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      whiteSpace: 'nowrap',
                      fontWeight: 600,
                      color: 'var(--ink)',
                    }}
                  >
                    <span
                      style={{
                        background: 'var(--soft2)',
                        border: '1px solid var(--line)',
                        color: 'var(--ink2)',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                      }}
                    >
                      {log.entityType}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                    }}
                  >
                    {log.entityId}
                  </td>
                  <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: 'var(--ink)',
                      }}
                    >
                      {log.actorId}
                    </span>
                  </td>
                  <td
                    style={{
                      padding: '12px 14px',
                      whiteSpace: 'nowrap',
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      color: 'var(--muted)',
                    }}
                  >
                    {log.traceId.length > 14 ? `${log.traceId.slice(0, 14)}...` : log.traceId}
                  </td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => setSelectedLog(log)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        border: '1px solid var(--blue)',
                        background: 'var(--tint-bg)',
                        color: 'var(--tint-fg)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Xem Metadata
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Metadata Detail Modal */}
      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title="Chi tiết Nhật ký Audit"
        description="Toàn bộ thông số metadata, actor, thực thể và mã traceId của sự kiện."
      >
        {selectedLog && (
          <div
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.75rem',
                background: 'var(--soft2)',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--line)',
              }}
            >
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>
                  Mã ghi nhật ký:
                </span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--ink)' }}>
                  {selectedLog.id}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>
                  Thời gian:
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {formatDateTime(selectedLog.createdAt)}
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>
                  Thực thể & ID:
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>
                  {selectedLog.entityType} ({selectedLog.entityId})
                </span>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>
                  Người thực hiện (Actor):
                </span>
                <span style={{ fontWeight: 600, color: 'var(--ink)' }}>{selectedLog.actorId}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>
                  Mô tả / Diễn giải:
                </span>
                <span style={{ color: 'var(--ink)' }}>{selectedLog.details}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--muted)', display: 'block' }}>
                  Mã vết giao dịch (Trace ID):
                </span>
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    display: 'block',
                    marginTop: '2px',
                    wordBreak: 'break-all',
                  }}
                >
                  {selectedLog.traceId}
                </span>
              </div>
            </div>

            <div>
              <span
                style={{
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.4rem',
                  color: 'var(--ink)',
                }}
              >
                Dữ liệu Metadata:
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
                  maxHeight: '240px',
                  margin: 0,
                }}
              >
                {JSON.stringify(selectedLog.metadata ?? { details: selectedLog.details }, null, 2)}
              </pre>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: '0.55rem 1.2rem',
                  borderRadius: '6px',
                  border: '1px solid var(--line)',
                  background: 'var(--card)',
                  color: 'var(--ink)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
