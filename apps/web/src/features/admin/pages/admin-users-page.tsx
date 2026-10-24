import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { DataTable, type ColumnDef } from '../../../components/data-table/data-table';
import { StatusBadge } from '../../../components/ui/status-badge';
import { Dialog } from '../../../components/ui/dialog';
import { ApiException } from '../../../lib/http/api-client';
import type { AdminUserDto } from '../../../lib/mocks/dev-mock-store';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Lock user modal state (FE40)
  const [lockingUser, setLockingUser] = useState<AdminUserDto | null>(null);
  const [lockReason, setLockReason] = useState<string>('');
  const [lockError, setLockError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getUsers({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: searchQuery.trim() || undefined,
      });
      setUsers(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải danh sách người dùng');
      } else {
        setError('Lỗi khi tải danh sách người dùng');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Handle Confirm Lock User (FE40)
  const handleConfirmLock = async () => {
    if (!lockingUser) return;
    const trimmed = lockReason.trim();
    if (!trimmed) {
      setLockError('Vui lòng nhập lý do khóa tài khoản.');
      return;
    }

    setSubmitting(true);
    setLockError(null);
    try {
      await adminApi.updateUserStatus(lockingUser.userId, {
        status: 'LOCKED',
        reason: trimmed,
        version: lockingUser.version,
      });
      setSuccessMessage(`Đã khóa tài khoản ${lockingUser.email} thành công.`);
      setLockingUser(null);
      setLockReason('');
      await loadUsers();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setLockError(err.message || 'Không thể khóa tài khoản');
      } else {
        setLockError((err as Error).message || 'Lỗi khi khóa tài khoản');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Unlock User
  const handleUnlockUser = async (user: AdminUserDto) => {
    setSubmitting(true);
    setError(null);
    try {
      await adminApi.updateUserStatus(user.userId, {
        status: 'ACTIVE',
        reason: 'Admin mở khóa tài khoản',
        version: user.version,
      });
      setSuccessMessage(`Đã mở khóa tài khoản ${user.email}.`);
      await loadUsers();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể mở khóa tài khoản');
      } else {
        setError('Lỗi khi mở khóa');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<AdminUserDto>[]>(
    () => [
      {
        key: 'name',
        header: 'Người dùng',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 600 }}>{row.fullName}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{row.email}</div>
          </div>
        ),
        sortable: true,
      },
      {
        key: 'role',
        header: 'Vai trò',
        render: (row) => (
          <span
            style={{
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: row.role === 'ADMIN' ? '#fef3c7' : 'var(--color-bg-secondary)',
              color: row.role === 'ADMIN' ? '#b45309' : 'var(--color-text)',
            }}
          >
            {row.role}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Trạng thái',
        render: (row) => <StatusBadge status={row.status} size="sm" />,
      },
      {
        key: 'version',
        header: 'Phiên bản',
        render: (row) => <span style={{ fontSize: '0.85rem' }}>v{row.version}</span>,
      },
      {
        key: 'actions',
        header: 'Thao tác',
        render: (row) => (
          <div>
            {row.status === 'ACTIVE' ? (
              <button
                type="button"
                data-testid={`lock-user-btn-${row.userId}`}
                disabled={submitting}
                onClick={() => {
                  setLockingUser(row);
                  setLockReason('');
                  setLockError(null);
                }}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid #dc2626',
                  background: 'transparent',
                  color: '#dc2626',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Khóa tài khoản
              </button>
            ) : (
              <button
                type="button"
                data-testid={`unlock-user-btn-${row.userId}`}
                disabled={submitting}
                onClick={() => void handleUnlockUser(row)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid #16a34a',
                  background: 'transparent',
                  color: '#16a34a',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Mở khóa
              </button>
            )}
          </div>
        ),
      },
    ],
    [submitting],
  );

  return (
    <div
      className="admin-users-page"
      data-testid="ui27-admin-users"
      style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
          Quản trị Tài khoản Người dùng (UI27)
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
          Khóa và mở khóa tài khoản vi phạm chính sách toàn hệ thống (FE40).
        </p>
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
          }}
        >
          {error}
        </div>
      )}

      {/* Filters Toolbar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.25rem',
          background: 'var(--color-bg-surface)',
          padding: '1rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div>
          <label
            htmlFor="filter-user-status"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            Trạng thái hoạt động
          </label>
          <select
            id="filter-user-status"
            data-testid="filter-user-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Tất cả</option>
            <option value="ACTIVE">Hoạt động (ACTIVE)</option>
            <option value="LOCKED">Bị khóa (LOCKED)</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <label
            htmlFor="search-users-input"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            Tìm kiếm theo họ tên hoặc email
          </label>
          <input
            id="search-users-input"
            data-testid="search-users-input"
            type="text"
            placeholder="Họ tên, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
            }}
          />
        </div>
      </div>

      {/* Users DataTable */}
      <DataTable
        columns={columns}
        data={users}
        keyExtractor={(item) => item.userId}
        loading={loading}
        emptyMessage="Không tìm thấy người dùng nào phù hợp với bộ lọc."
      />

      {/* Lock User Dialog (FE40) */}
      <Dialog
        open={Boolean(lockingUser)}
        onClose={() => setLockingUser(null)}
        title={`Khóa tài khoản: ${lockingUser?.email}`}
        description="Quy tắc FE40: Tài khoản bị khóa sẽ lập tức mất quyền truy cập hệ thống ở request tiếp theo."
      >
        <div style={{ padding: '0.5rem 0' }}>
          {lockError && (
            <div
              data-testid="lock-error-alert"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {lockError}
            </div>
          )}
          <label
            htmlFor="lock-reason-input"
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            Lý do khóa tài khoản <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="lock-reason-input"
            data-testid="lock-reason-input"
            rows={3}
            value={lockReason}
            onChange={(e) => setLockReason(e.target.value)}
            placeholder="Nêu rõ căn cứ vi phạm chính sách bảo mật hoặc spam ứng tuyển..."
            style={{
              width: '100%',
              padding: '0.55rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setLockingUser(null)}
              style={{
                padding: '0.5rem 1rem',
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
              data-testid="confirm-lock-btn"
              disabled={submitting}
              onClick={() => void handleConfirmLock()}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: '#dc2626',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {submitting ? 'Đang khóa...' : 'Xác nhận Khóa tài khoản'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
