import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled,
    children,
    type = 'button',
    style,
    ...props
  },
  ref,
) {
  const getVariantStyles = (): React.CSSProperties => {
    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: 'var(--color-secondary)',
          color: 'var(--color-secondary-foreground)',
          border: '1px solid var(--color-border)',
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-primary)',
          border: '1px solid var(--color-primary)',
        };
      case 'danger':
        return {
          backgroundColor: 'var(--color-destructive)',
          color: 'var(--color-destructive-foreground)',
          border: '1px solid transparent',
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          color: 'var(--color-foreground)',
          border: '1px solid transparent',
        };
      case 'primary':
      default:
        return {
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
          border: '1px solid transparent',
        };
    }
  };

  const getSizeStyles = (): React.CSSProperties => {
    switch (size) {
      case 'sm':
        return {
          padding: 'var(--space-1) var(--space-3)',
          fontSize: 'var(--font-size-sm)',
          minHeight: '32px',
        };
      case 'lg':
        return {
          padding: 'var(--space-3) var(--space-6)',
          fontSize: 'var(--font-size-lg)',
          minHeight: '48px',
        };
      case 'md':
      default:
        return {
          padding: 'var(--space-2) var(--space-4)',
          fontSize: 'var(--font-size-base)',
          minHeight: '40px',
        };
    }
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading ? 'true' : undefined}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'var(--space-2)',
        fontWeight: 'var(--font-weight-medium)',
        borderRadius: 'var(--radius-md)',
        transition: 'background-color 0.15s ease, opacity 0.15s ease',
        cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
        opacity: disabled || isLoading ? 0.6 : 1,
        ...getVariantStyles(),
        ...getSizeStyles(),
        ...style,
      }}
      {...props}
    >
      {isLoading && (
        <span
          aria-hidden="true"
          style={{
            display: 'inline-block',
            width: '1em',
            height: '1em',
            border: '2px solid currentColor',
            borderRightColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.75s linear infinite',
          }}
        />
      )}
      {children}
    </button>
  );
});
