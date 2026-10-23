import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';
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
    loadOutboxEvents();
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            ✓ Đã phát hành (PUBLISHED)
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            ⚠ Thất bại (FAILED)
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            ◷ Chờ xử lý (PENDING)
          </span>
        );
    }
  };

  // FE41: Sanitize payload to ensure no sensitive tokens/secrets are exposed in UI
  const sanitizePayload = (payload: Record<string, unknown>) => {
    const copy = { ...payload };
    const sensitiveKeys = ['token', 'secret', 'password', 'key', 'accessToken', 'refreshToken'];
    for (const k of Object.keys(copy)) {
      if (sensitiveKeys.some((s) => k.toLowerCase().includes(s))) {
        copy[k] = '***REDACTED***';
      }
    }
    return copy;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="ui28-admin-events">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
              UI28
            </span>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Sự kiện Outbox & Giám sát Retry
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Theo dõi tính toàn vẹn sự kiện phát hành qua Transactional Outbox và kích hoạt cơ chế
            Retry an toàn (FE41).
          </p>
        </div>

        <button
          onClick={() => loadOutboxEvents()}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
        >
          <svg
            className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Làm mới
        </button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {(['ALL', 'FAILED', 'PENDING', 'PUBLISHED'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              statusFilter === tab
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            {tab === 'ALL' && 'Tất cả trạng thái'}
            {tab === 'FAILED' && 'Chỉ sự kiện Lỗi (FAILED)'}
            {tab === 'PENDING' && 'Chờ gửi (PENDING)'}
            {tab === 'PUBLISHED' && 'Thành công (PUBLISHED)'}
          </button>
        ))}
      </div>

      {/* Success banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center justify-between">
          <span>✓ {successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-semibold"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="underline font-semibold hover:text-red-800"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Mã Event / Trace ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">
                  Tên Sự kiện (Type)
                </th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Số lần Retry</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Lỗi gần nhất</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Thời gian tạo</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Đang tải danh sách sự kiện Outbox...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Không có sự kiện outbox nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-800 whitespace-nowrap">
                      <div className="font-semibold text-blue-600">{evt.id}</div>
                      <div className="text-gray-400 text-[11px] truncate max-w-[140px]">
                        {evt.traceId || evt.aggregateId}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-xs font-mono">
                        {evt.eventType}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{getStatusBadge(evt.status)}</td>
                    <td className="px-4 py-3 text-center whitespace-nowrap font-mono text-xs">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-semibold ${
                          evt.retryCount > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {evt.retryCount}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-red-600 max-w-xs truncate">
                      {evt.lastError ? (
                        <span title={evt.lastError}>{evt.lastError}</span>
                      ) : (
                        <span className="text-gray-400 italic">Không có lỗi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {formatDateTime(evt.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => setSelectedEvent(evt)}
                        className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100"
                      >
                        Chi tiết
                      </button>

                      {/* Retry Button: FE41 - only for FAILED events */}
                      {evt.status === 'FAILED' && (
                        <button
                          onClick={() => setRetryTargetEvent(evt)}
                          className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 font-medium px-2.5 py-1 rounded-md transition-colors"
                          data-testid={`retry-btn-${evt.id}`}
                        >
                          Retry
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedEvent(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-detail-title"
            className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4"
          >
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 id="event-detail-title" className="font-semibold text-gray-900">
                Chi tiết Sự kiện Outbox
              </h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Mã Event ID:</span>
                <span className="font-mono text-gray-800 font-medium">{selectedEvent.id}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Loại Event:</span>
                <span className="font-semibold text-gray-800 font-mono">
                  {selectedEvent.eventType}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Trạng thái:</span>
                {getStatusBadge(selectedEvent.status)}
              </div>
              <div>
                <span className="text-gray-500 block">Số lần đã Retry:</span>
                <span className="font-mono text-gray-800 font-semibold">
                  {selectedEvent.retryCount}
                </span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block">Trace ID / Aggregate ID:</span>
                <span className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded block mt-0.5">
                  {selectedEvent.traceId || selectedEvent.aggregateId}
                </span>
              </div>
              {selectedEvent.lastError && (
                <div className="col-span-2">
                  <span className="text-red-500 font-medium block">
                    Thông điệp Lỗi (Last Error):
                  </span>
                  <div className="bg-red-50 text-red-800 p-2.5 rounded text-xs border border-red-200 mt-1 font-mono">
                    {selectedEvent.lastError}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-gray-700">Dữ liệu Payload:</span>
                <span className="text-[11px] text-gray-400 italic">
                  (FE41: Tự động ẩn các trường bí mật/token nhạy cảm)
                </span>
              </div>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
                {JSON.stringify(sanitizePayload(selectedEvent.payload || {}), null, 2)}
              </pre>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Đóng
              </button>
              {selectedEvent.status === 'FAILED' && (
                <button
                  onClick={() => {
                    const evt = selectedEvent;
                    setSelectedEvent(null);
                    setRetryTargetEvent(evt);
                  }}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5"
                >
                  Kích hoạt Retry
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Retry Confirmation Modal (FE41) */}
      {retryTargetEvent && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !retrying) setRetryTargetEvent(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="retry-confirm-title"
            className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4"
          >
            <h3 id="retry-confirm-title" className="font-semibold text-gray-900 text-lg">
              Xác nhận kích hoạt Retry sự kiện
            </h3>

            <p className="text-sm text-gray-600">
              Bạn có chắc chắn muốn phát lại sự kiện{' '}
              <strong className="font-mono text-gray-900">{retryTargetEvent.eventType}</strong> (ID:{' '}
              <span className="font-mono text-gray-800">{retryTargetEvent.id}</span>)?
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-semibold mb-1">Quy định an toàn & Audit (FE41):</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>Sự kiện sẽ được đưa về hàng đợi xử lý ngay lập tức.</li>
                <li>Thao tác Retry này sẽ được ghi nhận vào nhật ký Audit của hệ thống.</li>
                <li>Không làm lộ thông tin bí mật hay thông tin đăng nhập trong payload.</li>
              </ul>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRetryTargetEvent(null)}
                disabled={retrying}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleExecuteRetry}
                disabled={retrying}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm disabled:opacity-50"
                data-testid="confirm-retry-btn"
              >
                {retrying ? 'Đang kích hoạt...' : 'Xác nhận Retry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
