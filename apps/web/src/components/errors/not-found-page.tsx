import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export function NotFoundPage() {
  return (
    <div
      role="main"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 'var(--space-6)',
        textAlign: 'center',
        gap: 'var(--space-4)',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          fontSize: '4rem',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-muted-foreground)',
          lineHeight: 1,
        }}
      >
        404
      </span>
      <h1
        tabIndex={-1}
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-foreground)',
        }}
      >
        Không tìm thấy trang
      </h1>
      <p
        style={{
          maxWidth: '480px',
          color: 'var(--color-muted)',
          fontSize: 'var(--font-size-base)',
        }}
      >
        Trang bạn đang tìm kiếm không tồn tại, đã bị xóa hoặc bạn không có quyền truy cập.
      </p>
      <Link to="/jobs">
        <Button variant="primary">Về trang tìm việc</Button>
      </Link>
    </div>
  );
}
