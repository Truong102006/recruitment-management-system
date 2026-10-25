import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '../ui/button';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (import.meta.env?.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '300px',
            padding: 'var(--space-6)',
            textAlign: 'center',
            gap: 'var(--space-4)',
          }}
        >
          <div
            style={{
              fontSize: 'var(--font-size-2xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-destructive)',
            }}
          >
            Đã xảy ra lỗi không mong muốn
          </div>
          <p style={{ maxWidth: '480px', color: 'var(--color-muted)' }}>
            Hệ thống gặp sự cố khi tải trang này. Vui lòng thử tải lại hoặc quay lại trang chủ.
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
            <Button onClick={this.handleReset} variant="primary">
              Thử lại
            </Button>
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

    return this.props.children;
  }
}
