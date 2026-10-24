import React, { useState, useEffect, useCallback } from 'react';
import { useCompanyContext } from '../context/company-context';
import { companiesApi } from '../api/companies.api';
import { StatusBadge } from '../../../components/ui/status-badge';
import { ApiException } from '../../../lib/http/api-client';
import type { CompanyDto } from '@rms/contracts/public';

export const CompanyDetailPage: React.FC = () => {
  const { currentCompanyId } = useCompanyContext();
  const [company, setCompany] = useState<CompanyDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [website, setWebsite] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const loadCompanyData = useCallback(async () => {
    if (!currentCompanyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setConflictWarning(null);
    try {
      const data = await companiesApi.getCompany(currentCompanyId);
      setCompany(data);
      setName(data.name || '');
      setAddress(data.address || '');
      setWebsite(data.website || '');
      setDescription(data.description || '');
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải thông tin doanh nghiệp');
      } else {
        setError('Đã có lỗi xảy ra khi tải dữ liệu');
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId]);

  useEffect(() => {
    void loadCompanyData();
  }, [loadCompanyData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !currentCompanyId) return;

    // Client validation
    const errors: Record<string, string> = {};
    if (!name.trim()) {
      errors.name = 'Tên doanh nghiệp không được để trống';
    }
    if (!address.trim()) {
      errors.address = 'Địa chỉ không được để trống';
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setSaving(true);
    setError(null);
    setSuccessMessage(null);
    setConflictWarning(null);

    try {
      const updated = await companiesApi.updateCompany(currentCompanyId, {
        name: name.trim(),
        address: address.trim(),
        website: website.trim() ? website.trim() : null,
        description: description.trim() ? description.trim() : null,
        version: company.version,
      });
      setCompany(updated);
      setSuccessMessage('Cập nhật thông tin doanh nghiệp thành công!');
    } catch (err: unknown) {
      if (err instanceof ApiException && err.status === 409) {
        // Concurrency conflict (BR01, BR18, FE29) - keep user input, notify conflict
        setConflictWarning(
          'Dữ liệu công ty đã bị thay đổi bởi người dùng khác (xung đột phiên bản). Dữ liệu bạn vừa nhập đã được giữ lại để đối chiếu.',
        );
      } else if (err instanceof ApiException) {
        setError(err.message || 'Không thể cập nhật thông tin doanh nghiệp');
        if (err.fieldErrors) {
          const mapped: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(err.fieldErrors)) {
            mapped[key] = msgs[0] ?? 'Lỗi không hợp lệ';
          }
          setFieldErrors(mapped);
        }
      } else {
        setError('Lỗi không xác định khi lưu thông tin');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="company-detail-page" data-testid="ui16-company" style={{ padding: '2rem' }}>
        <p data-testid="ui16-company-loading">Đang tải thông tin doanh nghiệp...</p>
      </div>
    );
  }

  if (!currentCompanyId || (!company && !loading)) {
    return (
      <div className="company-detail-page" data-testid="ui16-company" style={{ padding: '2rem' }}>
        <h2>Thông tin Doanh nghiệp</h2>
        <div
          data-testid="ui16-company-empty"
          style={{ padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: '8px' }}
        >
          <p>Chưa chọn doanh nghiệp hoạt động hoặc không tìm thấy dữ liệu.</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="company-detail-page"
      data-testid="ui16-company"
      style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>Hồ sơ Doanh nghiệp</h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            Quản lý thông tin hồ sơ pháp lý và thông tin liên hệ của công ty.
          </p>
        </div>
        <div>{company && <StatusBadge status={company.approvalStatus} size="md" />}</div>
      </div>

      {/* Approval Status Banner (BR02, FE26) */}
      {company?.approvalStatus === 'PENDING' && (
        <div
          data-testid="approval-status-pending-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-warning-subtle)',
            border: '1px solid var(--color-warning)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-warning-dark)',
          }}
        >
          <strong>Lưu ý quan trọng (BR02):</strong> Doanh nghiệp hiện đang ở trạng thái{' '}
          <strong>Chờ duyệt (PENDING)</strong>. Bạn có thể cập nhật thông tin hồ sơ, nhưng hệ thống
          sẽ khóa tính năng công bố tin tuyển dụng mới và tiếp nhận hồ sơ ứng viên cho đến khi được
          quản trị viên duyệt.
        </div>
      )}

      {company?.approvalStatus === 'REJECTED' && (
        <div
          data-testid="approval-status-rejected-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-danger)',
          }}
        >
          <strong>Hồ sơ bị từ chối:</strong>{' '}
          {company.rejectionReason ||
            'Vui lòng chỉnh sửa và bổ sung thông tin chính xác theo yêu cầu.'}
        </div>
      )}

      {company?.approvalStatus === 'SUSPENDED' && (
        <div
          data-testid="approval-status-suspended-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-danger)',
          }}
        >
          <strong>Doanh nghiệp đang bị đình chỉ hoạt động:</strong>{' '}
          {company.rejectionReason || 'Liên hệ ban quản trị để được hỗ trợ.'}
        </div>
      )}

      {/* Conflict Alert (BR01, BR18, FE29) */}
      {conflictWarning && (
        <div
          data-testid="conflict-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-warning-subtle)',
            border: '1px solid var(--color-warning)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-warning-dark)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>{conflictWarning}</div>
          <button
            type="button"
            data-testid="reload-latest-btn"
            onClick={() => void loadCompanyData()}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-warning)',
              background: '#fff',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Tải lại dữ liệu mới nhất
          </button>
        </div>
      )}

      {/* Success Alert */}
      {successMessage && (
        <div
          data-testid="success-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-success-subtle)',
            border: '1px solid var(--color-success)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-success)',
          }}
        >
          {successMessage}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div
          data-testid="error-alert"
          style={{
            padding: '1rem 1.25rem',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        data-testid="company-edit-form"
        style={{
          background: 'var(--color-bg-surface)',
          padding: '1.5rem',
          borderRadius: '8px',
          border: '1px solid var(--color-border)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1.25rem',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <label
              htmlFor="company-name"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Tên doanh nghiệp <span style={{ color: 'var(--color-danger)' }}>*</span>
            </label>
            <input
              id="company-name"
              data-testid="company-name-input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="VD: Công ty Cổ phần Công nghệ ABC"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: `1px solid ${fieldErrors.name ? 'var(--color-danger)' : 'var(--color-border)'}`,
                fontSize: '0.95rem',
              }}
            />
            {fieldErrors.name && (
              <span
                data-testid="error-name"
                style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
              >
                {fieldErrors.name}
              </span>
            )}
          </div>

          <div>
            <label
              htmlFor="company-tax-code"
              style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
            >
              Mã số thuế / Mã doanh nghiệp
            </label>
            <input
              id="company-tax-code"
              data-testid="company-tax-code-input"
              type="text"
              value={company?.taxCode || ''}
              disabled
              title="Mã số thuế không thể thay đổi sau khi khởi tạo"
              style={{
                width: '100%',
                padding: '0.6rem 0.8rem',
                borderRadius: '6px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-muted)',
                fontSize: '0.95rem',
                cursor: 'not-allowed',
              }}
            />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>
              Mã định danh duy nhất không thể chỉnh sửa
            </small>
          </div>
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="company-address"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Địa chỉ trụ sở <span style={{ color: 'var(--color-danger)' }}>*</span>
          </label>
          <input
            id="company-address"
            data-testid="company-address-input"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="VD: Tòa nhà Landmark, 123 Đường Nam Kỳ Khởi Nghĩa, Quận 1, TP.HCM"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: `1px solid ${fieldErrors.address ? 'var(--color-danger)' : 'var(--color-border)'}`,
              fontSize: '0.95rem',
            }}
          />
          {fieldErrors.address && (
            <span
              data-testid="error-address"
              style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}
            >
              {fieldErrors.address}
            </span>
          )}
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <label
            htmlFor="company-website"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Trang web (Website)
          </label>
          <input
            id="company-website"
            data-testid="company-website-input"
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://example.com"
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.95rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label
            htmlFor="company-description"
            style={{ display: 'block', fontWeight: 600, marginBottom: '0.4rem' }}
          >
            Giới thiệu về doanh nghiệp
          </label>
          <textarea
            id="company-description"
            data-testid="company-description-input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Mô tả tóm tắt văn hóa, định hướng phát triển và môi trường làm việc..."
            style={{
              width: '100%',
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              fontSize: '0.95rem',
              resize: 'vertical',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button
            type="submit"
            data-testid="save-company-btn"
            disabled={saving}
            style={{
              padding: '0.6rem 1.5rem',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--color-primary)',
              color: '#fff',
              fontWeight: 600,
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </div>
  );
};
