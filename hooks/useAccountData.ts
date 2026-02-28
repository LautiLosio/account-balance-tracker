'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { toast } from 'sonner'
import { Account } from '@/types/schema'

export function useAccountData() {
  const { user, isLoading: isUserLoading } = useUser()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch accounts when user is authenticated
  useEffect(() => {
    if (user && !isUserLoading) {
      fetchAccounts()
    } else if (!isUserLoading) {
      setIsLoading(false)
    }
  }, [user, isUserLoading])

  // Fetch accounts from the API
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

  const deleteAccount = async (id: string) => {
    if (!user) {
      toast.error("You must be logged in to delete an account")
      return
    }

    try {
      setAccounts(prev => prev.filter(account => account.id !== id))

      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete account')
      }

      toast.success("Account deleted successfully")
      fetchAccounts()
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error("Failed to delete account. Please try again.")
      fetchAccounts()
    }
  }

  const addAccount = async (name: string, initialBalance: number, isForeignCurrency: boolean) => {
    if (!user) {
      toast.error('You must be logged in to add an account')
      return
    }

    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          account: { name, initialBalance, isForeignCurrency },
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save account')
      }

      const data = await response.json()
      if (data.account) {
        setAccounts(prev => [...prev, data.account])
      }

      toast.success('Account added successfully', {
        description: `Account "${name}" added successfully. 
          With ${initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} initial balance.`,
      })
    } catch (error) {
      console.error('Error adding account:', error)
      toast.error('Failed to add account')
      fetchAccounts()
    }
  }

  const addTransaction = async (
    selectedAccount: string,
    amount: number,
    type: 'income' | 'expense' | 'transfer',
    transferTo?: string,
    exchangeRate?: number
  ) => {
    if (!user) {
      toast.error('You must be logged in to add transactions')
      return
    }

    try {
      const transactionAmount = type === 'expense' ? -amount : amount
      const response = await fetch(`/api/accounts/${selectedAccount}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: {
            date: new Date(),
            description: type === 'transfer' ? 'Transfer' : type,
            amount: transactionAmount,
            type,
          },
          toAccountId: transferTo,
          exchangeRate,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save transaction')
      }

      await fetchAccounts()

      toast.success(`${type} added successfully`, {
        description: `Amount: ${transactionAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
      })
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
      fetchAccounts()
    }
  }

  return {
    accounts,
    setAccounts,
    isLoading,
    user,
    fetchAccounts,
    deleteAccount,
    addAccount,
    addTransaction
  }
}
