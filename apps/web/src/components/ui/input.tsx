import React, { forwardRef, useId } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id: customId, required, style, ...props },
  ref,
) {
  const generatedId = useId();
  const id = customId || generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-1)',
        width: '100%',
      }}
    >
      {label && (
        <label
          htmlFor={id}
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 'var(--font-weight-medium)',
            color: 'var(--color-foreground)',
          }}
        >
          {label}
          {required && (
            <span
              style={{ color: 'var(--color-destructive)', marginLeft: 'var(--space-1)' }}
              aria-hidden="true"
            >
              *
            </span>
          )}
        </label>
      )}

      <input
        ref={ref}
        id={id}
        required={required}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={describedBy}
        style={{
          width: '100%',
          padding: 'var(--space-2) var(--space-3)',
          fontSize: 'var(--font-size-base)',
          lineHeight: 'var(--line-height-base)',
          borderRadius: 'var(--radius-md)',
          border: error ? '1px solid var(--color-destructive)' : '1px solid var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-foreground)',
          outline: 'none',
          transition: 'border-color 0.15s ease',
          ...style,
        }}
        {...props}
      />

      {hint && !error && (
        <span id={hintId} style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-muted)' }}>
          {hint}
        </span>
      )}

      {error && (
        <span
          id={errorId}
          role="alert"
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-destructive)',
            fontWeight: 'var(--font-weight-medium)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  );
});
