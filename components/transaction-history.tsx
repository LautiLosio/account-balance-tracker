'use client';

import { Trash2 } from 'lucide-react';
import { Account } from '@/types/schema';
import { cn } from '@/lib/utils';
import { formatAccountMoney } from '@/lib/currency';
import { getAccountAccentColor } from '@/lib/account-accent';
import {
  ACCOUNT_BALANCE_TRANSITION_CLASS,
  ACCOUNT_NAME_TRANSITION_CLASS,
  getAccountBalanceTransitionName,
  getAccountNameTransitionName,
} from '@/lib/view-transitions';

interface TransactionHistoryProps {
  account: Account;
  onDeleteAccount: (accountId: number) => void;
}

export function TransactionHistory({ account, onDeleteAccount }: TransactionHistoryProps) {
  const nameTransitionId = getAccountNameTransitionName(account.id);
  const balanceTransitionId = getAccountBalanceTransitionName(account.id);
  const accentColor = getAccountAccentColor(account.id);

  const handleDelete = () => {
    if (window.confirm('Delete this account? This cannot be undone.')) {
      onDeleteAccount(account.id);
    }
  };

  const sorted = [...account.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Change from initial balance: positive = gain, negative = loss
  const delta = account.currentBalance - account.initialBalance;

  return (
    <div className="space-y-4">
      {/* Account hero card */}
      <div className="animate-scale-in overflow-hidden rounded-xl border border-border bg-card opacity-0" style={{ animationFillMode: 'forwards' }}>
        {/* Top accent stripe in primary color */}
        <div className="h-1 w-full" style={{ backgroundColor: accentColor }} />
        <div className="px-5 pb-5 pt-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className={cn(
                'inline-block rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider',
                account.isForeignCurrency ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
              )}>
                {account.isForeignCurrency ? 'Foreign' : 'Local'} · #{account.id}
              </span>
              <h2
                className="mt-1.5 font-display text-3xl font-bold leading-tight text-foreground sm:text-4xl"
                style={{
                  viewTransitionName: nameTransitionId,
                  viewTransitionClass: ACCOUNT_NAME_TRANSITION_CLASS,
                }}
              >
                {account.name}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleDelete}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-rose-500/10 hover:text-rose-500 active:bg-rose-500/20"
              title="Delete account"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {/* Balance */}
          <div className="mt-4">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Current Balance</p>
            <p className={cn(
              'font-display text-4xl font-bold tabular sm:text-5xl',
              account.currentBalance < 0 ? 'text-rose-500' : 'text-foreground'
            )} style={{
              viewTransitionName: balanceTransitionId,
              viewTransitionClass: ACCOUNT_BALANCE_TRANSITION_CLASS,
            }}>
              {formatAccountMoney(account.currentBalance, account)}
            </p>
          </div>

          {/* Stats row */}
          <div className="mt-4 flex flex-wrap gap-4 border-t border-border pt-4 font-mono text-xs">
            <div>
              <p className="text-muted-foreground">Initial</p>
              <p className="font-semibold text-foreground tabular">
                {formatAccountMoney(account.initialBalance, account)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Net Change</p>
              <p className={cn('font-semibold tabular', delta >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                {delta >= 0 ? '+' : ''}{formatAccountMoney(delta, account)}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Transactions</p>
              <p className="font-semibold text-foreground">{sorted.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions list */}
      <div className="animate-fade-slide-up opacity-0" style={{ animationDelay: '80ms', animationFillMode: 'forwards' }}>
        <div className="mb-3">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
            History
          </h3>
        </div>

        {sorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border">
              {sorted.map((tx, index) => {
                const date = typeof tx.date === 'string' ? new Date(tx.date) : tx.date;
                return (
                  <li
                    key={tx.id}
                    className="animate-fade-slide-up flex items-center gap-4 px-4 py-4 opacity-0 sm:px-5"
                    style={{ animationDelay: `${100 + index * 40}ms`, animationFillMode: 'forwards' }}
                  >
                    {/* Amount indicator dot */}
                    <span className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      tx.amount >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                    )} />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold capitalize leading-tight text-foreground">{tx.description}</p>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                        {date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    <span className={cn(
                      'shrink-0 font-mono text-base font-bold tabular',
                      tx.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                    )}>
                      {tx.amount >= 0 ? '+' : ''}
                      {formatAccountMoney(tx.amount, account)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
