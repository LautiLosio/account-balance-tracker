'use client';

import { useMemo } from 'react';
import { Account } from '@/types/schema';
import { useAccountData } from '@/hooks/useAccountData';
import { SessionUserSummary } from '@/lib/server-accounts';
import { AppHeader } from '@/components/app/app-header';
import { AccountForm } from '@/components/account-form';
import { AccountList } from '@/components/account-list';
import { TransactionForm } from '@/components/transaction-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowDownUp, ChevronDown, Settings2, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainAccountsClientProps {
  initialAccounts: Account[];
  user: SessionUserSummary;
}

export function MainAccountsClient({ initialAccounts, user }: MainAccountsClientProps) {
  const { accounts, setAccounts, addAccount, addTransaction, syncNow, isOnline, isSyncing, pendingSyncCount } = useAccountData(initialAccounts);

  const totalBalance = useMemo(() => accounts.reduce((sum, a) => sum + a.currentBalance, 0), [accounts]);

  const recentMovements = useMemo(
    () =>
      accounts
        .flatMap((account) => account.transactions.map((t) => ({ accountName: account.name, ...t })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5),
    [accounts]
  );

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

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        {/* Portfolio hero */}
        <section className="rounded-xl border bg-card px-6 py-5">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Total Portfolio</p>
          <p className="mt-1 font-mono text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
            {totalBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span>{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</span>
            <span className="h-3 w-px bg-border" />
            <span className={cn(isOnline ? 'text-emerald-500' : 'text-rose-500')}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
            {pendingSyncCount > 0 && (
              <>
                <span className="h-3 w-px bg-border" />
                <span className="text-amber-500">{pendingSyncCount} pending sync</span>
              </>
            )}
          </div>
        </section>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <AccountList accounts={accounts} />

          <div className="space-y-4">
            <TransactionForm accounts={accounts} onAddTransaction={addTransaction} />

            {/* Recent movements */}
            <section className="rounded-xl border bg-card">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <ArrowDownUp className="h-3.5 w-3.5 text-muted-foreground" />
                <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Recent Movements</h3>
              </div>
              {recentMovements.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-muted-foreground">No movements yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {recentMovements.map((m, i) => (
                    <li key={`${m.accountName}-${m.id}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{m.accountName}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.description}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {m.amount >= 0
                          ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                          : <TrendingDown className="h-3 w-3 text-rose-500" />
                        }
                        <span className={cn('font-mono text-sm font-semibold tabular-nums', m.amount >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                          {m.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Account management */}
            <Collapsible>
              <section className="rounded-xl border bg-card">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30">
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Manage Accounts</span>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="border-t border-border p-4">
                    <AccountForm onAddAccount={addAccount} />
                  </div>
                </CollapsibleContent>
              </section>
            </Collapsible>
          </div>
        </div>
      </div>
    </div>
  );
}
