import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type ColumnDef } from './data-table';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
}

const mockData: UserItem[] = [
  { id: '1', name: 'Alice Smith', email: 'alice@acme.com', role: 'Developer' },
  { id: '2', name: 'Bob Jones', email: 'bob@acme.com', role: 'Designer' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@acme.com', role: 'Manager' },
];

const columns: ColumnDef<UserItem>[] = [
  { key: 'name', header: 'Họ tên', sortable: true },
  { key: 'email', header: 'Email' },
  { key: 'role', header: 'Vị trí', sortable: true },
];

describe('DataTable', () => {
  it('renders table headers and rows accurately', () => {
    render(<DataTable data={mockData} columns={columns} keyExtractor={(item) => item.id} />);

    expect(screen.getByText('Họ tên')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Vị trí')).toBeInTheDocument();
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
    expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
  });

  it('renders loading state when loading is true', () => {
    render(
      <DataTable data={[]} columns={columns} keyExtractor={(item) => item.id} loading={true} />,
    );
    expect(screen.getByText('Đang tải dữ liệu...')).toBeInTheDocument();
  });

  it('renders empty message when data is empty', () => {
    render(
      <DataTable
        data={[]}
        columns={columns}
        keyExtractor={(item) => item.id}
        emptyMessage="Không tìm thấy kết quả"
      />,
    );
    expect(screen.getByText('Không tìm thấy kết quả')).toBeInTheDocument();
  });

  it('triggers sorting callback when clicking sortable column header', () => {
    const handleSort = vi.fn();
    render(
      <DataTable
        data={mockData}
        columns={columns}
        keyExtractor={(item) => item.id}
        sortKey="name"
        sortDirection="asc"
        onSortChange={handleSort}
      />,
    );

    fireEvent.click(screen.getByText('Họ tên'));
    expect(handleSort).toHaveBeenCalledWith('name', 'desc');

    fireEvent.click(screen.getByText('Vị trí'));
    expect(handleSort).toHaveBeenCalledWith('role', 'asc');
  });

  it('handles search filtering and clear button', () => {
    render(
      <DataTable
        data={mockData}
        columns={columns}
        keyExtractor={(item) => item.id}
        searchPlaceholder="Tìm theo tên"
        searchFilter={(item, q) => item.name.toLowerCase().includes(q.toLowerCase())}
      />,
    );

    const searchInput = screen.getByPlaceholderText('Tìm theo tên');
    fireEvent.change(searchInput, { target: { value: 'Alice' } });

    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();

    // Click clear button
    fireEvent.click(screen.getByText('Xóa lọc'));
    expect(screen.getByText('Bob Jones')).toBeInTheDocument();
  });

  it('supports row selection and select all checkbox', () => {
    const handleSelection = vi.fn();
    render(
      <DataTable
        data={mockData}
        columns={columns}
        keyExtractor={(item) => item.id}
        selectable={true}
        selectedKeys={['1']}
        onSelectionChange={handleSelection}
      />,
    );

    // Select row 2
    const row2Check = screen.getByLabelText('Chọn dòng 2');
    fireEvent.click(row2Check);
    expect(handleSelection).toHaveBeenCalledWith(['1', '2']);

    // Select All
    const selectAllCheck = screen.getByLabelText('Chọn tất cả');
    fireEvent.click(selectAllCheck);
    expect(handleSelection).toHaveBeenCalledWith(['1', '2', '3']);
  });

  it('renders card view when cardRenderer is provided', () => {
    render(
      <DataTable
        data={mockData}
        columns={columns}
        keyExtractor={(item) => item.id}
        cardRenderer={(item) => <div data-testid={`card-${item.id}`}>{item.name} Card</div>}
      />,
    );

    expect(screen.getByTestId('card-1')).toHaveTextContent('Alice Smith Card');
  });
});
