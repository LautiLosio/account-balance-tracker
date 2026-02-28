'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useAccountData } from '@/hooks/useAccountData';
import type { SessionUserSummary } from '@/lib/server-accounts';
import type { Account } from '@/types/schema';

type AppDataContextValue = ReturnType<typeof useAccountData> & {
  user: SessionUserSummary;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

interface AppDataProviderProps {
  children: ReactNode;
  initialAccounts: Account[];
  user: SessionUserSummary;
}

export function AppDataProvider({ children, initialAccounts, user }: AppDataProviderProps) {
  const accountData = useAccountData(initialAccounts);

  return <AppDataContext.Provider value={{ ...accountData, user }}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  return context;
}
