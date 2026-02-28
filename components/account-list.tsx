'use client';

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Account } from '@/types/schema';
import { cn } from '@/lib/utils';

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  return (
    <section className="rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-semibold text-foreground">Accounts</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{accounts.length} {accounts.length === 1 ? 'account' : 'accounts'} in portfolio</p>
        </div>
      </div>

      {accounts.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-muted-foreground">No accounts yet. Create one in Manage Accounts.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Account</th>
                <th className="px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Type</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Balance</th>
                <th className="hidden px-5 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground lg:table-cell">Last Transaction</th>
                <th className="px-5 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">History</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((account) => {
                const lastTx = [...account.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

                return (
                  <tr key={account.id} className="group transition-colors hover:bg-muted/20">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{account.name}</p>
                      <p className="text-xs text-muted-foreground">#{account.id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <Badge
                        variant={account.isForeignCurrency ? 'default' : 'secondary'}
                        className="rounded-md px-2 py-0.5 text-[11px] font-medium"
                      >
                        {account.isForeignCurrency ? 'Foreign' : 'Local'}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={cn(
                        'font-mono text-sm font-semibold tabular-nums',
                        account.currentBalance >= 0 ? 'text-foreground' : 'text-rose-500'
                      )}>
                        {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </span>
                    </td>
                    <td className="hidden px-5 py-4 lg:table-cell">
                      {lastTx ? (
                        <div>
                          <p className="max-w-[20ch] truncate text-sm text-foreground">{lastTx.description}</p>
                          <p className={cn('font-mono text-xs tabular-nums', lastTx.amount >= 0 ? 'text-emerald-500' : 'text-rose-500')}>
                            {lastTx.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/accounts/${account.id}`}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted hover:text-foreground group-hover:border-primary/40 group-hover:text-primary"
                      >
                        View
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
