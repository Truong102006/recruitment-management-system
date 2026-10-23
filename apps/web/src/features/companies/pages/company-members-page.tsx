import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCompanyContext } from '../context/company-context';
import { companiesApi } from '../api/companies.api';
import { DataTable, type ColumnDef } from '../../../components/data-table/data-table';
import { StatusBadge } from '../../../components/ui/status-badge';
import { Dialog } from '../../../components/ui/dialog';
import { ApiException } from '../../../lib/http/api-client';
import type { CompanyMemberDto, MemberPermission } from '@rms/contracts/public';

export const CompanyMembersPage: React.FC = () => {
  const { currentCompanyId, currentCompany } = useCompanyContext();
  const [members, setMembers] = useState<CompanyMemberDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addEmail, setAddEmail] = useState<string>('');
  const [addRole, setAddRole] = useState<'RECRUITER' | 'INTERVIEWER'>('RECRUITER');
  const [addPermissions, setAddPermissions] = useState<MemberPermission[]>(['RECRUITER']);
  const [addError, setAddError] = useState<string | null>(null);
  const [adding, setAdding] = useState<boolean>(false);

  // Transfer Owner Modal State
  const [transferTarget, setTransferTarget] = useState<CompanyMemberDto | null>(null);
  const [transferring, setTransferring] = useState<boolean>(false);
  const [transferError, setTransferError] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    if (!currentCompanyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await companiesApi.getCompanyMembers(currentCompanyId);
      setMembers(data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải danh sách thành viên');
      } else {
        setError('Đã có lỗi xảy ra khi tải danh sách thành viên');
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    void loadMembers();
  }, [loadMembers]);

  // BR15: Count active owners to prevent removing or deactivating the last active owner
  const activeOwnerCount = useMemo(() => {
    return members.filter((m) => m.role === 'OWNER' && m.active).length;
  }, [members]);

  const handleToggleMemberStatus = async (member: CompanyMemberDto) => {
    if (!currentCompanyId || !currentCompany) return;

    // BR15 & FE26: Protection against deactivating the last active owner
    if (member.role === 'OWNER' && member.active && activeOwnerCount <= 1) {
      setError('Không thể vô hiệu hóa OWNER hoạt động cuối cùng của doanh nghiệp (BR15, FE26).');
      return;
    }

    setError(null);
    setSuccessMessage(null);

    try {
      await companiesApi.updateCompanyMember(currentCompanyId, member.userId, {
        active: !member.active,
        version: member.version,
        companyVersion: currentCompany.version,
      });
      setSuccessMessage(
        `Đã ${member.active ? 'vô hiệu hóa' : 'kích hoạt'} thành viên ${member.fullName || member.email} thành công!`,
      );
      await loadMembers();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể cập nhật trạng thái thành viên');
      } else {
        setError('Lỗi khi cập nhật thành viên');
      }
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCompanyId) return;

    const trimmedEmail = addEmail.trim().toLowerCase();
    if (!trimmedEmail) {
      setAddError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setAdding(true);
    setAddError(null);

    try {
      await companiesApi.addCompanyMember(currentCompanyId, {
        email: trimmedEmail,
        role: addRole,
        permissions: addPermissions,
      });
      setShowAddModal(false);
      setAddEmail('');
      setAddRole('RECRUITER');
      setAddPermissions(['RECRUITER']);
      setSuccessMessage('Thêm thành viên mới thành công!');
      await loadMembers();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setAddError(err.message || 'Không thể thêm thành viên');
      } else {
        setAddError('Đã có lỗi xảy ra');
      }
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmTransferOwner = async () => {
    if (!currentCompanyId || !currentCompany || !transferTarget) return;

    setTransferring(true);
    setTransferError(null);

    try {
      await companiesApi.transferOwner(currentCompanyId, {
        targetUserId: transferTarget.userId,
        targetMemberVersion: transferTarget.version,
        companyVersion: currentCompany.version,
      });
      setTransferTarget(null);
      setSuccessMessage(
        `Đã chuyển quyền OWNER cho ${transferTarget.fullName || transferTarget.email} thành công!`,
      );
      await loadMembers();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setTransferError(err.message || 'Không thể chuyển quyền OWNER');
      } else {
        setTransferError('Đã có lỗi xảy ra');
      }
    } finally {
      setTransferring(false);
    }
  };

  const columns: ColumnDef<CompanyMemberDto>[] = [
    {
      key: 'member',
      header: 'Thành viên',
      render: (row) => (
        <div>
          <div style={{ fontWeight: 600 }}>{row.fullName || 'Chưa cập nhật'}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{row.email}</div>
        </div>
      ),
      sortable: true,
    },
    {
      key: 'role',
      header: 'Vai trò',
      render: (row) => {
        let badgeColor = 'var(--color-bg-secondary)';
        let textColor = 'var(--color-text)';
        if (row.role === 'OWNER') {
          badgeColor = '#fef3c7';
          textColor = '#92400e';
        } else if (row.role === 'RECRUITER') {
          badgeColor = '#dbeafe';
          textColor = '#1e40af';
        } else if (row.role === 'INTERVIEWER') {
          badgeColor = '#e0e7ff';
          textColor = '#3730a3';
        }
        return (
          <span
            style={{
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: 600,
              background: badgeColor,
              color: textColor,
            }}
          >
            {row.role}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Trạng thái',
      render: (row) => <StatusBadge status={row.active ? 'ACTIVE' : 'INACTIVE'} size="sm" />,
    },
    {
      key: 'joinedAt',
      header: 'Ngày tham gia',
      render: (row) => {
        try {
          return new Date(row.joinedAt).toLocaleDateString('vi-VN');
        } catch {
          return row.joinedAt;
        }
      },
      sortable: true,
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: (row) => {
        const isLastActiveOwner = row.role === 'OWNER' && row.active && activeOwnerCount <= 1;
        const canTransferTo = row.role !== 'OWNER' && row.active;

        return (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              type="button"
              data-testid={`toggle-status-btn-${row.userId}`}
              disabled={isLastActiveOwner}
              title={
                isLastActiveOwner
                  ? 'Không thể vô hiệu hóa OWNER hoạt động cuối cùng của doanh nghiệp (BR15)'
                  : row.active
                    ? 'Vô hiệu hóa thành viên'
                    : 'Kích hoạt lại thành viên'
              }
              onClick={() => void handleToggleMemberStatus(row)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '4px',
                border: '1px solid var(--color-border)',
                background: row.active ? 'transparent' : 'var(--color-success)',
                color: row.active ? 'var(--color-danger)' : '#fff',
                fontSize: '0.8rem',
                cursor: isLastActiveOwner ? 'not-allowed' : 'pointer',
                opacity: isLastActiveOwner ? 0.5 : 1,
              }}
            >
              {row.active ? 'Vô hiệu hóa' : 'Kích hoạt'}
            </button>

            {canTransferTo && (
              <button
                type="button"
                data-testid={`transfer-owner-btn-${row.userId}`}
                onClick={() => setTransferTarget(row)}
                style={{
                  padding: '0.35rem 0.65rem',
                  borderRadius: '4px',
                  border: '1px solid #f59e0b',
                  background: 'transparent',
                  color: '#b45309',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Chuyển OWNER
              </button>
            )}
          </div>
        );
      },
    },
  ];

  if (!currentCompanyId) {
    return (
      <div className="company-members-page" data-testid="ui16-members" style={{ padding: '2rem' }}>
        <h2>Quản lý Thành viên</h2>
        <p data-testid="ui16-members-empty">
          Vui lòng chọn doanh nghiệp hoạt động để quản lý thành viên.
        </p>
      </div>
    );
  }

  return (
    <div
      className="company-members-page"
      data-testid="ui16-members"
      style={{ maxWidth: '1100px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Quản lý Thành viên</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            Phân quyền RECRUITER / INTERVIEWER và quản lý quyền sở hữu doanh nghiệp (BR15).
          </p>
        </div>
        <button
          type="button"
          data-testid="add-member-open-btn"
          onClick={() => setShowAddModal(true)}
          style={{
            padding: '0.6rem 1.25rem',
            borderRadius: '6px',
            border: 'none',
            background: 'var(--color-primary)',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          + Thêm thành viên
        </button>
      </div>

      {/* Success alert */}
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

      {/* Error alert */}
      {error && (
        <div
          data-testid="members-error-alert"
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

      {/* Members DataTable */}
      <DataTable
        data={members}
        columns={columns}
        keyExtractor={(item) => item.userId}
        loading={loading}
        emptyMessage="Chưa có thành viên nào trong doanh nghiệp."
        searchPlaceholder="Tìm thành viên theo tên hoặc email..."
      />

      {/* Add Member Modal */}
      <Dialog
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Thêm thành viên vào doanh nghiệp"
        description="Mời người dùng đã đăng ký tham gia tuyển dụng với vai trò RECRUITER hoặc INTERVIEWER."
      >
        <form onSubmit={handleAddMember} data-testid="add-member-form">
          {addError && (
            <div
              data-testid="add-member-error"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {addError}
            </div>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="add-member-email"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Địa chỉ Email <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="add-member-email"
              data-testid="add-member-email-input"
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              placeholder="nhanvien@congty.com"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label
              htmlFor="add-member-role"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Vai trò <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <select
              id="add-member-role"
              data-testid="add-member-role-select"
              value={addRole}
              onChange={(e) => {
                const val = e.target.value as 'RECRUITER' | 'INTERVIEWER';
                setAddRole(val);
                setAddPermissions([val]);
              }}
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                fontSize: '0.95rem',
              }}
            >
              <option value="RECRUITER">Nhà tuyển dụng (RECRUITER)</option>
              <option value="INTERVIEWER">Người phỏng vấn (INTERVIEWER)</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '0.75rem',
              marginTop: '1.5rem',
            }}
          >
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
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
              type="submit"
              data-testid="submit-add-member-btn"
              disabled={adding}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: adding ? 'not-allowed' : 'pointer',
                opacity: adding ? 0.7 : 1,
              }}
            >
              {adding ? 'Đang thêm...' : 'Xác nhận thêm'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* Transfer Owner Modal (BR15) */}
      <Dialog
        open={Boolean(transferTarget)}
        onClose={() => setTransferTarget(null)}
        title="Chuyển giao quyền sở hữu (OWNER)"
        description="Cảnh báo an toàn và phân quyền (BR15)"
      >
        <div data-testid="transfer-owner-dialog-content">
          {transferError && (
            <div
              data-testid="transfer-owner-error"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.9rem',
              }}
            >
              {transferError}
            </div>
          )}

          <div
            style={{
              padding: '0.9rem',
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              color: '#92400e',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            <strong>Cảnh báo quan trọng:</strong> Hành động này sẽ chuyển quyền{' '}
            <strong>OWNER</strong> cao nhất của doanh nghiệp cho thành viên:{' '}
            <strong>{transferTarget?.fullName || transferTarget?.email}</strong>.
            <br />
            Bạn sẽ được hạ cấp thành vai trò <strong>RECRUITER</strong> và không thể tự lấy lại
            quyền OWNER nếu không được sự phân quyền từ OWNER mới.
          </div>

          <p style={{ fontSize: '0.95rem', margin: '0 0 1.25rem' }}>
            Bạn có chắc chắn muốn tiến hành chuyển giao quyền sở hữu?
          </p>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button
              type="button"
              onClick={() => setTransferTarget(null)}
              style={{
                padding: '0.55rem 1.2rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              data-testid="confirm-transfer-owner-btn"
              disabled={transferring}
              onClick={() => void handleConfirmTransferOwner()}
              style={{
                padding: '0.55rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: '#d97706',
                color: '#fff',
                fontWeight: 600,
                cursor: transferring ? 'not-allowed' : 'pointer',
                opacity: transferring ? 0.7 : 1,
              }}
            >
              {transferring ? 'Đang chuyển giao...' : 'Xác nhận chuyển OWNER'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
