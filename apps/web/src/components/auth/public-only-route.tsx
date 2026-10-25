import React from 'react';
import { Navigate, Outlet, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/auth-context';
import { sanitizeReturnTo } from '../../features/auth/utils/validation';

export interface PublicOnlyRouteProps {
  children?: React.ReactNode;
  redirectTo?: string;
}

export function PublicOnlyRoute({ children, redirectTo = '/jobs' }: PublicOnlyRouteProps) {
  const { status, isAuthenticated } = useAuth();
  const [searchParams] = useSearchParams();

  if (status === 'loading') {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '200px',
          color: 'var(--color-muted)',
        }}
      >
        <span>Đang kiểm tra trạng thái...</span>
      </div>
    );
  }

  if (isAuthenticated) {
    const target = sanitizeReturnTo(searchParams.get('returnTo'), redirectTo);
    return <Navigate to={target} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
