'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import { Account } from '@/types/schema';
import { SessionUserSummary } from '@/lib/server-accounts';
import { useAccountData } from '@/hooks/useAccountData';
import { AppHeader } from '@/components/app/app-header';
import { HistoryPanel } from '@/components/app/history-panel';

interface AccountHistoryClientProps {
  accountId: number;
  initialAccounts: Account[];
  user: SessionUserSummary;
}

export function AccountHistoryClient({ accountId, initialAccounts, user }: AccountHistoryClientProps) {
  const router = useRouter();
  const { accounts, setAccounts, deleteAccount, syncNow, isOnline, isSyncing, pendingSyncCount } = useAccountData(initialAccounts);
  const account = accounts.find((item) => item.id === accountId);

  return (
    <div className="min-h-[calc(100vh-3rem)]">
      <AppHeader
        accounts={accounts}
        setAccounts={setAccounts}
        user={user}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        isOnline={isOnline}
        onSyncNow={syncNow}
      />
      <div className="mx-auto max-w-screen-lg space-y-5 px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1 font-display text-sm font-bold text-muted-foreground transition-colors hover:text-foreground active:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          All Accounts
        </Link>

        {account ? (
          <HistoryPanel
            account={account}
            onDeleteAccount={async (id) => {
              await deleteAccount(id);
              router.push('/accounts');
            }}
          />
        ) : (
          <p className="text-sm text-muted-foreground">Account not found.</p>
        )}
      </div>
    </div>
  );
}
