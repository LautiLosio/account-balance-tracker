'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Account, Transaction } from '@/types/schema'

type SyncOperation =
  | {
      id: string
      kind: 'create_account'
      account: Account
      createdAt: number
      attempts: number
    }
  | {
      id: string
      kind: 'delete_account'
      accountId: number
      createdAt: number
      attempts: number
    }
  | {
      id: string
      kind: 'add_transaction'
      accountId: number
      payload: {
        transaction: Transaction
        toAccountId?: number
        exchangeRate?: number
      }
      createdAt: number
      attempts: number
    }

type QueueDraft =
  | {
      kind: 'create_account'
      account: Account
    }
  | {
      kind: 'delete_account'
      accountId: number
    }
  | {
      kind: 'add_transaction'
      accountId: number
      payload: {
        transaction: Transaction
        toAccountId?: number
        exchangeRate?: number
      }
    }

const ACCOUNTS_CACHE_KEY = 'abt.accounts.cache.v1'
const SYNC_QUEUE_KEY = 'abt.sync.queue.v1'

const parseJSON = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

const writeStorage = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(key, JSON.stringify(value))
}

const generateOpId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
const generateAccountId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000)

const isNetworkIssue = (error: unknown) => {
  if (!(error instanceof Error)) return false
  return /fetch|network|failed/i.test(error.message)
}

const mergeAccountsById = (primary: Account[], secondary: Account[]) => {
  const map = new Map<number, Account>()

  for (const account of secondary) {
    map.set(account.id, account)
  }

  for (const account of primary) {
    map.set(account.id, account)
  }

  return [...map.values()].sort((a, b) => a.id - b.id)
}

export function useAccountData(initialAccounts: Account[]) {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [queue, setQueue] = useState<SyncOperation[]>([])
  const [isSyncing, setIsSyncing] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null)

  const queueRef = useRef<SyncOperation[]>([])
  const syncingRef = useRef(false)
  const accountsRef = useRef<Account[]>(initialAccounts)

  const persistAccounts = useCallback((nextAccounts: Account[]) => {
    writeStorage(ACCOUNTS_CACHE_KEY, nextAccounts)
  }, [])

  const applyAccounts = useCallback(
    (updater: (prev: Account[]) => Account[]) => {
      setAccounts(prev => {
        const next = updater(prev)
        persistAccounts(next)
        return next
      })
    },
    [persistAccounts]
  )

  const pushQueue = useCallback((op: QueueDraft) => {
    setQueue(prev => {
      const next: SyncOperation[] = [...prev, { ...op, id: generateOpId(), createdAt: Date.now(), attempts: 0 }]
      queueRef.current = next
      writeStorage(SYNC_QUEUE_KEY, next)
      return next
    })
  }, [])

  const setQueueAndPersist = useCallback((next: SyncOperation[]) => {
    queueRef.current = next
    setQueue(next)
    writeStorage(SYNC_QUEUE_KEY, next)
  }, [])

  const fetchAccounts = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      try {
        const response = await fetch('/api/accounts', { cache: 'no-store' })

        if (!response.ok) {
          throw new Error(`Failed to fetch accounts: ${response.status}`)
        }

        const data = (await response.json()) as { accounts?: Account[] }
        const fresh = data.accounts || []
        setAccounts(fresh)
        persistAccounts(fresh)
        setLastSyncAt(new Date().toISOString())
      } catch (error) {
        if (!silent) {
          console.error('Error fetching accounts:', error)
          toast.error('Offline mode: working from local cache')
        }
      }
    },
    [persistAccounts]
  )

  const runOperation = useCallback(async (operation: SyncOperation): Promise<'success' | 'retry' | 'drop'> => {
    try {
      if (operation.kind === 'create_account') {
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ account: operation.account }),
        })

        if (response.ok) return 'success'
        if (response.status === 409) return 'drop'
        if (response.status >= 500) return 'retry'
        return 'drop'
      }

      if (operation.kind === 'delete_account') {
        const response = await fetch(`/api/accounts/${operation.accountId}`, { method: 'DELETE' })

        if (response.ok) return 'success'
        if (response.status === 404) return 'drop'
        if (response.status >= 500) return 'retry'
        return 'drop'
      }

      const response = await fetch(`/api/accounts/${operation.accountId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(operation.payload),
      })

      if (response.ok) return 'success'
      if (response.status >= 500) return 'retry'
      return 'drop'
    } catch (error) {
      if (isNetworkIssue(error)) return 'retry'
      return 'drop'
    }
  }, [])

  const flushQueue = useCallback(async () => {
    if (typeof window === 'undefined') return
    if (!window.navigator.onLine) return
    if (syncingRef.current) return
    if (queueRef.current.length === 0) return

    syncingRef.current = true
    setIsSyncing(true)

    let pending = [...queueRef.current]
    let hadSuccess = false

    while (pending.length > 0) {
      const current = pending[0]
      const result = await runOperation(current)

      if (result === 'success' || result === 'drop') {
        pending = pending.slice(1)
        hadSuccess = true
        continue
      }

      pending[0] = {
        ...current,
        attempts: current.attempts + 1,
      }
      break
    }

    setQueueAndPersist(pending)

    if (hadSuccess) {
      await fetchAccounts({ silent: true })
    }

    setIsSyncing(false)
    syncingRef.current = false
  }, [fetchAccounts, runOperation, setQueueAndPersist])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const cachedAccounts = parseJSON<Account[]>(window.localStorage.getItem(ACCOUNTS_CACHE_KEY), [])
    const cachedQueue = parseJSON<SyncOperation[]>(window.localStorage.getItem(SYNC_QUEUE_KEY), [])

    if (cachedAccounts.length > 0) {
      const merged = mergeAccountsById(initialAccounts, cachedAccounts)
      setAccounts(merged)
    }

    if (cachedQueue.length > 0) {
      setQueueAndPersist(cachedQueue)
    }

    setIsOnline(window.navigator.onLine)
  }, [initialAccounts, setQueueAndPersist])

  useEffect(() => {
    accountsRef.current = accounts
  }, [accounts])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushQueue()
    }

    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [flushQueue])

  useEffect(() => {
    if (queue.length === 0) return
    flushQueue()
  }, [queue.length, flushQueue])

  const deleteAccount = async (id: number) => {
    applyAccounts(prev => prev.filter(account => account.id !== id))

    pushQueue({
      kind: 'delete_account',
      accountId: id,
    })

    toast.success('Account removed locally', {
      description: 'Will sync to server automatically.',
    })
  }

  const addAccount = async (name: string, initialBalance: number, isForeignCurrency: boolean) => {
    const newAccount: Account = {
      id: generateAccountId(),
      name,
      initialBalance,
      currentBalance: initialBalance,
      isForeignCurrency,
      transactions: [],
    }

    applyAccounts(prev => [...prev, newAccount])

    pushQueue({
      kind: 'create_account',
      account: newAccount,
    })

    toast.success('Account created instantly', {
      description: 'Saved offline-first and syncing in the background.',
    })
  }

  const addTransaction = async (
    selectedAccount: number,
    amount: number,
    type: 'income' | 'expense' | 'transfer',
    transferTo?: number,
    exchangeRate?: number
  ) => {
    const transactionAmount = type === 'expense' ? -Math.abs(amount) : Math.abs(amount)
    const currentAccounts = accountsRef.current
    const updatedAccounts = currentAccounts.map(account => ({
      ...account,
      transactions: [...account.transactions],
    }))

    const transactionId = Date.now()
    const baseTransaction: Transaction = {
      id: transactionId,
      date: new Date(),
      description: type === 'transfer' ? 'Transfer' : type,
      amount: transactionAmount,
      type,
      fromAccount: selectedAccount,
    }

    if (type === 'transfer' && transferTo !== undefined) {
      const fromAccount = updatedAccounts.find(acc => acc.id === selectedAccount)
      const toAccount = updatedAccounts.find(acc => acc.id === transferTo)

      if (!fromAccount || !toAccount) {
        toast.error('Transfer accounts not found')
        return
      }

      let transferAmount = Math.abs(transactionAmount)
      const rate = exchangeRate || 1

      if (fromAccount.isForeignCurrency || toAccount.isForeignCurrency) {
        transferAmount = fromAccount.isForeignCurrency
          ? Math.abs(transactionAmount) * rate
          : Math.abs(transactionAmount) * (1 / rate)
      }

      const outTransaction: Transaction = {
        ...baseTransaction,
        amount: -Math.abs(transactionAmount),
        fromAccount: selectedAccount,
        toAccount: transferTo,
        exchangeRate: fromAccount.isForeignCurrency || toAccount.isForeignCurrency ? rate : undefined,
        description: `Transfer to ${toAccount.name}`,
      }

      const inTransaction: Transaction = {
        ...baseTransaction,
        amount: transferAmount,
        fromAccount: selectedAccount,
        toAccount: transferTo,
        exchangeRate: fromAccount.isForeignCurrency || toAccount.isForeignCurrency ? rate : undefined,
        description: `Transfer from ${fromAccount.name}`,
      }

      fromAccount.currentBalance += outTransaction.amount
      toAccount.currentBalance += inTransaction.amount
      fromAccount.transactions.push(outTransaction)
      toAccount.transactions.push(inTransaction)

      setAccounts(updatedAccounts)
      persistAccounts(updatedAccounts)

      pushQueue({
        kind: 'add_transaction',
        accountId: selectedAccount,
        payload: {
          transaction: outTransaction,
          toAccountId: transferTo,
          exchangeRate: outTransaction.exchangeRate,
        },
      })

      toast.success('Transfer recorded', {
        description: 'Synced in background when online.',
      })

      return
    }

    const account = updatedAccounts.find(acc => acc.id === selectedAccount)

    if (!account) {
      toast.error('Account not found')
      return
    }

    const transaction: Transaction = {
      ...baseTransaction,
      amount: type === 'income' ? Math.abs(amount) : -Math.abs(amount),
    }

    account.currentBalance += transaction.amount
    account.transactions.push(transaction)

    setAccounts(updatedAccounts)
    persistAccounts(updatedAccounts)

    pushQueue({
      kind: 'add_transaction',
      accountId: selectedAccount,
      payload: {
        transaction,
      },
    })

    toast.success('Transaction recorded', {
      description: 'Synced in background when online.',
    })
  }

  return {
    accounts,
    setAccounts: (next: Account[]) => {
      setAccounts(next)
      persistAccounts(next)
    },
    fetchAccounts,
    deleteAccount,
    addAccount,
    addTransaction,
    syncNow: flushQueue,
    isSyncing,
    isOnline,
    pendingSyncCount: queue.length,
    lastSyncAt,
  }
}
