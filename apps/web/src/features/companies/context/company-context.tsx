import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { CompanyDto, MembershipRole } from '@rms/contracts/public';
import { AuthContext } from '../../auth/context/auth-context';
import { apiClient } from '../../../lib/http/api-client';

export interface CompanyMembershipInfo {
  company: CompanyDto;
  role: MembershipRole;
}

export interface CompanyContextValue {
  currentCompanyId: string | null;
  currentCompany: CompanyDto | null;
  currentRole: MembershipRole | null;
  memberships: CompanyMembershipInfo[];
  setMemberships: (memberships: CompanyMembershipInfo[]) => void;
  switchCompany: (companyId: string) => void;
}

export const CompanyContext = createContext<CompanyContextValue | null>(null);

export interface CompanyProviderProps {
  children: React.ReactNode;
  initialMemberships?: CompanyMembershipInfo[];
  initialCompanyId?: string;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
  initialMemberships,
  initialCompanyId,
}) => {
  const queryClient = useQueryClient();
  const auth = useContext(AuthContext);
  const [manualMemberships, setMemberships] = useState<CompanyMembershipInfo[] | undefined>(
    initialMemberships,
  );
  const { data } = useQuery({
    queryKey: ['my-companies', auth?.session?.userId],
    queryFn: () => apiClient.get<CompanyMembershipInfo[]>('/api/companies'),
    enabled: manualMemberships === undefined && !!auth?.session,
    retry: false,
  });
  const memberships = useMemo(() => manualMemberships ?? data ?? [], [manualMemberships, data]);
  const [selectedCompanyId, setCurrentCompanyId] = useState<string | null>(
    initialCompanyId ?? null,
  );
  const currentCompanyId = memberships.some((m) => m.company.id === selectedCompanyId)
    ? selectedCompanyId
    : (memberships[0]?.company.id ?? null);

  const currentMembership = useMemo(
    () => memberships.find((m) => m.company.id === currentCompanyId) ?? null,
    [memberships, currentCompanyId],
  );

  const switchCompany = useCallback(
    (newCompanyId: string) => {
      if (
        newCompanyId === currentCompanyId ||
        !memberships.some((m) => m.company.id === newCompanyId)
      )
        return;

      // 1. Cancel in-flight queries
      void queryClient.cancelQueries();

      // 2. Clear query cache for tenant-specific keys to prevent flashing other company data
      queryClient.removeQueries({
        predicate: (query) => {
          const key = query.queryKey;
          // Purge company-scoped keys (e.g. ['recruiter-jobs', { companyId }], ['applications', ...])
          return (
            Array.isArray(key) &&
            key.some(
              (part) =>
                typeof part === 'object' &&
                part !== null &&
                'companyId' in part &&
                (part as { companyId?: string }).companyId !== newCompanyId,
            )
          );
        },
      });

      // 3. Set new active company
      setCurrentCompanyId(newCompanyId);
    },
    [currentCompanyId, memberships, queryClient],
  );

  const value = useMemo<CompanyContextValue>(
    () => ({
      currentCompanyId,
      currentCompany: currentMembership?.company ?? null,
      currentRole: currentMembership?.role ?? null,
      memberships,
      setMemberships,
      switchCompany,
    }),
    [currentCompanyId, currentMembership, memberships, switchCompany],
  );

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};

export function useCompanyContext(): CompanyContextValue {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanyContext must be used within a CompanyProvider');
  }
  return context;
}

export function useOptionalCompany(): CompanyContextValue | null {
  return useContext(CompanyContext);
}
