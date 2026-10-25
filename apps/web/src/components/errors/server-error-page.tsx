import React from 'react';
import { Button } from '../ui/button';

export interface ServerErrorPageProps {
  status?: number;
  message?: string;
  traceId?: string;
  onRetry?: () => void;
}

export function ServerErrorPage({
  status = 500,
  message = 'Hệ thống đang gặp sự cố tạm thời. Vui lòng thử lại sau ít phút.',
  traceId,
  onRetry,
}: ServerErrorPageProps) {
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
        {status}
      </span>
      <h1
        tabIndex={-1}
        style={{
          fontSize: 'var(--font-size-2xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--color-foreground)',
        }}
      >
        {status === 503 ? 'Dịch vụ tạm thời gián đoạn' : 'Lỗi hệ thống'}
      </h1>
      <p
        style={{
          maxWidth: '480px',
          color: 'var(--color-muted)',
          fontSize: 'var(--font-size-base)',
        }}
      >
        {message}
      </p>

      {traceId && (
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-muted-foreground)',
            fontFamily: 'var(--font-family-mono)',
            backgroundColor: 'var(--color-muted-bg)',
            padding: 'var(--space-1) var(--space-3)',
            borderRadius: 'var(--radius-sm)',
          }}
        >
          Mã tra soát (Trace ID): {traceId}
        </div>
      )}

      <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
        {onRetry && (
          <Button onClick={onRetry} variant="primary">
            Thử lại
          </Button>
        )}
        <Button
          onClick={() => {
            window.location.href = '/jobs';
          }}
          variant="secondary"
        >
          Về trang tìm việc
        </Button>
      </div>
    </div>
  );
}
