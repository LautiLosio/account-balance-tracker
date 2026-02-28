'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeftCircle } from 'lucide-react';
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
    <div className="relative isolate mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_8%,rgba(255,145,77,0.22),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(66,186,230,0.17),transparent_34%)]" />
      <AppHeader
        accounts={accounts}
        setAccounts={setAccounts}
        user={user}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        isOnline={isOnline}
        onSyncNow={syncNow}
      />
      <Button variant="ghost" className="mb-4 rounded-full border border-black/10 bg-white/70 px-4 backdrop-blur-md dark:border-white/10 dark:bg-black/35" asChild>
        <Link href="/accounts">
          <ArrowLeftCircle className="mr-2 h-4 w-4" />
          Back to accounts
        </Link>
      </Button>

      {account ? (<HistoryPanel
        account={account}
        onDeleteAccount={async (id) => {
          await deleteAccount(id);
          router.push('/accounts');
        }}
      />) : (
        <p className="text-muted-foreground">Account not found.</p>
      )}
    </div>
  );
}
