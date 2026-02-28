'use client'

import Link from 'next/link'
import { ArrowUpRight, History, WalletCards } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Account } from '@/types/schema'

interface AccountListProps {
  accounts: Account[]
}

export function AccountList({ accounts }: AccountListProps) {
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0)

  return (
    <Card className="overflow-hidden rounded-3xl border border-black/10 bg-white/80 backdrop-blur-md dark:border-white/10 dark:bg-black/35">
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500 dark:text-zinc-400">Accounts Ledger</p>
            <h2 className="font-display text-4xl text-zinc-900 dark:text-zinc-100">Portfolio</h2>
          </CardTitle>
          <WalletCards className="h-8 w-8 text-zinc-500 dark:text-zinc-300" />
        </div>
        <p className="font-display text-3xl text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {totalBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
        </p>
      </CardHeader>

      {accounts.length === 0 && (
        <CardContent className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Add your first account from Management when you need it.
        </CardContent>
      )}

      {accounts.length > 0 && (
        <CardContent className="pt-0">
          <div className="overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
            <table className="w-full border-collapse">
              <thead className="bg-zinc-100/80 dark:bg-zinc-900/70">
                <tr className="text-left">
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Account</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Type</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Balance</th>
                  <th className="hidden px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 lg:table-cell">Latest Move</th>
                  <th className="px-4 py-3 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const recentTransaction = [...account.transactions]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]

                  return (
                    <tr key={account.id} className="border-t border-black/10 bg-white/55 dark:border-white/10 dark:bg-black/20">
                      <td className="px-4 py-3">
                        <p className="font-display text-2xl leading-none text-zinc-900 dark:text-zinc-100">{account.name}</p>
                        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">ID {account.id}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={account.isForeignCurrency ? 'default' : 'secondary'} className="rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider">
                          {account.isForeignCurrency ? 'Foreign' : 'Local'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-display text-2xl text-zinc-900 dark:text-zinc-100">
                          {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </p>
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        <p className="max-w-[26ch] truncate text-xs text-zinc-700 dark:text-zinc-200">
                          {recentTransaction
                            ? `${recentTransaction.description} · ${recentTransaction.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`
                            : 'No movements yet'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <Button
                          variant="ghost"
                          className="rounded-full border border-black/10 bg-white/80 px-3 dark:border-white/15 dark:bg-black/35"
                          size="sm"
                          asChild
                        >
                          <Link href={`/accounts/${account.id}`}>
                            <History className="mr-1.5 h-4 w-4" />
                            Open
                            <ArrowUpRight className="ml-1.5 h-4 w-4" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
