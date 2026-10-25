import React from 'react';

export interface AlertProps {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
  style?: React.CSSProperties;
}

export function Alert({ children, variant = 'info', title, style }: AlertProps) {
  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'success':
        return {
          backgroundColor: 'var(--color-success-bg)',
          color: 'var(--color-success-foreground)',
          borderColor: 'var(--color-success)',
        };
      case 'warning':
        return {
          backgroundColor: 'var(--color-warning-bg)',
          color: 'var(--color-warning-foreground)',
          borderColor: 'var(--color-warning)',
        };
      case 'error':
        return {
          backgroundColor: 'var(--color-destructive-bg)',
          color: 'var(--color-destructive)',
          borderColor: 'var(--color-destructive)',
        };
      case 'info':
      default:
        return {
          backgroundColor: 'var(--color-info-bg)',
          color: 'var(--color-info-foreground)',
          borderColor: 'var(--color-info)',
        };
    }
  };

  return (
    <div
      role={role}
      aria-live="polite"
      style={{
        padding: 'var(--space-3) var(--space-4)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid',
        fontSize: 'var(--font-size-sm)',
        lineHeight: 'var(--line-height-base)',
        ...getVariantStyles(),
        ...style,
      }}
    >
      {title && (
        <div style={{ fontWeight: 'var(--font-weight-semibold)', marginBottom: 'var(--space-1)' }}>
          {title}
        </div>
      )}
      <div>{children}</div>
    </div>
  );
}
