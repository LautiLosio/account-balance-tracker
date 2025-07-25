'use client'

import { useState, useEffect } from 'react'
import { useUser } from '@auth0/nextjs-auth0/client'
import { toast } from 'sonner'
import { Account, Transaction } from '@/types/schema'

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

  const deleteAccount = async (id: number) => {
    if (!user) {
      toast.error("You must be logged in to delete an account")
      return
    }
    
    try {
      // Update UI first for immediate feedback
      setAccounts(accounts.filter(account => account.id !== id))
      
      // Then update the database
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete account')
      }
      
      toast.success("Account deleted successfully")
      fetchAccounts() // Refresh accounts from the database
    } catch (error) {
      console.error('Error deleting account:', error)
      toast.error("Failed to delete account. Please try again.")
      fetchAccounts() // Refresh to ensure UI is in sync with database
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
      
      // Add account to local state first for immediate UI update
      setAccounts([...accounts, newAccount])
      
      // Save to the API
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
        description: `Account "${name}" added successfully. 
          With ${initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} initial balance.`,
      })
    } catch (error) {
      console.error('Error adding account:', error)
      toast.error('Failed to add account')
      // Refresh accounts to ensure UI is in sync with server
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
      const transactionAmount = type === 'expense' ? -amount : amount
      const updatedAccounts = [...accounts]
      const transactionId = Math.max(0, ...updatedAccounts.flatMap(acc => acc.transactions.map(t => t.id))) + 1
      const newTransaction: Transaction = {
        id: transactionId,
        date: new Date(),
        description: type === 'transfer' ? `Transfer` : type,
        amount: transactionAmount,
        type,
        fromAccount: selectedAccount,
      }

      // Handle UI updates first for immediate feedback
      if (type === 'transfer' && transferTo !== undefined) {
        const fromAccount = updatedAccounts.find(acc => acc.id === selectedAccount)
        const toAccount = updatedAccounts.find(acc => acc.id === transferTo)

        if (fromAccount && toAccount) {
          let transferAmount = transactionAmount
          const rate = exchangeRate || 1
          
          if (fromAccount.isForeignCurrency || toAccount.isForeignCurrency) {
            transferAmount = fromAccount.isForeignCurrency ? transactionAmount * rate : transactionAmount * (1 / rate)
            newTransaction.exchangeRate = rate
          }

          fromAccount.currentBalance -= transactionAmount
          toAccount.currentBalance += transferAmount
          newTransaction.fromAccount = selectedAccount
          newTransaction.toAccount = transferTo
          newTransaction.description = `Transfer from ${fromAccount.name} to ${toAccount.name}`
          fromAccount.transactions.push({ ...newTransaction, amount: -transactionAmount })
          toAccount.transactions.push({ ...newTransaction, amount: transferAmount })
          
          // Update UI
          setAccounts(updatedAccounts)
          
          // Save to API
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
            throw new Error('Failed to save transaction')
          }
        }
      } else {
        const account = updatedAccounts.find(acc => acc.id === selectedAccount)
        if (account) {
          account.currentBalance += transactionAmount
          account.transactions.push(newTransaction)
          
          // Update UI
          setAccounts(updatedAccounts)
          
          // Save to API
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
            throw new Error('Failed to save transaction')
          }
        }
      }

      toast.success(`${newTransaction.description} added successfully`, {
        description: `Amount: ${transactionAmount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
      })
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
      // Refresh accounts to ensure UI is in sync with server
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