import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from './pagination';

describe('Pagination', () => {
  it('returns null when total is 0', () => {
    const { container } = render(
      <Pagination page={1} pageSize={10} total={0} onPageChange={() => {}} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page indicator and handles next/prev clicks', () => {
    const handlePageChange = vi.fn();
    render(<Pagination page={2} pageSize={10} total={50} onPageChange={handlePageChange} />);

    expect(screen.getByText('Hiển thị 11 - 20 trong số 50')).toBeInTheDocument();
    expect(screen.getByText('Trang 2 / 5')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Trước'));
    expect(handlePageChange).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByText('Sau'));
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('disables Prev on first page and Next on last page', () => {
    const { rerender } = render(
      <Pagination page={1} pageSize={10} total={20} onPageChange={() => {}} />,
    );
    expect(screen.getByText('Trước')).toBeDisabled();
    expect(screen.getByText('Sau')).not.toBeDisabled();

    rerender(<Pagination page={2} pageSize={10} total={20} onPageChange={() => {}} />);
    expect(screen.getByText('Trước')).not.toBeDisabled();
    expect(screen.getByText('Sau')).toBeDisabled();
  });
});
