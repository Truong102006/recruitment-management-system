import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog, ConfirmDialog } from './dialog';

describe('Dialog and ConfirmDialog', () => {
  it('does not render when open is false', () => {
    render(
      <Dialog open={false} onClose={() => {}} title="Closed Dialog">
        <div>Content</div>
      </Dialog>,
    );
    expect(screen.queryByText('Closed Dialog')).not.toBeInTheDocument();
  });

  it('renders content when open is true and handles backdrop click', () => {
    const handleClose = vi.fn();
    render(
      <Dialog open={true} onClose={handleClose} title="Open Dialog" description="Sub description">
        <div>Dialog Body</div>
      </Dialog>,
    );

    expect(screen.getByText('Open Dialog')).toBeInTheDocument();
    expect(screen.getByText('Sub description')).toBeInTheDocument();
    expect(screen.getByText('Dialog Body')).toBeInTheDocument();

    // Click backdrop
    const backdrop = screen.getByTestId('dialog-backdrop');
    fireEvent.click(backdrop);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closes on Escape key press', () => {
    const handleClose = vi.fn();
    render(
      <Dialog open={true} onClose={handleClose} title="Esc Dialog">
        <button>Inside Button</button>
      </Dialog>,
    );

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('renders ConfirmDialog and calls onConfirm on button click', () => {
    const handleConfirm = vi.fn();
    const handleClose = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onClose={handleClose}
        onConfirm={handleConfirm}
        title="Xóa tin tuyển dụng?"
        message="Hành động này không thể hoàn tác."
        confirmLabel="Đồng ý xóa"
      />,
    );

    expect(screen.getByText('Xóa tin tuyển dụng?')).toBeInTheDocument();
    expect(screen.getByText('Hành động này không thể hoàn tác.')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Đồng ý xóa'));
    expect(handleConfirm).toHaveBeenCalledTimes(1);
  });
});
