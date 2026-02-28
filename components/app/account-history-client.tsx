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
  const { accounts, setAccounts, deleteAccount } = useAccountData(initialAccounts);
  const account = accounts.find((item) => item.id === accountId);

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <AppHeader accounts={accounts} setAccounts={setAccounts} user={user} />
      <Button variant="ghost" className="mb-4" asChild>
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
