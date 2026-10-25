import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/button';

export function ForbiddenPage() {
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
          color: 'var(--color-destructive)',
          lineHeight: 1,
        }}
      >
        403
      </span>
      <h1
        tabIndex={-1}
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-foreground)',
        }}
      >
        Truy cập bị từ chối
      </h1>
      <p
        style={{
          maxWidth: '480px',
          color: 'var(--color-muted)',
          fontSize: 'var(--font-size-base)',
        }}
      >
        Bạn không có quyền truy cập vào tài nguyên hoặc thực hiện hành động này.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        <Link to="/jobs">
          <Button variant="primary">Về trang tìm việc</Button>
        </Link>
        <Link to="/login">
          <Button variant="outline">Đổi tài khoản</Button>
        </Link>
      </div>
    </div>
  );
}
