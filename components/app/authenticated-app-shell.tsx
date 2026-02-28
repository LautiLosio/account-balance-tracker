'use client';

import { ReactNode } from 'react';
import { AppDataProvider } from '@/components/app/app-data-context';
import { AppHeader } from '@/components/app/app-header';
import type { SessionUserSummary } from '@/lib/server-accounts';
import type { Account } from '@/types/schema';

interface AuthenticatedAppShellProps {
  children: ReactNode;
  initialAccounts: Account[];
  user: SessionUserSummary;
}

export function AuthenticatedAppShell({ children, initialAccounts, user }: AuthenticatedAppShellProps) {
  return (
    <AppDataProvider initialAccounts={initialAccounts} user={user}>
      <div className="min-h-[calc(100vh-3rem)]">
        <AppHeader />
        {children}
      </div>
    </AppDataProvider>
  );
}
