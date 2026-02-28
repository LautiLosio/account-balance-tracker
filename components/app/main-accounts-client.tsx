'use client';

import { Account } from '@/types/schema';
import { useAccountData } from '@/hooks/useAccountData';
import { SessionUserSummary } from '@/lib/server-accounts';
import { AppHeader } from '@/components/app/app-header';
import { AccountCrudPanel } from '@/components/app/account-crud-panel';
import { TransactionComposerPanel } from '@/components/app/transaction-composer-panel';

interface MainAccountsClientProps {
  initialAccounts: Account[];
  user: SessionUserSummary;
}

export function MainAccountsClient({ initialAccounts, user }: MainAccountsClientProps) {
  const { accounts, setAccounts, addAccount, addTransaction } = useAccountData(initialAccounts);

  return (
    <div className="container mx-auto max-w-4xl p-4">
      <AppHeader accounts={accounts} setAccounts={setAccounts} user={user} />
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Open an account card to view full history, with deep-linkable URLs under /accounts/[id].</p>
        <AccountCrudPanel accounts={accounts} onAddAccount={addAccount} />
        <TransactionComposerPanel accounts={accounts} onAddTransaction={addTransaction} />
      </div>
    </div>
  );
}
