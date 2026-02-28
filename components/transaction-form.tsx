'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
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

  const handleSubmit = () => {
    if (selectedAccount !== null && transactionAmount) {
      onAddTransaction(
        selectedAccount,
        parseFloat(transactionAmount),
        transactionType,
        transferTo || undefined,
        exchangeRate ? parseFloat(exchangeRate) : undefined
      )
      setTransactionAmount('')
      setExchangeRate('')
    }
  }

  const needsExchangeRate = transactionType === 'transfer' &&
    ((selectedAccount !== null && accounts.find(acc => acc.id === selectedAccount)?.isForeignCurrency) ||
      (transferTo !== null && accounts.find(acc => acc.id === transferTo)?.isForeignCurrency))

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>New Transaction</CardTitle>
      </CardHeader>
      {accounts.length === 0 && (<CardContent className='text-muted-foreground'>Add a new account to get started.</CardContent>)}
      {accounts.length > 0 && (
        <CardContent>
          <div className="flex flex-col gap-4">
            <Select onValueChange={(value) => setSelectedAccount(parseInt(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Select Account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map(account => (
                  <SelectItem key={account.id} value={account.id.toString()}>
                    {account.name}: {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <ToggleGroup
              className="flex-1"
              type="single"
              variant="outline"
              value={transactionType}
              onValueChange={(value) => setTransactionType(value as 'income' | 'expense' | 'transfer')}
              colorConfigs={{
                expense: {
                  selected: 'bg-red-400 text-white border-red-400 hover:bg-red-500',
                  unselected: 'bg-transparent text-red-600 border-red-300 hover:bg-red-50'
                },
                income: {
                  selected: 'bg-green-400 text-white border-green-400 hover:bg-green-500',
                  unselected: 'bg-transparent text-green-600 border-green-300 hover:bg-green-50'
                },
                transfer: {
                  selected: 'bg-blue-400 text-white border-blue-400 hover:bg-blue-500',
                  unselected: 'bg-transparent text-blue-600 border-blue-300 hover:bg-blue-50'
                }
              }}
            >
              <ToggleGroupItem className="flex-1" value="expense">
                Expense
              </ToggleGroupItem>
              <ToggleGroupItem className="flex-1" value="income">
                Income
              </ToggleGroupItem>
              {accounts.length > 1 && (
                <ToggleGroupItem className="flex-1" value="transfer">
                  Transfer
                </ToggleGroupItem>
              )}
            </ToggleGroup>

            {transactionType === 'transfer' && (
              <Select onValueChange={(value) => setTransferTo(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Transfer To" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.filter(account => account.id !== selectedAccount).map(account => (
                    <SelectItem key={account.id} value={account.id.toString()}>{account.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Input
              type="number"
              placeholder="Amount"
              value={transactionAmount}
              disabled={!selectedAccount}
              min={0}
              max={selectedAccount ? accounts.find(acc => acc.id === selectedAccount)?.currentBalance : 0}
              onChange={(e) => setTransactionAmount(e.target.value)}
            />

            {needsExchangeRate && (
              <Input
                type="number"
                placeholder="Exchange Rate"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
              />
            )}

            <Button disabled={!selectedAccount || !transactionAmount} onClick={handleSubmit}>
              Submit Transaction
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
