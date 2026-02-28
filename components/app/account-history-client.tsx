'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useAppData } from '@/components/app/app-data-context';
import { HistoryPanel } from '@/components/app/history-panel';
import { runWithViewTransition } from '@/lib/view-transitions';

interface AccountHistoryClientProps {
  accountId: number;
}

export function AccountHistoryClient({ accountId }: AccountHistoryClientProps) {
  const router = useRouter();
  const { accounts, deleteAccount } = useAppData();
  const account = accounts.find((item) => item.id === accountId);
  const navigateToAccounts = useCallback(() => {
    runWithViewTransition(() => {
      if (window.history.length > 1) {
        router.back();
        return;
      }

      router.replace('/accounts');
    });
  }, [router]);

  return (
    <div className="mx-auto max-w-screen-lg space-y-5 px-4 pb-12 pt-5 sm:px-6 sm:pt-7">
      <Link
        href="/accounts"
        onClick={(event) => {
          event.preventDefault();
          navigateToAccounts();
        }}
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
            navigateToAccounts();
          }}
        />
      ) : (
        <p className="text-sm text-muted-foreground">Account not found.</p>
      )}
    </div>
  );
}
