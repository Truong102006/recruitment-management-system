import React from 'react';

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
}) => {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= 0) return null;

  return (
    <div
      data-testid="pagination-control"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        paddingTop: '16px',
        fontSize: '13px',
        color: 'var(--ink2)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span>
          Hiển thị {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, total)} trong số {total}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              borderRadius: '6px',
              border: '1px solid var(--line)',
              background: 'var(--card)',
              fontSize: '12px',
            }}
          >
            {pageSizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt} / trang
              </option>
            ))}
          </select>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn sm"
          style={{ padding: '6px 10px', opacity: page <= 1 ? 0.5 : 1 }}
        >
          Trước
        </button>

        <span style={{ padding: '0 8px', fontWeight: 500 }}>
          Trang {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="btn sm"
          style={{ padding: '6px 10px', opacity: page >= totalPages ? 0.5 : 1 }}
        >
          Sau
        </button>
      </div>
    </div>
  );
};
