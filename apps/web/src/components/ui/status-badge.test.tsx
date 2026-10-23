import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders standard known application status with label and dot', () => {
    render(<StatusBadge status="HIRED" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('Đã tuyển dụng');
    expect(badge).toHaveAttribute('data-status', 'HIRED');
  });

  it('renders custom label when provided', () => {
    render(<StatusBadge status="SCREENING" customLabel="Đang kiểm tra hồ sơ" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('Đang kiểm tra hồ sơ');
  });

  it('handles unknown status gracefully', () => {
    render(<StatusBadge status="CUSTOM_UNKNOWN_STATUS" />);
    const badge = screen.getByTestId('status-badge');
    expect(badge).toHaveTextContent('CUSTOM_UNKNOWN_STATUS');
  });

  it('supports medium size', () => {
    render(<StatusBadge status="PUBLISHED" size="md" />);
    expect(screen.getByTestId('status-badge')).toBeInTheDocument();
  });
});
