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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownUp, Settings2, Wifi, WifiOff } from 'lucide-react';

interface MainAccountsClientProps {
  initialAccounts: Account[];
  user: SessionUserSummary;
}

export function MainAccountsClient({ initialAccounts, user }: MainAccountsClientProps) {
  const {
    accounts,
    setAccounts,
    addAccount,
    addTransaction,
    syncNow,
    isOnline,
    isSyncing,
    pendingSyncCount,
  } = useAccountData(initialAccounts);

  const recentMovements = useMemo(
    () =>
      accounts
        .flatMap((account) =>
          account.transactions.map((transaction) => ({
            accountName: account.name,
            ...transaction,
          }))
        )
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 4),
    [accounts]
  );

  return (
    <div className="relative isolate mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_10%,rgba(255,145,77,0.27),transparent_36%),radial-gradient(circle_at_88%_12%,rgba(66,186,230,0.23),transparent_32%),radial-gradient(circle_at_55%_85%,rgba(241,107,62,0.15),transparent_38%)]" />

      <AppHeader
        accounts={accounts}
        setAccounts={setAccounts}
        user={user}
        pendingSyncCount={pendingSyncCount}
        isSyncing={isSyncing}
        isOnline={isOnline}
        onSyncNow={syncNow}
      />

      <div className="mb-8 grid gap-4 xl:grid-cols-[1.45fr_0.55fr]">
        <TransactionForm accounts={accounts} onAddTransaction={addTransaction} />

        <Card className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/35">
          <CardHeader className="pb-3">
            <CardTitle className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Session Pulse</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-2xl border border-black/10 bg-white/65 p-3 dark:border-white/10 dark:bg-black/25">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Accounts</p>
              <p className="font-display text-3xl text-zinc-900 dark:text-zinc-100">{accounts.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/65 p-3 dark:border-white/10 dark:bg-black/25">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Connection</p>
              <div className="mt-1 flex items-center gap-2">
                {isOnline ? <Wifi className="h-4 w-4 text-emerald-600" /> : <WifiOff className="h-4 w-4 text-rose-500" />}
                <p className="font-display text-2xl text-zinc-900 dark:text-zinc-100">{isOnline ? 'Online' : 'Offline'}</p>
              </div>
            </div>
            <div className="rounded-2xl border border-black/10 bg-white/65 p-3 dark:border-white/10 dark:bg-black/25">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Pending Sync</p>
              <p className="font-display text-3xl text-zinc-900 dark:text-zinc-100">{pendingSyncCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
        <AccountList accounts={accounts} />

        <div className="space-y-6">
          <Card className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/35">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                <ArrowDownUp className="h-4 w-4" />
                Recent Moves
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentMovements.length === 0 && (
                <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
                  No movements yet.
                </p>
              )}
              {recentMovements.length > 0 && (
                <div className="space-y-2">
                  {recentMovements.map((movement, index) => (
                    <article
                      key={`${movement.accountName}-${movement.id}-${index}`}
                      className="rounded-2xl border border-black/10 bg-white/65 p-3 dark:border-white/10 dark:bg-black/25"
                    >
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{movement.accountName}</p>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300">{movement.description}</p>
                      <p className={`font-display text-xl ${movement.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {movement.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-black/10 bg-white/75 backdrop-blur-md dark:border-white/10 dark:bg-black/30">
            <Collapsible>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="flex-row items-center justify-between">
                  <CardTitle className="font-mono text-xs uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">
                    Management (Rarely Needed)
                  </CardTitle>
                  <Settings2 className="h-5 w-5 text-zinc-500" />
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <AccountForm onAddAccount={addAccount} />
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        </div>
      </div>
    </div>
  );
}
