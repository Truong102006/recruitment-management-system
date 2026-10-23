import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CompanyDto, MembershipRole } from '@rms/contracts/public';

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

const CompanyContext = createContext<CompanyContextValue | null>(null);

export interface CompanyProviderProps {
  children: React.ReactNode;
  initialMemberships?: CompanyMembershipInfo[];
  initialCompanyId?: string;
}

export const CompanyProvider: React.FC<CompanyProviderProps> = ({
  children,
  initialMemberships = [],
  initialCompanyId,
}) => {
  const queryClient = useQueryClient();
  const [memberships, setMemberships] = useState<CompanyMembershipInfo[]>(initialMemberships);
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(
    initialCompanyId ?? initialMemberships[0]?.company.id ?? null,
  );

  const currentMembership = useMemo(
    () => memberships.find((m) => m.company.id === currentCompanyId) ?? null,
    [memberships, currentCompanyId],
  );

  const switchCompany = useCallback(
    (newCompanyId: string) => {
      if (newCompanyId === currentCompanyId) return;

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
    [currentCompanyId, queryClient],
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
