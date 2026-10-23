import React, { useState, useEffect, useCallback } from 'react';
import { useCompanyContext } from '../../companies/context/company-context';
import { statisticsApi } from '../api/statistics.api';
import { ApiException } from '../../../lib/http/api-client';
import type { RecruitmentFunnelDto } from '../../../lib/mocks/dev-mock-store';

export const RecruiterStatisticsPage: React.FC = () => {
  const { currentCompanyId } = useCompanyContext();

  const [periodDays, setPeriodDays] = useState<number>(30);
  const [data, setData] = useState<RecruitmentFunnelDto | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Custom date range state (FE38)
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [dateRangeError, setDateRangeError] = useState<string | null>(null);

  const loadStatistics = useCallback(async () => {
    if (!currentCompanyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await statisticsApi.getRecruitmentFunnel(currentCompanyId, periodDays);
      setData(res);
    } catch (err: unknown) {
      if (err instanceof ApiException) {
        setError(err.message || 'Không thể tải số liệu thống kê tuyển dụng');
      } else {
        setError('Đã có lỗi xảy ra khi tải số liệu');
      }
    } finally {
      setLoading(false);
    }
  }, [currentCompanyId, periodDays]);

  useEffect(() => {
    void loadStatistics();
  }, [loadStatistics]);

  // Handle custom date range change (FE38 validation: max 366 days, start <= end)
  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setDateRangeError('Vui lòng chọn đầy đủ ngày bắt đầu và ngày kết thúc (FE38).');
      return;
    }

    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();

    if (start > end) {
      setDateRangeError('Ngày bắt đầu không được lớn hơn ngày kết thúc (FE38).');
      return;
    }

    const diffDays = Math.round((end - start) / (1000 * 60 * 60 * 24));
    if (diffDays > 366) {
      setDateRangeError('Khoảng thời gian thống kê tối đa không được vượt quá 366 ngày (FE38).');
      return;
    }

    setDateRangeError(null);
    setPeriodDays(diffDays === 0 ? 1 : diffDays);
  };

  const formatAsOf = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Safe percentage helper (FE38: NEVER produce NaN or Infinity)
  const formatRate = (rate?: number): string => {
    if (rate === undefined || rate === null || isNaN(rate) || !isFinite(rate)) {
      return '0.0%';
    }
    return `${rate.toFixed(1)}%`;
  };

  if (!currentCompanyId) {
    return (
      <div
        className="recruiter-statistics-page"
        data-testid="ui25-statistics"
        style={{ padding: '2rem' }}
      >
        <h2>Thống kê Tuyển dụng (UI25)</h2>
        <p>Vui lòng chọn doanh nghiệp hoạt động để xem báo cáo thống kê.</p>
      </div>
    );
  }

  return (
    <div
      className="recruiter-statistics-page"
      data-testid="ui25-statistics"
      style={{ maxWidth: '1240px', margin: '0 auto', padding: '1.5rem' }}
    >
      {/* Page Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0 }}>
            Thống kê Tuyển dụng (UI25)
          </h1>
          <p style={{ color: 'var(--color-text-muted)', margin: '0.25rem 0 0' }}>
            Phân tích phễu chuyển đổi tuyển dụng, tỷ lệ trúng tuyển và hiệu quả sàng lọc hồ sơ
            (FE38).
          </p>
        </div>

        {data && (
          <div
            data-testid="statistics-asof"
            style={{
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              background: 'var(--color-bg-secondary)',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
            }}
          >
            🕒 Chốt số liệu: <strong>{formatAsOf(data.asOf)}</strong> (Asia/Ho_Chi_Minh)
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div
        style={{
          background: 'var(--color-bg-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: '8px',
          padding: '1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', marginRight: '0.5rem' }}>
            Khoảng thời gian:
          </span>
          {[
            { label: '7 ngày qua', days: 7 },
            { label: '30 ngày qua', days: 30 },
            { label: '90 ngày qua', days: 90 },
            { label: '1 năm qua', days: 365 },
          ].map((preset) => (
            <button
              key={preset.days}
              type="button"
              data-testid={`preset-filter-${preset.days}`}
              onClick={() => {
                setUseCustomRange(false);
                setPeriodDays(preset.days);
              }}
              style={{
                padding: '0.4rem 0.8rem',
                borderRadius: '6px',
                border: `1px solid ${!useCustomRange && periodDays === preset.days ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background:
                  !useCustomRange && periodDays === preset.days
                    ? 'var(--color-primary)'
                    : 'transparent',
                color: !useCustomRange && periodDays === preset.days ? '#fff' : 'var(--color-text)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              {preset.label}
            </button>
          ))}

          <button
            type="button"
            data-testid="toggle-custom-range-btn"
            onClick={() => setUseCustomRange(!useCustomRange)}
            style={{
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              background: useCustomRange ? 'var(--color-bg-secondary)' : 'transparent',
              color: 'var(--color-primary)',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '0.85rem',
              marginLeft: 'auto',
            }}
          >
            {useCustomRange ? 'Đóng tùy chọn ngày' : '📅 Tùy chọn ngày cụ thể (FE38)'}
          </button>
        </div>

        {/* Custom Date Range Form (FE38) */}
        {useCustomRange && (
          <form
            onSubmit={handleApplyCustomRange}
            data-testid="custom-date-range-form"
            style={{
              padding: '1rem',
              background: 'var(--color-bg-secondary)',
              borderRadius: '6px',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <label
                htmlFor="filter-start-date"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.2rem',
                }}
              >
                Từ ngày:
              </label>
              <input
                id="filter-start-date"
                data-testid="custom-start-date-input"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{
                  padding: '0.4rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
            <div>
              <label
                htmlFor="filter-end-date"
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  marginBottom: '0.2rem',
                }}
              >
                Đến ngày:
              </label>
              <input
                id="filter-end-date"
                data-testid="custom-end-date-input"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{
                  padding: '0.4rem',
                  borderRadius: '4px',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>
            <button
              type="submit"
              data-testid="apply-custom-range-btn"
              style={{
                alignSelf: 'flex-end',
                padding: '0.45rem 1rem',
                borderRadius: '6px',
                border: 'none',
                background: 'var(--color-primary)',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
              }}
            >
              Áp dụng bộ lọc
            </button>
          </form>
        )}

        {/* Date Range Error (FE38) */}
        {dateRangeError && (
          <div
            data-testid="date-range-error-alert"
            style={{
              padding: '0.6rem 0.8rem',
              background: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-danger)',
              borderRadius: '6px',
              color: 'var(--color-danger)',
              fontSize: '0.85rem',
            }}
          >
            {dateRangeError}
          </div>
        )}
      </div>

      {/* Main Content */}
      {loading ? (
        <p>Đang tổng hợp số liệu phễu tuyển dụng...</p>
      ) : error ? (
        <div
          data-testid="statistics-error-alert"
          style={{
            padding: '1rem',
            background: 'var(--color-danger-subtle)',
            border: '1px solid var(--color-danger)',
            borderRadius: '8px',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </div>
      ) : data ? (
        <>
          {/* Summary Metric Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '1rem',
              marginBottom: '1.5rem',
            }}
          >
            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                1. Đã nộp (Submitted)
              </span>
              <div
                data-testid="count-submitted"
                style={{ fontSize: '1.75rem', fontWeight: 700, marginTop: '0.25rem' }}
              >
                {data.submitted}
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                2. Sàng lọc (Screening)
              </span>
              <div
                data-testid="count-screening"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: '#2563eb',
                }}
              >
                {data.screening}
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                3. Đã phỏng vấn (Interviewed)
              </span>
              <div
                data-testid="count-interviewed"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: '#7c3aed',
                }}
              >
                {data.interviewed}
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                4. Trúng tuyển (Hired)
              </span>
              <div
                data-testid="count-hired"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: '#16a34a',
                }}
              >
                {data.hired}
              </div>
            </div>

            <div
              style={{
                background: 'var(--color-bg-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '8px',
                padding: '1.25rem',
              }}
            >
              <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                Từ chối (Rejected)
              </span>
              <div
                data-testid="count-rejected"
                style={{
                  fontSize: '1.75rem',
                  fontWeight: 700,
                  marginTop: '0.25rem',
                  color: '#dc2626',
                }}
              >
                {data.rejected}
              </div>
            </div>
          </div>

          {/* Visual Funnel Section */}
          <div
            data-testid="visual-funnel-card"
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.15rem', fontWeight: 600 }}>
              Phễu Chuyển đổi Tuyển dụng (Recruitment Funnel)
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Step 1 */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.35rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>1. Hồ sơ đã nộp</span>
                  <strong>{data.submitted} hồ sơ (100%)</strong>
                </div>
                <div
                  style={{
                    height: '24px',
                    width: '100%',
                    background: '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '100%',
                      background: 'var(--color-primary)',
                      borderRadius: '6px',
                    }}
                  />
                </div>
              </div>

              {/* Step 2 */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.35rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>2. Qua vòng sàng lọc chuyên sâu</span>
                  <strong>
                    {data.screening} hồ sơ ({formatRate(data.rates.submittedToScreening)})
                  </strong>
                </div>
                <div
                  style={{
                    height: '24px',
                    width: '100%',
                    background: '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, data.rates.submittedToScreening))}%`,
                      background: '#2563eb',
                      borderRadius: '6px',
                    }}
                  />
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.35rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>3. Tham gia phỏng vấn</span>
                  <strong>
                    {data.interviewed} ứng viên ({formatRate(data.rates.screeningToInterviewed)})
                  </strong>
                </div>
                <div
                  style={{
                    height: '24px',
                    width: '100%',
                    background: '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, data.rates.screeningToInterviewed))}%`,
                      background: '#7c3aed',
                      borderRadius: '6px',
                    }}
                  />
                </div>
              </div>

              {/* Step 4 */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.35rem',
                    fontSize: '0.9rem',
                  }}
                >
                  <span>4. Trúng tuyển chính thức</span>
                  <strong>
                    {data.hired} người ({formatRate(data.rates.interviewedToHired)})
                  </strong>
                </div>
                <div
                  style={{
                    height: '24px',
                    width: '100%',
                    background: '#e2e8f0',
                    borderRadius: '6px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, Math.max(0, data.rates.interviewedToHired))}%`,
                      background: '#16a34a',
                      borderRadius: '6px',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* HTML Data Table for Accessibility (FE38) */}
          <div
            data-testid="statistics-table-card"
            style={{
              background: 'var(--color-bg-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 600 }}>
              Bảng Số liệu Chi tiết (HTML Data Table - A11y & Audit)
            </h3>
            <table
              data-testid="statistics-html-table"
              style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}
            >
              <thead>
                <tr style={{ background: 'var(--color-bg-secondary)', textAlign: 'left' }}>
                  <th
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    Giai đoạn Tuyển dụng
                  </th>
                  <th
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    Số lượng Hồ sơ
                  </th>
                  <th
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    Tỷ lệ chuyển đổi bước tiếp theo
                  </th>
                  <th
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    Tỷ lệ trên tổng hồ sơ nộp
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    1. Đã nộp hồ sơ (Submitted)
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {data.submitted}
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {formatRate(data.rates.submittedToScreening)}
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    100.0%
                  </td>
                </tr>
                <tr>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    2. Sàng lọc đạt yêu cầu (Screening)
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {data.screening}
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {formatRate(data.rates.screeningToInterviewed)}
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {formatRate(data.rates.submittedToScreening)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    3. Tham gia phỏng vấn (Interviewed)
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {data.interviewed}
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {formatRate(data.rates.interviewedToHired)}
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {formatRate((data.interviewed / (data.submitted || 1)) * 100)}
                  </td>
                </tr>
                <tr>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    4. Trúng tuyển chính thức (Hired)
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    {data.hired}
                  </td>
                  <td
                    style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}
                  >
                    -
                  </td>
                  <td
                    data-testid="overall-hired-rate"
                    style={{
                      padding: '10px 12px',
                      borderBottom: '1px solid var(--color-border)',
                      fontWeight: 600,
                      color: '#16a34a',
                    }}
                  >
                    {formatRate(data.rates.overallHiredRate)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
};
