'use client'

import { useMemo, useState } from 'react'
import { ArrowRightLeft, CircleDollarSign, MinusCircle, PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Account } from '@/types/schema'

interface TransactionFormProps {
  accounts: Account[]
  onAddTransaction: (
    selectedAccount: number,
    amount: number,
    type: 'income' | 'expense' | 'transfer',
    transferTo?: number,
    exchangeRate?: number
  ) => void
}

export function TransactionForm({ accounts, onAddTransaction }: TransactionFormProps) {
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>('income')
  const [transferTo, setTransferTo] = useState<number | null>(null)
  const [exchangeRate, setExchangeRate] = useState('')

  const needsExchangeRate =
    transactionType === 'transfer' &&
    ((selectedAccount !== null && accounts.find(acc => acc.id === selectedAccount)?.isForeignCurrency) ||
      (transferTo !== null && accounts.find(acc => acc.id === transferTo)?.isForeignCurrency))

  const disabledSubmit = useMemo(() => {
    const parsedAmount = Number.parseFloat(transactionAmount)
    const parsedExchangeRate = Number.parseFloat(exchangeRate)

    if (selectedAccount === null) return true
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return true
    if (transactionType === 'transfer' && transferTo === null) return true
    if (needsExchangeRate && (!Number.isFinite(parsedExchangeRate) || parsedExchangeRate <= 0)) return true
    return false
  }, [selectedAccount, transactionAmount, transactionType, transferTo, needsExchangeRate, exchangeRate])

  const handleSubmit = () => {
    if (disabledSubmit || selectedAccount === null) {
      return
    }

    onAddTransaction(
      selectedAccount,
      Number.parseFloat(transactionAmount),
      transactionType,
      transferTo ?? undefined,
      exchangeRate ? Number.parseFloat(exchangeRate) : undefined
    )

    setTransactionAmount('')
    setExchangeRate('')
  }

  return (
    <Card className="rounded-3xl border border-black/10 bg-white/85 shadow-[0_35px_90px_-52px_rgba(0,0,0,0.6)] backdrop-blur-md dark:border-white/10 dark:bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Quick Entry</p>
            <h2 className="font-display text-4xl text-zinc-900 dark:text-zinc-100">Capture Movement</h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">This is your primary action. Add first, sync later.</p>
          </div>
          <CircleDollarSign className="h-7 w-7" />
        </CardTitle>
      </CardHeader>

      {accounts.length === 0 && (
        <CardContent className="font-mono text-xs uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">
          Create an account first.
        </CardContent>
      )}

      {accounts.length > 0 && (
        <CardContent>
          <div className="space-y-5">
            <ToggleGroup
              className="grid grid-cols-3 rounded-2xl border border-black/10 p-1 dark:border-white/10"
              type="single"
              variant="outline"
              value={transactionType}
              onValueChange={(value) => setTransactionType((value || 'income') as 'income' | 'expense' | 'transfer')}
            >
              <ToggleGroupItem className="rounded-xl" value="expense">
                <MinusCircle className="mr-1.5 h-4 w-4" /> Expense
              </ToggleGroupItem>
              <ToggleGroupItem className="rounded-xl" value="income">
                <PlusCircle className="mr-1.5 h-4 w-4" /> Income
              </ToggleGroupItem>
              <ToggleGroupItem className="rounded-xl" value="transfer" disabled={accounts.length < 2}>
                <ArrowRightLeft className="mr-1.5 h-4 w-4" /> Transfer
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="grid gap-3 md:grid-cols-[1fr_1fr]">
              <Select onValueChange={(value) => setSelectedAccount(Number.parseInt(value, 10))}>
                <SelectTrigger className="rounded-2xl border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/35">
                  <SelectValue placeholder="Source account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}: {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                placeholder="Amount"
                value={transactionAmount}
                min={0}
                onChange={(e) => setTransactionAmount(e.target.value)}
                className="rounded-2xl border-black/10 bg-white/70 text-lg dark:border-white/10 dark:bg-black/35"
              />
            </div>

            {transactionType === 'transfer' && (
              <Select onValueChange={(value) => setTransferTo(Number.parseInt(value, 10))}>
                <SelectTrigger className="rounded-2xl border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/35">
                  <SelectValue placeholder="Destination account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(account => account.id !== selectedAccount).map(account => (
                    <SelectItem key={account.id} value={account.id.toString()}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {needsExchangeRate && (
              <Input
                type="number"
                placeholder="Exchange rate"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="rounded-2xl border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/35"
              />
            )}

            <Button disabled={disabledSubmit} onClick={handleSubmit} className="w-full rounded-2xl bg-zinc-900 py-6 text-base text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
              Save movement
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
