import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { SessionDto, UserRole } from '@rms/contracts/public';
import { apiClient } from '../../../lib/http/api-client';

export interface AuthContextValue {
  session: SessionDto | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
  refreshSession: () => Promise<SessionDto | null>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export interface AuthProviderProps {
  children: React.ReactNode;
  initialSession?: SessionDto | null;
  skipAutoFetch?: boolean;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  initialSession = null,
  skipAutoFetch = false,
}) => {
  const [session, setSession] = useState<SessionDto | null>(initialSession);
  const [isLoading, setIsLoading] = useState<boolean>(!initialSession && !skipAutoFetch);

  // Sync CSRF token with apiClient
  useEffect(() => {
    if (session?.csrfToken) {
      apiClient.setCsrfToken(session.csrfToken);
    } else {
      apiClient.setCsrfToken(null);
    }
  }, [session]);

  const refreshSession = useCallback(async (): Promise<SessionDto | null> => {
    setIsLoading(true);
    try {
      const data = await apiClient.get<SessionDto>('/api/auth/session');
      setSession(data);
      apiClient.setCsrfToken(data.csrfToken);
      return data;
    } catch {
      setSession(null);
      apiClient.setCsrfToken(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiClient.post('/api/auth/logout');
    } finally {
      setSession(null);
      apiClient.setCsrfToken(null);
    }
  }, []);

  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return session?.roles.includes(role) ?? false;
    },
    [session],
  );

  useEffect(() => {
    if (!initialSession && !skipAutoFetch) {
      void refreshSession();
    }
  }, [initialSession, skipAutoFetch, refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: !!session,
      isLoading,
      hasRole,
      refreshSession,
      logout,
    }),
    [session, isLoading, hasRole, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

export interface UseAuthResult extends AuthContextValue {
  actor: SessionDto | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

export function useAuth(): UseAuthResult {
  const context = useAuthContext();
  return {
    ...context,
    actor: context.session,
    status: context.isLoading
      ? 'loading'
      : context.isAuthenticated
        ? 'authenticated'
        : 'unauthenticated',
  };
}
