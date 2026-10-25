import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/auth-context';
import type { UserRole } from '@rms/contracts/public';

export interface ProtectedRouteProps {
  requiredRoles?: UserRole[];
  children?: React.ReactNode;
}

export function ProtectedRoute({ requiredRoles, children }: ProtectedRouteProps) {
  const { status, actor, hasRole } = useAuth();
  const location = useLocation();

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
        <span>Đang kiểm tra quyền truy cập...</span>
      </div>
    );
  }

  if (status === 'unauthenticated' || !actor) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some((role) => hasRole(role));
    if (!hasRequiredRole) {
      return <Navigate to="/403" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
}
