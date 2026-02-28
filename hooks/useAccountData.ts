'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { toast } from 'sonner'
import { Account, Transaction } from '@/types/schema'

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const data = await response.json()
    return data.error || fallback
  } catch {
    return fallback
  }
}

export function useAccountData() {
  const { user, isLoading: isUserLoading } = useUser()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user && !isUserLoading) {
      fetchAccounts()
    } else if (!isUserLoading) {
      setIsLoading(false)
    }
  }, [user, isUserLoading])

  const fetchAccounts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/accounts')

      if (!response.ok) {
        throw new Error('Failed to fetch accounts')
      }

      const data = await response.json()
      setAccounts(data.accounts || [])
    } catch (error) {
      console.error('Error fetching accounts:', error)
      toast.error('Failed to load accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAccount = async (id: number) => {
    if (!user) {
      toast.error('You must be logged in to delete an account')
      return
    }

    try {
      setAccounts(accounts.filter(account => account.id !== id))

      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      toast.success('Account deleted successfully')
      fetchAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error('Failed to delete account. Please try again.')
      fetchAccounts()
    }
  }

  const addAccount = async (name: string, initialBalance: number, isForeignCurrency: boolean) => {
    if (!user) {
      toast.error('You must be logged in to add an account')
      return
    }

    try {
      const accountId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1

      const newAccount: Account = {
        id: accountId,
        name,
        initialBalance,
        currentBalance: initialBalance,
        isForeignCurrency,
        transactions: []
      }

      setAccounts([...accounts, newAccount])

      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accounts: [...accounts, newAccount] }),
      })

      if (!response.ok) {
        throw new Error('Failed to save account')
      }

      toast.success('Account added successfully', {
        description: `Account "${name}" added successfully. With ${initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} initial balance.`,
      })
    } catch (error) {
      console.error('Error adding account:', error)
      toast.error('Failed to add account')
      fetchAccounts()
    }
  }

  const addTransaction = async (
    selectedAccount: number,
    amount: number,
    type: 'income' | 'expense' | 'transfer',
    transferTo?: number,
    exchangeRate?: number
  ) => {
    if (!user) {
      toast.error('You must be logged in to add transactions')
      return
    }

    try {
      const updatedAccounts = [...accounts]
      const transactionId = Math.max(0, ...updatedAccounts.flatMap(acc => acc.transactions.map(t => t.id))) + 1
      const positiveAmount = Math.abs(amount)
      const newTransaction: Transaction = {
        id: transactionId,
        date: new Date(),
        description: type === 'transfer' ? 'Transfer' : type,
        amount: type === 'expense' ? -positiveAmount : positiveAmount,
        type,
        fromAccount: selectedAccount,
      }

      if (type === 'transfer' && transferTo !== undefined) {
        const fromAccount = updatedAccounts.find(acc => acc.id === selectedAccount)
        const toAccount = updatedAccounts.find(acc => acc.id === transferTo)

        if (fromAccount && toAccount) {
          if (fromAccount.currentBalance < positiveAmount) {
            toast.error('Insufficient funds for this transfer.')
            return
          }

          let transferAmount = positiveAmount
          const rate = exchangeRate || 1

          if (fromAccount.isForeignCurrency || toAccount.isForeignCurrency) {
            transferAmount = fromAccount.isForeignCurrency ? positiveAmount * rate : positiveAmount * (1 / rate)
            newTransaction.exchangeRate = rate
          }

          fromAccount.currentBalance -= positiveAmount
          toAccount.currentBalance += transferAmount
          newTransaction.toAccount = transferTo
          newTransaction.description = `Transfer from ${fromAccount.name} to ${toAccount.name}`
          fromAccount.transactions.push({ ...newTransaction, amount: -positiveAmount, isDeleted: false })
          toAccount.transactions.push({ ...newTransaction, amount: transferAmount, isDeleted: false })

          setAccounts(updatedAccounts)

          const response = await fetch(`/api/accounts/${selectedAccount}/transactions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction: newTransaction,
              toAccountId: transferTo,
              exchangeRate: rate
            }),
          })

          if (!response.ok) {
            throw new Error(await getErrorMessage(response, 'Failed to save transaction'))
          }
        }
      } else {
        const account = updatedAccounts.find(acc => acc.id === selectedAccount)
        if (account) {
          if (type === 'expense' && account.currentBalance < positiveAmount) {
            toast.error('Insufficient funds for this expense.')
            return
          }

          account.currentBalance += newTransaction.amount
          account.transactions.push({ ...newTransaction, isDeleted: false })

          setAccounts(updatedAccounts)

          const response = await fetch(`/api/accounts/${selectedAccount}/transactions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              transaction: newTransaction
            }),
          })

          if (!response.ok) {
            throw new Error(await getErrorMessage(response, 'Failed to save transaction'))
          }
        }
      }

      toast.success(`${newTransaction.description} added successfully`, {
        description: `Amount: ${newTransaction.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
      })
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add transaction')
      fetchAccounts()
    }
  }

  const updateTransaction = async (
    accountId: number,
    transactionId: number,
    updates: Pick<Transaction, 'description' | 'amount' | 'date'> & { exchangeRate?: number }
  ) => {
    const response = await fetch(`/api/accounts/${accountId}/transactions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, updates })
    })

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Failed to update transaction'))
    }

    await fetchAccounts()
    toast.success('Transaction updated')
  }

  const softDeleteTransaction = async (accountId: number, transactionId: number) => {
    const response = await fetch(`/api/accounts/${accountId}/transactions`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId })
    })

    if (!response.ok) {
      throw new Error(await getErrorMessage(response, 'Failed to delete transaction'))
    }

    await fetchAccounts()
    toast.success('Transaction deleted')
  }

  return {
    accounts,
    setAccounts,
    isLoading,
    user,
    fetchAccounts,
    deleteAccount,
    addAccount,
    addTransaction,
    updateTransaction,
    softDeleteTransaction
  }
}
