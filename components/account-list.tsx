'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent, useCallback } from 'react';
import { ArrowRight } from 'lucide-react';
import { Account } from '@/types/schema';
import { cn } from '@/lib/utils';
import { formatAccountMoney } from '@/lib/currency';
import { getAccountAccentColor } from '@/lib/account-accent';
import {
  ACCOUNT_BALANCE_TRANSITION_CLASS,
  ACCOUNT_NAME_TRANSITION_CLASS,
  getAccountBalanceTransitionName,
  getAccountNameTransitionName,
  runWithViewTransition,
} from '@/lib/view-transitions';

interface AccountListProps {
  accounts: Account[];
}

export function AccountList({ accounts }: AccountListProps) {
  const router = useRouter();

  const handleAccountNavigate = useCallback((event: MouseEvent<HTMLAnchorElement>, href: string) => {
    // Respect browser default behavior for new tab/window interactions.
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    runWithViewTransition(() => {
      router.push(href);
    });
  }, [router]);

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
            const nameTransitionId = getAccountNameTransitionName(account.id);
            const balanceTransitionId = getAccountBalanceTransitionName(account.id);
            const accentColor = getAccountAccentColor(account.id);

            return (
              <li
                key={account.id}
                className="animate-fade-slide-up opacity-0"
                style={{ animationDelay: `${index * 60}ms`, animationFillMode: 'forwards' }}
              >
                <Link
                  href={`/accounts/${account.id}`}
                  onClick={(event) => handleAccountNavigate(event, `/accounts/${account.id}`)}
                  className="group flex items-stretch overflow-hidden rounded-xl border border-border bg-card transition-all duration-200 hover:border-primary/40 active:scale-[0.99] active:bg-muted/20"
                >
                  {/* Left accent bar */}
                  <span
                    className="w-1 shrink-0 transition-[filter] duration-200 group-hover:brightness-110"
                    style={{ backgroundColor: accentColor }}
                  />

                  <div className="flex flex-1 items-center justify-between gap-3 px-4 py-4 sm:px-5">
                    <div className="min-w-0 flex-1">
                      <div className="min-w-0">
                        <p
                          className="truncate whitespace-nowrap font-display text-lg font-bold leading-tight text-foreground"
                          style={{
                            viewTransitionName: nameTransitionId,
                            viewTransitionClass: ACCOUNT_NAME_TRANSITION_CLASS,
                          }}
                          title={account.name}
                        >
                          {account.name}
                        </p>
                        <span className={cn(
                          'mt-1 inline-flex rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wide',
                          account.isForeignCurrency
                            ? 'bg-lime-200/70 text-lime-900 dark:bg-primary/15 dark:text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {account.isForeignCurrency ? 'Foreign' : 'Local'}
                        </span>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <p className={cn(
                        'w-[min(42vw,12rem)] text-right font-mono font-bold leading-tight tabular text-[clamp(1rem,4.6vw,1.3rem)]',
                        account.currentBalance < 0 ? 'text-rose-500' : 'text-foreground'
                      )} style={{
                        viewTransitionName: balanceTransitionId,
                        viewTransitionClass: ACCOUNT_BALANCE_TRANSITION_CLASS,
                      }}>
                        {formatAccountMoney(account.currentBalance, account)}
                      </p>
                      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/40 transition-colors group-hover:text-primary" />
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
