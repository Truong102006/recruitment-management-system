import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { adminApi } from '../api/admin.api';
import { DataTable, type ColumnDef } from '../../../components/data-table/data-table';
import { StatusBadge } from '../../../components/ui/status-badge';
import { Dialog } from '../../../components/ui/dialog';
import { ApiException } from '../../../lib/http/api-client';
import type { CompanyDto, EligibleOwnerDto } from '@rms/contracts/public';

export const AdminCompaniesPage: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reject Dialog state (FE39: reason required)
  const [rejectingCompany, setRejectingCompany] = useState<CompanyDto | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Suspend Dialog state
  const [suspendingCompany, setSuspendingCompany] = useState<CompanyDto | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');
  const [suspendError, setSuspendError] = useState<string | null>(null);

  // Recover Owner Dialog state (UC10)
  const [recoveringCompany, setRecoveringCompany] = useState<CompanyDto | null>(null);
  const [eligibleOwners, setEligibleOwners] = useState<EligibleOwnerDto[]>([]);
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [recoverReason, setRecoverReason] = useState<string>('');
  const [recoverError, setRecoverError] = useState<string | null>(null);

  const loadCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.getCompanies({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        q: searchQuery.trim() || undefined,
      });
      setCompanies(res.data);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải danh sách doanh nghiệp');
      } else {
        setError('Lỗi khi tải danh sách doanh nghiệp');
      }
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    void loadCompanies();
  }, [loadCompanies]);

  // Handle Approve
  const handleApprove = async (comp: CompanyDto) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await adminApi.reviewCompany(comp.id, {
        status: 'APPROVED',
        version: comp.version,
      });
      setSuccessMessage(`Đã phê duyệt doanh nghiệp ${comp.name} thành công.`);
      await loadCompanies();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể phê duyệt doanh nghiệp');
      } else {
        setError('Lỗi khi phê duyệt doanh nghiệp');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Reject (FE39: reason is strictly mandatory)
  const handleConfirmReject = async () => {
    if (!rejectingCompany) return;
    const trimmed = rejectReason.trim();
    if (!trimmed) {
      setRejectError('Vui lòng nhập lý do từ chối phê duyệt doanh nghiệp (FE39).');
      return;
    }

    setIsSubmitting(true);
    setRejectError(null);
    try {
      await adminApi.reviewCompany(rejectingCompany.id, {
        status: 'REJECTED',
        reason: trimmed,
        version: rejectingCompany.version,
      });
      setSuccessMessage(`Đã từ chối doanh nghiệp ${rejectingCompany.name}.`);
      setRejectingCompany(null);
      setRejectReason('');
      await loadCompanies();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setRejectError(err.message || 'Không thể từ chối doanh nghiệp');
      } else {
        setRejectError('Lỗi khi từ chối doanh nghiệp');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Confirm Suspend
  const handleConfirmSuspend = async () => {
    if (!suspendingCompany) return;
    const trimmed = suspendReason.trim();
    if (!trimmed) {
      setSuspendError('Vui lòng nhập lý do đình chỉ hoạt động doanh nghiệp.');
      return;
    }

    setIsSubmitting(true);
    setSuspendError(null);
    try {
      await adminApi.suspendCompany(suspendingCompany.id, {
        reason: trimmed,
        version: suspendingCompany.version,
      });
      setSuccessMessage(`Đã đình chỉ hoạt động doanh nghiệp ${suspendingCompany.name}.`);
      setSuspendingCompany(null);
      setSuspendReason('');
      await loadCompanies();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setSuspendError(err.message || 'Không thể đình chỉ doanh nghiệp');
      } else {
        setSuspendError('Lỗi khi đình chỉ');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Unsuspend
  const handleUnsuspend = async (comp: CompanyDto) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await adminApi.unsuspendCompany(comp.id, { version: comp.version });
      setSuccessMessage(`Đã khôi phục hoạt động cho doanh nghiệp ${comp.name}.`);
      await loadCompanies();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể khôi phục hoạt động');
      } else {
        setError('Lỗi khôi phục hoạt động');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Recover Owner Dialog
  const handleOpenRecoverOwner = async (comp: CompanyDto) => {
    setRecoveringCompany(comp);
    setRecoverReason('');
    setRecoverError(null);
    try {
      const owners = await adminApi.getEligibleOwners(comp.id);
      setEligibleOwners(owners);
      if (owners.length > 0) {
        setSelectedOwnerId(owners[0]!.userId);
      }
    } catch {
      setEligibleOwners([]);
    }
  };

  // Confirm Recover Owner
  const handleConfirmRecoverOwner = async () => {
    if (!recoveringCompany) return;
    if (!selectedOwnerId) {
      setRecoverError('Vui lòng chọn thành viên để chỉ định làm Owner mới.');
      return;
    }
    const trimmed = recoverReason.trim();
    if (!trimmed) {
      setRecoverError('Vui lòng nhập lý do khôi phục quyền Owner.');
      return;
    }

    const selectedOwner = eligibleOwners.find((o) => o.userId === selectedOwnerId);

    setIsSubmitting(true);
    setRecoverError(null);
    try {
      await adminApi.recoverOwner(recoveringCompany.id, {
        targetUserId: selectedOwnerId,
        targetMemberVersion: selectedOwner?.version ?? 1,
        companyVersion: recoveringCompany.version,
        reason: trimmed,
      });
      setSuccessMessage(`Đã khôi phục quyền Owner cho doanh nghiệp ${recoveringCompany.name}.`);
      setRecoveringCompany(null);
      await loadCompanies();
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setRecoverError(err.message || 'Lỗi khôi phục quyền Owner');
      } else {
        setRecoverError('Không thể khôi phục quyền Owner');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = useMemo<ColumnDef<CompanyDto>[]>(
    () => [
      {
        key: 'name',
        header: 'Tên Doanh nghiệp',
        render: (row) => (
          <div>
            <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{row.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              MST: {row.taxCode} • v{row.version}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        key: 'address',
        header: 'Địa chỉ',
        render: (row) => <span style={{ fontSize: '0.85rem' }}>{row.address || '—'}</span>,
      },
      {
        key: 'status',
        header: 'Trạng thái Kiểm duyệt',
        render: (row) => (
          <div>
            <StatusBadge status={row.approvalStatus} size="sm" />
            {row.rejectionReason && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-danger)',
                  marginTop: '4px',
                  maxWidth: '220px',
                }}
              >
                Lý do: {row.rejectionReason}
              </div>
            )}
          </div>
        ),
      },
      {
        key: 'actions',
        header: 'Thao tác Admin',
        render: (row) => (
          <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
            {row.approvalStatus === 'PENDING' && (
              <>
                <button
                  type="button"
                  data-testid={`approve-company-btn-${row.id}`}
                  disabled={isSubmitting}
                  onClick={() => void handleApprove(row)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: 'none',
                    background: '#16a34a',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Duyệt
                </button>
                <button
                  type="button"
                  data-testid={`reject-company-btn-${row.id}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    setRejectingCompany(row);
                    setRejectReason('');
                    setRejectError(null);
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
                  Từ chối
                </button>
              </>
            )}

            {row.approvalStatus === 'APPROVED' && (
              <>
                <button
                  type="button"
                  data-testid={`suspend-company-btn-${row.id}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    setSuspendingCompany(row);
                    setSuspendReason('');
                    setSuspendError(null);
                  }}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid #d97706',
                    background: 'transparent',
                    color: '#d97706',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Đình chỉ
                </button>
                <button
                  type="button"
                  data-testid={`recover-owner-btn-${row.id}`}
                  disabled={isSubmitting}
                  onClick={() => void handleOpenRecoverOwner(row)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '4px',
                    border: '1px solid var(--color-primary)',
                    background: 'transparent',
                    color: 'var(--color-primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Khôi phục Owner
                </button>
              </>
            )}

            {row.approvalStatus === 'SUSPENDED' && (
              <button
                type="button"
                data-testid={`unsuspend-company-btn-${row.id}`}
                disabled={isSubmitting}
                onClick={() => void handleUnsuspend(row)}
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
                Khôi phục hoạt động
              </button>
            )}
          </div>
        ),
      },
    ],
    [isSubmitting],
  );

  return (
    <div
      className="admin-companies-page"
      data-testid="ui26-admin-companies"
      style={{ maxWidth: '1280px', margin: '0 auto', padding: '1.5rem' }}
    >
      <div style={{ marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 600,
            fontFamily: 'var(--font-d)',
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            margin: 0,
          }}
        >
          Kiểm duyệt Doanh nghiệp (UI26)
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: '14px', margin: '4px 0 0' }}>
          Phê duyệt, đình chỉ, từ chối và khôi phục quyền Owner cho các doanh nghiệp trên hệ thống
          (UC10, FE39).
        </p>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div
          data-testid="success-alert"
          style={{
            padding: '12px 18px',
            background: 'var(--p2b)',
            border: '1px solid var(--green)',
            borderRadius: '12px',
            marginBottom: '1rem',
            color: 'var(--green)',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          {successMessage}
        </div>
      )}

      {error && (
        <div
          data-testid="error-alert"
          style={{
            padding: '12px 18px',
            background: 'var(--p3b)',
            border: '1px solid var(--red)',
            borderRadius: '12px',
            marginBottom: '1rem',
            color: 'var(--red)',
            fontSize: '14px',
          }}
        >
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div
        className="card"
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: '1.5rem',
          backgroundColor: 'var(--card)',
          padding: '1.25rem',
          borderRadius: '16px',
          border: '1px solid var(--hair)',
          boxShadow: 'var(--sh-s)',
        }}
      >
        <div>
          <label
            htmlFor="filter-status"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            Trạng thái phê duyệt
          </label>
          <select
            id="filter-status"
            data-testid="filter-status-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
            }}
          >
            <option value="ALL">Tất cả trạng thái</option>
            <option value="PENDING">Chờ duyệt (PENDING)</option>
            <option value="APPROVED">Đã duyệt (APPROVED)</option>
            <option value="SUSPENDED">Đình chỉ (SUSPENDED)</option>
            <option value="REJECTED">Bị từ chối (REJECTED)</option>
          </select>
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <label
            htmlFor="filter-search"
            style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.2rem',
            }}
          >
            Tìm kiếm theo tên / Mã số thuế
          </label>
          <input
            id="filter-search"
            data-testid="search-input"
            type="text"
            placeholder="Tên công ty, MST..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.45rem 0.75rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.85rem',
            }}
          ></input>
        </div>
      </div>

      {/* Companies DataTable */}
      <DataTable
        columns={columns}
        data={companies}
        keyExtractor={(item) => item.id}
        loading={loading}
        emptyMessage="Không tìm thấy doanh nghiệp nào phù hợp với bộ lọc."
      />

      {/* Reject Modal (FE39: Mandatory reason) */}
      <Dialog
        open={Boolean(rejectingCompany)}
        onClose={() => setRejectingCompany(null)}
        title={`Từ chối phê duyệt: ${rejectingCompany?.name}`}
        description="Quy tắc FE39: Bắt buộc nhập lý do từ chối trước khi xác nhận. Lý do này sẽ được gửi thông báo đến người đại diện doanh nghiệp."
      >
        <div style={{ padding: '0.5rem 0' }}>
          {rejectError && (
            <div
              data-testid="reject-error-alert"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {rejectError}
            </div>
          )}
          <label
            htmlFor="reject-reason-input"
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            Lý do từ chối (Bắt buộc theo FE39){' '}
            <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="reject-reason-input"
            data-testid="reject-reason-input"
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="VD: Mã số thuế không khớp với tên doanh nghiệp theo cổng thông tin Quốc gia..."
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
              onClick={() => setRejectingCompany(null)}
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
              data-testid="confirm-reject-btn"
              disabled={isSubmitting}
              onClick={() => void handleConfirmReject()}
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
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Từ chối'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Suspend Modal */}
      <Dialog
        open={Boolean(suspendingCompany)}
        onClose={() => setSuspendingCompany(null)}
        title={`Đình chỉ doanh nghiệp: ${suspendingCompany?.name}`}
        description="Đình chỉ sẽ khóa quyền đăng tin và xét duyệt hồ sơ của toàn bộ thành viên thuộc doanh nghiệp."
      >
        <div style={{ padding: '0.5rem 0' }}>
          {suspendError && (
            <div
              data-testid="suspend-error-alert"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {suspendError}
            </div>
          )}
          <label
            htmlFor="suspend-reason-input"
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            Lý do đình chỉ <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="suspend-reason-input"
            data-testid="suspend-reason-input"
            rows={3}
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Nêu rõ căn cứ vi phạm chính sách đăng tin hoặc gian lận tuyển dụng..."
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
              onClick={() => setSuspendingCompany(null)}
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
              data-testid="confirm-suspend-btn"
              disabled={isSubmitting}
              onClick={() => void handleConfirmSuspend()}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: '#d97706',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận Đình chỉ'}
            </button>
          </div>
        </div>
      </Dialog>

      {/* Recover Owner Modal (UC10) */}
      <Dialog
        open={Boolean(recoveringCompany)}
        onClose={() => setRecoveringCompany(null)}
        title={`Khôi phục quyền Chủ sở hữu: ${recoveringCompany?.name}`}
        description="Chỉ định một thành viên hoạt động làm Owner mới khi doanh nghiệp không còn tài khoản Owner khả dụng."
      >
        <div style={{ padding: '0.5rem 0' }}>
          {recoverError && (
            <div
              data-testid="recover-error-alert"
              style={{
                padding: '0.6rem 0.8rem',
                background: 'var(--color-danger-subtle)',
                color: 'var(--color-danger)',
                borderRadius: '6px',
                marginBottom: '1rem',
                fontSize: '0.85rem',
              }}
            >
              {recoverError}
            </div>
          )}
          <label
            htmlFor="select-eligible-owner"
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            Chọn thành viên chỉ định làm Owner mới:
          </label>
          <select
            id="select-eligible-owner"
            data-testid="eligible-owner-select"
            value={selectedOwnerId}
            onChange={(e) => setSelectedOwnerId(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.9rem',
              marginBottom: '1rem',
            }}
          >
            {eligibleOwners.map((o) => (
              <option key={o.userId} value={o.userId}>
                {o.fullName} ({o.email}) — Vai trò hiện tại: {o.role}
              </option>
            ))}
          </select>

          <label
            htmlFor="recover-reason-input"
            style={{
              display: 'block',
              fontWeight: 600,
              marginBottom: '0.4rem',
              fontSize: '0.9rem',
            }}
          >
            Lý do khôi phục quyền Owner <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <textarea
            id="recover-reason-input"
            data-testid="recover-reason-input"
            rows={2}
            value={recoverReason}
            onChange={(e) => setRecoverReason(e.target.value)}
            placeholder="Căn cứ theo công văn đề nghị chuyển giao hoặc biên bản họp hội đồng..."
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
              onClick={() => setRecoveringCompany(null)}
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
              data-testid="confirm-recover-owner-btn"
              disabled={isSubmitting}
              onClick={() => void handleConfirmRecoverOwner()}
              style={{
                padding: '0.5rem 1.25rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isSubmitting ? 'Đang xử lý...' : 'Chỉ định Owner mới'}
            </button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
