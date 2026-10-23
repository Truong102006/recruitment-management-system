import React, { useState, useEffect, useCallback } from 'react';
import { adminApi } from '../api/admin.api';
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
    loadAuditLogs();
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

  const getActionBadgeColor = (action: string) => {
    if (
      action.includes('SUSPEND') ||
      action.includes('BAN') ||
      action.includes('CLOSE') ||
      action.includes('REJECT')
    ) {
      return 'bg-red-50 text-red-700 border-red-200';
    }
    if (
      action.includes('APPROVE') ||
      action.includes('ACTIVE') ||
      action.includes('UNSUSPEND') ||
      action.includes('RECOVER')
    ) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (action.includes('RETRY')) {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="ui28-admin-audit">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Nhật ký Audit Hệ thống
            </h1>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Tra cứu toàn bộ lịch sử thao tác, xác thực danh tính actor, loại đối tượng và mã vết
            traceId.
          </p>
        </div>

        <button
          onClick={() => loadAuditLogs()}
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

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <svg
            className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo Actor ID, Entity ID, Trace ID, Hành động..."
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            <span>Thực thể:</span>
          </div>
          <select
            value={entityTypeFilter}
            onChange={(e) => setEntityTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
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
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => loadAuditLogs()}
            className="underline font-semibold hover:text-red-800"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Thời gian</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Hành động</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Loại thực thể</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">ID Thực thể</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Người thực hiện</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Trace ID</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400">
                    Đang tải nhật ký audit...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-500">
                    Không tìm thấy bản ghi nhật ký audit nào phù hợp.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <div className="font-mono text-xs">{formatDateTime(log.createdAt)}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${getActionBadgeColor(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap font-medium">
                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap font-mono text-xs">
                      {log.entityId}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      <span className="font-medium text-gray-900 text-xs">{log.actorId}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">
                      {log.traceId.length > 12 ? `${log.traceId.slice(0, 12)}...` : log.traceId}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50"
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
      </div>

      {/* Metadata Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-semibold text-gray-900">Chi tiết Nhật ký Audit</h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-500 block">Mã ghi nhật ký:</span>
                <span className="font-mono text-gray-800 font-medium">{selectedLog.id}</span>
              </div>
              <div>
                <span className="text-gray-500 block">Thời gian:</span>
                <span className="text-gray-800 font-medium">
                  {formatDateTime(selectedLog.createdAt)}
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Thực thể & ID:</span>
                <span className="font-semibold text-gray-800">
                  {selectedLog.entityType} ({selectedLog.entityId})
                </span>
              </div>
              <div>
                <span className="text-gray-500 block">Người thực hiện (Actor):</span>
                <span className="font-semibold text-gray-800">{selectedLog.actorId}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block">Mô tả / Diễn giải:</span>
                <span className="text-gray-800">{selectedLog.details}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500 block">Mã vết giao dịch (Trace ID):</span>
                <span className="font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded block mt-0.5">
                  {selectedLog.traceId}
                </span>
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-gray-700 block mb-1">
                Dữ liệu Metadata:
              </span>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto max-h-60">
                {JSON.stringify(selectedLog.metadata ?? { details: selectedLog.details }, null, 2)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
