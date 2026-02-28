'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Account } from '@/types/schema';
import { cn } from '@/lib/utils';

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-sm font-bold uppercase tracking-[0.15em] text-muted-foreground">
          Accounts
        </h2>
        {accounts.length > 0 && (
          <span className="font-mono text-xs text-muted-foreground">{accounts.length} total</span>
        )}
      </div>

      {accounts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">No accounts yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">Open Manage Accounts below to create one.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {accounts.map((account, index) => {
            const lastTx = [...account.transactions]
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

            return (
              <li
                key={account.id}
                className="animate-fade-slide-up opacity-0"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
              >
                <Link
                  href={`/accounts/${account.id}`}
                  className="group flex items-stretch overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 active:scale-[0.99] active:bg-muted/20"
                >
                  {/* Left accent bar */}
                  <span className="w-1 shrink-0 bg-border transition-colors duration-200 group-hover:bg-primary" />

                  <div className="flex flex-1 items-center justify-between gap-4 px-4 py-4 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-display text-lg font-bold leading-tight text-foreground">
                          {account.name}
                        </p>
                        <span className={cn(
                          'shrink-0 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide',
                          account.isForeignCurrency
                            ? 'bg-primary/15 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {account.isForeignCurrency ? 'Foreign' : 'Local'}
                        </span>
                      </div>
                      {lastTx ? (
                        <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                          {lastTx.description}
                          <span className={cn('ml-1.5', lastTx.amount >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {lastTx.amount >= 0 ? '+' : ''}
                            {lastTx.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                          </span>
                        </p>
                      ) : (
                        <p className="mt-1 font-mono text-xs text-muted-foreground/50">No transactions yet</p>
                      )}
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <p className={cn(
                        'font-mono text-xl font-bold tabular sm:text-2xl',
                        account.currentBalance < 0 ? 'text-rose-500' : 'text-foreground'
                      )}>
                        {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </p>
                      <ArrowRight className="h-4 w-4 text-muted-foreground/40 transition-colors group-hover:text-primary" />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
