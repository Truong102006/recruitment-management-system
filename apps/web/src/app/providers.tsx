import React, { useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../features/auth/context/auth-context';
import { CompanyProvider } from '../features/companies/context/company-context';

export interface AppProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

export const AppProviders: React.FC<AppProvidersProps> = ({
  children,
  queryClient: externalClient,
}) => {
  const queryClient = useMemo(
    () =>
      externalClient ??
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      }),
    [externalClient],
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CompanyProvider>{children}</CompanyProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
