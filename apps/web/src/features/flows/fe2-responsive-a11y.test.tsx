import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { Dialog } from '../../components/ui/dialog';
import { DataTable, type ColumnDef } from '../../components/data-table/data-table';
import { StatusBadge } from '../../components/ui/status-badge';

interface SampleItem {
  id: string;
  name: string;
  role: string;
  status: string;
}

const sampleColumns: ColumnDef<SampleItem>[] = [
  { key: 'name', header: 'Họ tên', sortable: true, render: (i: SampleItem) => i.name },
  { key: 'role', header: 'Vai trò', sortable: true, render: (i: SampleItem) => i.role },
  {
    key: 'status',
    header: 'Trạng thái',
    render: (i: SampleItem) => <StatusBadge status={i.status} />,
  },
];

const sampleData: SampleItem[] = [
  { id: '1', name: 'Trần Văn A', role: 'RECRUITER', status: 'ACTIVE' },
  { id: '2', name: 'Lê Thị B', role: 'INTERVIEWER', status: 'PENDING' },
];

const DataTableSortWrapper: React.FC = () => {
  const [sortKey, setSortKey] = useState<string | undefined>(undefined);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | undefined>(undefined);

  return (
    <DataTable
      columns={sampleColumns}
      data={sampleData}
      keyExtractor={(item) => item.id}
      selectable
      onSelectionChange={vi.fn()}
      sortKey={sortKey}
      sortDirection={sortDirection}
      onSortChange={(k, d) => {
        setSortKey(k);
        setSortDirection(d);
      }}
    />
  );
};

const DialogTestWrapper: React.FC = () => {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button data-testid="open-trigger">Mở Dialog</button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Tiêu đề Hộp thoại A11y"
        description="Mô tả trợ năng cho Screen Reader"
      >
        <div>
          <label htmlFor="test-input">Họ và tên</label>
          <input id="test-input" data-testid="first-input" type="text" />
          <button data-testid="confirm-btn">Xác nhận</button>
        </div>
      </Dialog>
    </div>
  );
};

describe('FE2 Accessibility (A11y) & Responsive Suite (Pha 6)', () => {
  // A11y: Dialog Focus Trap & Keyboard Escape
  it('A11y: Dialog has semantic dialog role, aria-modal, aria-labelledby, and handles Escape key', () => {
    const { getByRole, queryByRole } = render(<DialogTestWrapper />);

    const dialog = getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'dialog-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'dialog-description');

    // Press Escape key
    fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

    // Dialog closes
    expect(queryByRole('dialog')).not.toBeInTheDocument();
  });

  // A11y: DataTable Semantics & ARIA Sorting
  it('A11y: DataTable renders semantic table, aria-sort headers, and checkbox labels', () => {
    render(<DataTableSortWrapper />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();
    expect(table).toHaveAttribute('aria-label', 'Bảng dữ liệu');

    // Headers have aria-sort attribute
    const nameHeader = screen.getByText('Họ tên').closest('th');
    expect(nameHeader).toHaveAttribute('aria-sort', 'none');

    // Click header to sort ascending
    fireEvent.click(nameHeader!);
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');

    // Click header again to sort descending
    fireEvent.click(nameHeader!);
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');

    // Select all checkbox has aria-label
    expect(screen.getByLabelText('Chọn tất cả')).toBeInTheDocument();
  });

  // Responsive: Card renderer on small viewports
  it('Responsive: DataTable renders card view container when cardRenderer is supplied', () => {
    render(
      <DataTable
        columns={sampleColumns}
        data={sampleData}
        keyExtractor={(item) => item.id}
        cardRenderer={(item) => (
          <div data-testid={`card-${item.id}`}>
            <strong>{item.name}</strong>
            <span>{item.role}</span>
          </div>
        )}
      />,
    );

    // Card items exist in DOM ready for media query activation on mobile
    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(screen.getByTestId('card-2')).toBeInTheDocument();

    // Table container has has-card-renderer class
    const tableWrapper = document.querySelector('.table-wrapper');
    expect(tableWrapper?.classList.contains('has-card-renderer')).toBe(true);
  });
});
