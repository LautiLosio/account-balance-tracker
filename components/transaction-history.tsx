'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info, Trash2 } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Account } from '@/types/schema'

interface TransactionHistoryProps {
  account: Account
  onDeleteAccount: (accountId: number) => void
}

export function TransactionHistory({ account, onDeleteAccount }: TransactionHistoryProps) {
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      onDeleteAccount(account.id)
    }
  }

  const sortedTransactions = [...account.transactions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  return (
    <div className="space-y-5">
      <Card className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/35">
        <Collapsible className="flex flex-col">
          <CollapsibleTrigger className="flex flex-1">
            <CardHeader className="flex-1">
              <CardTitle className="flex flex-1 items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Overview</p>
                  <p className="font-display text-3xl text-zinc-900 dark:text-zinc-100">{account.name}</p>
                </div>
                <Info className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4">
              <ul className="grid gap-2 text-sm sm:grid-cols-2">
                <li><span className="font-mono text-[11px] uppercase tracking-[0.2em]">ID</span><p>{account.id}</p></li>
                <li><span className="font-mono text-[11px] uppercase tracking-[0.2em]">Currency</span><p>{account.isForeignCurrency ? 'Foreign' : 'Local'}</p></li>
                <li><span className="font-mono text-[11px] uppercase tracking-[0.2em]">Initial</span><p>{account.initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p></li>
                <li><span className="font-mono text-[11px] uppercase tracking-[0.2em]">Current</span><p>{account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p></li>
              </ul>
              <Button
                variant="destructive"
                className="rounded-full"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete account
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card className="rounded-3xl border border-black/10 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/35">
        <CardHeader>
          <CardTitle className="font-display text-3xl">Transactions</CardTitle>
        </CardHeader>

        {sortedTransactions.length === 0 && (
          <CardContent className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
            No transactions yet.
          </CardContent>
        )}

        {sortedTransactions.length > 0 && (
          <CardContent>
            <div className="space-y-3">
              {sortedTransactions.map(transaction => (
                <article
                  key={transaction.id}
                  className="grid gap-2 rounded-2xl border border-black/10 bg-white/75 p-3 dark:border-white/10 dark:bg-black/30 sm:grid-cols-[1fr_auto] sm:items-center"
                >
                  <div>
                    <p className="font-semibold capitalize">{transaction.description}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {typeof transaction.date === 'string'
                        ? new Date(transaction.date).toLocaleString('es-AR')
                        : transaction.date.toLocaleString('es-AR')}
                    </p>
                  </div>
                  <p className={`font-display text-xl ${transaction.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {transaction.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </p>
                </article>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  )
}
