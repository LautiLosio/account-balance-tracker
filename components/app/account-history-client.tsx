'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
    <div className="min-h-[calc(100vh-3.5rem)]">
      <AppHeader
        accounts={accounts}
        setAccounts={setAccounts}
        user={user}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        isOnline={isOnline}
        onSyncNow={syncNow}
      />
      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        <Link
          href="/accounts"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to accounts
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
