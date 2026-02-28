'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { Account } from '@/types/schema';
import { cn } from '@/lib/utils';

interface TransactionHistoryProps {
  account: Account;
  onDeleteAccount: (accountId: number) => void;
}

export function TransactionHistory({ account, onDeleteAccount }: TransactionHistoryProps) {
  const handleDeleteAccount = () => {
    if (window.confirm('Delete this account? This cannot be undone.')) {
      onDeleteAccount(account.id);
    }
  };

  const sortedTransactions = [...account.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <div className="space-y-4">
      {/* Account overview */}
      <section className="rounded-xl border bg-card">
        <div className="flex items-start justify-between gap-4 p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Account</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{account.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Badge variant={account.isForeignCurrency ? 'default' : 'secondary'} className="rounded-md">
                {account.isForeignCurrency ? 'Foreign Currency' : 'Local Currency'}
              </Badge>
              <span className="text-xs text-muted-foreground">#{account.id}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Current Balance</p>
            <p className={cn('mt-1 font-mono text-2xl font-bold tabular-nums', account.currentBalance >= 0 ? 'text-foreground' : 'text-rose-500')}>
              {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              Initial: <span className="font-mono font-medium text-foreground tabular-nums">
                {account.initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
              </span>
            </span>
            <span>{sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDeleteAccount}
            className="h-7 gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete account
          </Button>
        </div>
      </section>

      {/* Transactions */}
      <section className="rounded-xl border bg-card">
        <div className="border-b border-border px-5 py-4">
          <h3 className="font-semibold text-foreground">Transaction History</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{sortedTransactions.length} entries, newest first</p>
        </div>

        {sortedTransactions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-muted-foreground">No transactions recorded yet.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sortedTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium capitalize text-foreground">{tx.description}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {typeof tx.date === 'string'
                      ? new Date(tx.date).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
                      : tx.date.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })}
                    {tx.type === 'transfer' && (
                      <span className="ml-2 rounded border border-primary/25 bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        Transfer
                      </span>
                    )}
                  </p>
                </div>
                <span className={cn(
                  'shrink-0 font-mono text-sm font-semibold tabular-nums',
                  tx.amount >= 0 ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {tx.amount >= 0 ? '+' : ''}
                  {tx.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
