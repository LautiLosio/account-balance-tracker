'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Info } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Account, Transaction } from '@/types/schema'
import { UserProfile } from '@auth0/nextjs-auth0/client'
import { toast } from 'sonner'

interface TransactionHistoryProps {
  user: UserProfile | undefined
  account: Account
  onDeleteAccount: (accountId: number) => void
  onRefresh: () => Promise<void>
  onUpdateTransaction: (
    accountId: number,
    transactionId: number,
    updates: Pick<Transaction, 'description' | 'amount' | 'date'> & { exchangeRate?: number }
  ) => Promise<void>
  onSoftDeleteTransaction: (accountId: number, transactionId: number) => Promise<void>
}

export function TransactionHistory({
  user,
  account,
  onDeleteAccount,
  onRefresh,
  onUpdateTransaction,
  onSoftDeleteTransaction
}: TransactionHistoryProps) {
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDescription, setEditDescription] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editDate, setEditDate] = useState('')

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      onDeleteAccount(account.id)
    }
  }

  const activeTransactions = useMemo(
    () => account.transactions.filter(transaction => !transaction.isDeleted),
    [account.transactions]
  )

  const sortedTransactions = useMemo(
    () => [...activeTransactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [activeTransactions]
  )

  const filteredTransactions = useMemo(() => {
    return sortedTransactions.filter(transaction => {
      const transactionDate = new Date(transaction.date)
      const typeMatch = typeFilter === 'all' || transaction.type === typeFilter
      const startMatch = !startDate || transactionDate >= new Date(startDate)
      const endMatch = !endDate || transactionDate <= new Date(`${endDate}T23:59:59`)
      return typeMatch && startMatch && endMatch
    })
  }, [sortedTransactions, typeFilter, startDate, endDate])

  const runningRows = useMemo(() => {
    let runningBalance = account.initialBalance
    return sortedTransactions.map(transaction => {
      runningBalance += transaction.amount
      return {
        ...transaction,
        runningBalance,
        visible: filteredTransactions.some(filtered => filtered.id === transaction.id)
      }
    }).filter(row => row.visible)
  }, [account.initialBalance, sortedTransactions, filteredTransactions])

  const startEditing = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setEditDescription(transaction.description)
    setEditAmount(Math.abs(transaction.amount).toString())
    setEditDate(new Date(transaction.date).toISOString().split('T')[0])
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditDescription('')
    setEditAmount('')
    setEditDate('')
  }

  const saveEdit = async (transaction: Transaction) => {
    try {
      await onUpdateTransaction(account.id, transaction.id, {
        description: editDescription,
        amount: Number(editAmount),
        date: new Date(editDate || transaction.date),
        exchangeRate: transaction.exchangeRate
      })
      cancelEditing()
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update transaction')
    }
  }

  const deleteTransaction = async (transactionId: number) => {
    try {
      await onSoftDeleteTransaction(account.id, transactionId)
      await onRefresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete transaction')
    }
  }

  return (
    <>
      <Card className='mb-4'>
        <Collapsible className='flex flex-col'>
          <CollapsibleTrigger className="flex flex-1">
            <CardHeader className='flex-1'>
              <CardTitle className='flex flex-1 justify-between items-center gap-2'>
                Account Details
                <Info className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent>
              <ul className="grid grid-cols-2 flex-wrap gap-4">
                <li><span className="font-semibold">ID:</span> {account.id}</li>
                <li><span className="font-semibold">Name:</span> {account.name}</li>
                <li><span className="font-semibold">Initial Balance:</span> {account.initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</li>
                <li><span className="font-semibold">Currency:</span> {account.isForeignCurrency ? 'Foreign' : 'Local'}</li>
                <li><span className="font-semibold">Current Balance:</span> {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</li>
                <li><span className="font-semibold">Number of Transactions:</span> {activeTransactions.length}</li>
              </ul>
              {user && (
                <Button
                  variant="destructive"
                  className="mt-4"
                  onClick={handleDeleteAccount}
                >
                  Delete Account
                </Button>
              )}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-2'>
            <Input type='date' value={startDate} onChange={event => setStartDate(event.target.value)} />
            <Input type='date' value={endDate} onChange={event => setEndDate(event.target.value)} />
            <Select value={typeFilter} onValueChange={(value) => setTypeFilter(value as 'all' | 'income' | 'expense' | 'transfer')}>
              <SelectTrigger>
                <SelectValue placeholder='Filter by type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All</SelectItem>
                <SelectItem value='income'>Income</SelectItem>
                <SelectItem value='expense'>Expense</SelectItem>
                <SelectItem value='transfer'>Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        {runningRows.length === 0 && (
          <CardContent className='text-muted-foreground'>No transactions match the selected filters.</CardContent>
        )}
        {runningRows.length > 0 && (
          <CardContent>
            <div className='space-y-2'>
              {runningRows.map(transaction => (
                <div key={transaction.id} className='p-2 gap-2 border-b last:border-b-0'>
                  {editingId === transaction.id ? (
                    <div className='space-y-2'>
                      <Input value={editDescription} onChange={event => setEditDescription(event.target.value)} />
                      <div className='grid grid-cols-2 gap-2'>
                        <Input type='number' min={0} value={editAmount} onChange={event => setEditAmount(event.target.value)} />
                        <Input type='date' value={editDate} onChange={event => setEditDate(event.target.value)} />
                      </div>
                      <div className='flex gap-2'>
                        <Button size='sm' onClick={() => saveEdit(transaction)}>Save</Button>
                        <Button size='sm' variant='secondary' onClick={cancelEditing}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className='flex justify-between items-start gap-2'>
                      <div>
                        <div className='font-semibold capitalize'>{transaction.description}</div>
                        <div className='text-sm text-gray-500'>
                          {new Date(transaction.date).toLocaleString('es-AR')} · {transaction.type}
                        </div>
                        <div className='text-sm text-gray-500'>
                          Running balance: {transaction.runningBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </div>
                      </div>
                      <div className='text-right'>
                        <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {transaction.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                        </div>
                        <div className='flex justify-end gap-2 mt-1'>
                          <Button size='sm' variant='secondary' onClick={() => startEditing(transaction)}>Edit</Button>
                          <Button size='sm' variant='destructive' onClick={() => deleteTransaction(transaction.id)}>Delete</Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </>
  )
}
