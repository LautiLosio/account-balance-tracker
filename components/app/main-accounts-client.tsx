'use client';

import { useMemo, useState } from 'react';
import { Account } from '@/types/schema';
import { useAccountData } from '@/hooks/useAccountData';
import { SessionUserSummary } from '@/lib/server-accounts';
import { AppHeader } from '@/components/app/app-header';
import { AccountForm } from '@/components/account-form';
import { AccountList } from '@/components/account-list';
import { TransactionForm } from '@/components/transaction-form';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ChevronDown, Plus, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MainAccountsClientProps {
  initialAccounts: Account[];
  user: SessionUserSummary;
}

export function MainAccountsClient({ initialAccounts, user }: MainAccountsClientProps) {
  const [txSheetOpen, setTxSheetOpen] = useState(false);
  const { accounts, setAccounts, addAccount, addTransaction, syncNow, isOnline, isSyncing, pendingSyncCount } = useAccountData(initialAccounts);

  const totalBalance = useMemo(() => accounts.reduce((s, a) => s + a.currentBalance, 0), [accounts]);

  const recentMovements = useMemo(
    () =>
      accounts
        .flatMap((a) => a.transactions.map((t) => ({ accountName: a.name, ...t })))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6),
    [accounts]
  );

  const handleAddTransaction: typeof addTransaction = async (...args) => {
    await addTransaction(...args);
    setTxSheetOpen(false);
  };

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

      <div className="mx-auto max-w-screen-lg px-4 pb-28 pt-6 sm:px-6 sm:pb-12 sm:pt-8 lg:pb-10">

        {/* Portfolio hero */}
        <section className="animate-fade-in mb-8 opacity-0" style={{ animationDelay: '0ms', animationFillMode: 'forwards' }}>
          <p className="mb-1 font-mono text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Total Portfolio
          </p>
          <h1 className="font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {totalBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs text-muted-foreground">
            <span>{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}</span>
            {accounts.length > 0 && <span className="h-3 w-px bg-border" />}
            {accounts.length > 0 && (
              <span className={cn('font-medium', isOnline ? 'text-primary' : 'text-rose-500')}>
                {isOnline ? '● Online' : '○ Offline'}
              </span>
            )}
            {pendingSyncCount > 0 && (
              <>
                <span className="h-3 w-px bg-border" />
                <span className="text-amber-400">{pendingSyncCount} pending sync</span>
              </>
            )}
          </div>
        </section>

        {/* Desktop 2-col / Mobile single col */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-8">

          {/* Left: Accounts + Recent */}
          <div className="space-y-6">
            <div
              className="animate-fade-slide-up opacity-0"
              style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}
            >
              <AccountList accounts={accounts} />
            </div>

            {/* Recent movements */}
            {recentMovements.length > 0 && (
              <div
                className="animate-fade-slide-up opacity-0"
                style={{ animationDelay: '160ms', animationFillMode: 'forwards' }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
                    Recent
                  </h2>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <ul className="divide-y divide-border">
                    {recentMovements.map((m, i) => (
                      <li key={`${m.accountName}-${m.id}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">{m.accountName}</p>
                          <p className="truncate font-mono text-xs text-muted-foreground">{m.description}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {m.amount >= 0
                            ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                            : <TrendingDown className="h-3 w-3 text-rose-500" />
                          }
                          <span className={cn(
                            'font-mono text-sm font-semibold tabular',
                            m.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                          )}>
                            {m.amount >= 0 ? '+' : ''}
                            {m.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Manage accounts (collapsible) */}
            <div
              className="animate-fade-slide-up opacity-0"
              style={{ animationDelay: '220ms', animationFillMode: 'forwards' }}
            >
              <Collapsible>
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-muted/30 active:bg-muted/50">
                    <span className="font-display text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
                      Manage Accounts
                    </span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="border-t border-border p-4">
                      <AccountForm onAddAccount={addAccount} />
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </div>
          </div>

          {/* Right sidebar: transaction form (desktop only) */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <TransactionForm accounts={accounts} onAddTransaction={addTransaction} />
            </div>
          </aside>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:hidden">
        <button
          type="button"
          onClick={() => setTxSheetOpen(true)}
          className="flex h-14 items-center gap-2.5 rounded-full bg-primary px-7 font-display text-sm font-bold text-primary-foreground shadow-2xl shadow-primary/30 transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" strokeWidth={3} />
          New Transaction
        </button>
      </div>

      {/* Mobile transaction sheet */}
      <Sheet open={txSheetOpen} onOpenChange={setTxSheetOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t border-border bg-card p-0 pb-safe"
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="h-1 w-10 rounded-full bg-border" />
          </div>
          <div className="px-4 pb-8 pt-2">
            <h2 className="mb-4 font-display text-xl font-bold text-foreground">New Transaction</h2>
            <TransactionForm accounts={accounts} onAddTransaction={handleAddTransaction} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
