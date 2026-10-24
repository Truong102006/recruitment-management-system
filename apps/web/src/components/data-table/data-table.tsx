import React, { useState, useMemo } from 'react';
import { Pagination } from '../ui/pagination';

export interface ColumnDef<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (item: T) => string;
  loading?: boolean;
  emptyMessage?: string;
  searchPlaceholder?: string;
  searchFilter?: (item: T, query: string) => boolean;

  // Selection
  selectable?: boolean;
  selectedKeys?: string[];
  onSelectionChange?: (selectedKeys: string[]) => void;

  // Sorting
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;

  // Pagination
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;

  // Mobile / Alternative view
  cardRenderer?: (item: T) => React.ReactNode;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  emptyMessage = 'Không có dữ liệu',
  searchPlaceholder,
  searchFilter,
  selectable = false,
  selectedKeys = [],
  onSelectionChange,
  sortKey,
  sortDirection = 'asc',
  onSortChange,
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  cardRenderer,
}: DataTableProps<T>): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredData = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    return data.filter((item) => searchFilter(item, searchQuery.trim()));
  }, [data, searchQuery, searchFilter]);

  const allKeys = useMemo(() => filteredData.map(keyExtractor), [filteredData, keyExtractor]);
  const isAllSelected = allKeys.length > 0 && allKeys.every((k) => selectedKeys.includes(k));

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (isAllSelected) {
      onSelectionChange(selectedKeys.filter((k) => !allKeys.includes(k)));
    } else {
      const merged = Array.from(new Set([...selectedKeys, ...allKeys]));
      onSelectionChange(merged);
    }
  };

  const handleSelectRow = (key: string) => {
    if (!onSelectionChange) return;
    if (selectedKeys.includes(key)) {
      onSelectionChange(selectedKeys.filter((k) => k !== key));
    } else {
      onSelectionChange([...selectedKeys, key]);
    }
  };

  const handleHeaderClick = (col: ColumnDef<T>) => {
    if (!col.sortable || !onSortChange) return;
    if (sortKey === col.key) {
      onSortChange(col.key, sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(col.key, 'asc');
    }
  };

  return (
    <div className="data-table-container" style={{ width: '100%' }}>
      {/* Search Header */}
      {searchPlaceholder && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid var(--line)',
              background: 'var(--card)',
              fontSize: '13px',
              width: 'min(300px, 100%)',
            }}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="btn sm"
              style={{ fontSize: '12px' }}
            >
              Xóa lọc
            </button>
          )}
        </div>
      )}

      {/* Desktop & Tablet Table View */}
      <div
        className={`table-wrapper ${cardRenderer ? 'has-card-renderer' : ''}`}
        style={{
          overflowX: 'auto',
          border: '1px solid var(--hair)',
          borderRadius: '16px',
          background: 'var(--card)',
          boxShadow: 'var(--sh-s)',
        }}
      >
        <table
          role="table"
          aria-label="Bảng dữ liệu"
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
            fontSize: '13.5px',
          }}
        >
          <thead>
            <tr style={{ background: 'var(--soft2)', borderBottom: '1px solid var(--line)' }}>
              {selectable && (
                <th style={{ width: '40px', padding: '12px 14px' }}>
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Chọn tất cả"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleHeaderClick(col)}
                  aria-sort={
                    col.sortable
                      ? sortKey === col.key
                        ? sortDirection === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : 'none'
                      : undefined
                  }
                  style={{
                    padding: '12px 14px',
                    fontWeight: 600,
                    color: 'var(--ink2)',
                    width: col.width,
                    textAlign: col.align ?? 'left',
                    cursor: col.sortable ? 'pointer' : 'default',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {col.header}
                    {col.sortable && sortKey === col.key && (
                      <span style={{ fontSize: '11px', color: 'var(--blue)' }}>
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  style={{ padding: '36px', textAlign: 'center', color: 'var(--muted)' }}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              filteredData.map((item, idx) => {
                const key = keyExtractor(item);
                const isSelected = selectedKeys.includes(key);

                return (
                  <tr
                    key={key}
                    style={{
                      borderBottom: '1px solid var(--hair2)',
                      background: isSelected ? 'var(--tint-bg)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    {selectable && (
                      <td style={{ padding: '12px 14px' }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectRow(key)}
                          aria-label={`Chọn dòng ${idx + 1}`}
                        />
                      </td>
                    )}
                    {columns.map((col) => {
                      const value = (item as Record<string, unknown>)[col.key];
                      return (
                        <td
                          key={col.key}
                          style={{
                            padding: '12px 14px',
                            textAlign: col.align ?? 'left',
                            color: 'var(--ink)',
                          }}
                        >
                          {col.render ? col.render(item, idx) : (value as React.ReactNode)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View (renders when cardRenderer is provided) */}
      {cardRenderer && filteredData.length > 0 && (
        <div
          className="mobile-card-list"
          style={{ display: 'none', flexDirection: 'column', gap: '10px', marginTop: '12px' }}
        >
          {filteredData.map((item) => (
            <div key={keyExtractor(item)} className="card">
              {cardRenderer(item)}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {page !== undefined && pageSize !== undefined && total !== undefined && onPageChange && (
        <Pagination
          page={page}
          pageSize={pageSize}
          total={total}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
