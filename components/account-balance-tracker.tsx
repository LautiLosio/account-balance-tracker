'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import { ArrowLeftCircle, FileDown, FileInput, Plus, Info, History, User, Loader, LogOut, Verified } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { useUser } from '@auth0/nextjs-auth0/client'
import Image from 'next/image'
import { Account, Transaction } from '@/types/schema'

// Using imported types from schema.ts

export function UserIcon() {
  const { user, error, isLoading } = useUser()
  if (error) {
    console.error(error)
    return <User className="h-4 w-4" />
  }
  return (
    <>
      {/* user profile */}
      { isLoading ? (
        <Loader className="h-4 w-4 animate-spin" />
      ) : (
        user && user.picture && user.name ? <Image src={user.picture} className="h-4 w-4 rounded-full" alt={user.name} width={24} height={24} /> : <User className="h-4 w-4" />
      )}
    </>
  )
}
  
export function AccountSheet() {
  const { user, error, isLoading } = useUser()
  if (error) {
    console.error(error)
    return <div className="text-red-500">An error occurred. Please try again later.</div>
  }
  return (
    <>
      { isLoading && (
        <div className='flex items-center justify-center h-full w-full'>
          <Loader className="h-8 w-8 animate-spin" /> 
        </div>
      )}
      { !user && !isLoading && (
        <SheetHeader>
          <SheetTitle>Sign-in</SheetTitle>
          <SheetDescription className='flex flex-col gap-4'>
            <p>Sign-in to access your account details.</p>

            <p>Don&apos;t have an account? Use the button below to sign-up.</p>

            {/* vercel auth0 integration */}
            <div className="flex justify-around gap-4">
              <a href="/api/auth/login" className="flex grow">
                <Button variant="outline" className='grow'>
                  <User className="h-4 w-4" />
                  Sign-in
                </Button>
              </a>
            </div>
          </SheetDescription>
        </SheetHeader>
      )}
      { user && user.email_verified && user.name && user.picture && (
        <>
          <SheetHeader>
            <SheetTitle>Account Details</SheetTitle>
          </SheetHeader>
          <Card>
            <CardContent>
              <CardHeader className='px-0'>
                <div className="flex items-center gap-4">
                  <Image src={user.picture} className="h-12 w-12 rounded-full" alt={user.name} width={48} height={48} />
                  <h2 className="text-2xl font-bold">{user.nickname}</h2>
                </div>
              </CardHeader>
              <span className="font-semibold">Email:</span><div className='flex items-center'>{user.email}&nbsp;{user.email_verified ? <Verified className="h-4 w-4" /> : null}</div>
            </CardContent>
          </Card>
          <SheetFooter className='flex justify-end gap-4'>
            <a href="/api/auth/logout" className="flex grow">
              <Button variant="outline" className='grow'>
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </a>
          </SheetFooter>
        </>
      )}
    </>
  )
}

export function AccountBalanceTrackerComponent() {
  const { user, isLoading: isUserLoading } = useUser()
  const [accounts, setAccounts] = useState<Account[]>([])
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [newAccountForeignCurrency, setNewAccountForeignCurrency] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null)
  const [transactionAmount, setTransactionAmount] = useState('')
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>('income')
  const [transferTo, setTransferTo] = useState<number | null>(null)
  const [exchangeRate, setExchangeRate] = useState('')
  const [viewingTransactions, setViewingTransactions] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  
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
      setViewingTransactions(null)
      
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

  const addAccount = async () => {
    if (newAccountName && newAccountBalance) {
      try {
        const initialBalance = parseFloat(newAccountBalance)
        const accountId = accounts.length > 0 ? Math.max(...accounts.map(a => a.id)) + 1 : 1
        
        const newAccount: Account = {
          id: accountId,
          name: newAccountName,
          initialBalance: initialBalance,
          currentBalance: initialBalance,
          isForeignCurrency: newAccountForeignCurrency,
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
          description: `Account "${newAccountName}" added successfully. 
            With ${initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} initial balance.`,
        })
        
        // Reset form
        setNewAccountName('')
        setNewAccountBalance('')
        setNewAccountForeignCurrency(false)
      } catch (error) {
        console.error('Error adding account:', error)
        toast.error('Failed to add account')
        // Refresh accounts to ensure UI is in sync with server
        fetchAccounts()
      }
    }
  }

  const handleTransaction = async () => {
    if (selectedAccount === null || !transactionAmount) return

    try {
      const amount = transactionType === 'expense' ? -parseFloat(transactionAmount) : parseFloat(transactionAmount)
      const updatedAccounts = [...accounts]
      const transactionId = Math.max(0, ...updatedAccounts.flatMap(acc => acc.transactions.map(t => t.id))) + 1
      const newTransaction: Transaction = {
        id: transactionId,
        date: new Date(),
        description: transactionType === 'transfer' ? `Transfer` : transactionType,
        amount: amount,
        type: transactionType,
        fromAccount: selectedAccount,
      }

      // Handle UI updates first for immediate feedback
      if (transactionType === 'transfer' && transferTo !== null) {
        const fromAccount = updatedAccounts.find(acc => acc.id === selectedAccount)
        const toAccount = updatedAccounts.find(acc => acc.id === transferTo)

        if (fromAccount && toAccount) {
          let transferAmount = amount
          let rate = 1
          
          if (fromAccount.isForeignCurrency || toAccount.isForeignCurrency) {
            rate = parseFloat(exchangeRate || '1')
            transferAmount = fromAccount.isForeignCurrency ? amount * rate : amount * (1 / rate)
            newTransaction.exchangeRate = rate
          }

          fromAccount.currentBalance -= amount
          toAccount.currentBalance += transferAmount
          newTransaction.fromAccount = selectedAccount
          newTransaction.toAccount = transferTo
          newTransaction.description = `Transfer from ${fromAccount.name} to ${toAccount.name}`
          fromAccount.transactions.push({ ...newTransaction, amount: -amount })
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
          account.currentBalance += amount
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
        description: `Amount: ${amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
      })

      // Reset form
      setTransactionAmount('')
      setExchangeRate('')
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
      // Refresh accounts to ensure UI is in sync with server
      fetchAccounts()
    }
  }

  // const exportAccountCSV = (accountId: number) => {
  //   const account = accounts.find(acc => acc.id === accountId)
  //   if (!account) return

  //   const headers = ['Date', 'Description', 'Amount', 'Type', 'From Account', 'To Account', 'Exchange Rate']
  //   const csvContent = account.transactions.map(t => 
  //     `${t.date.toISOString()},${t.description},${t.amount},${t.type},${t.fromAccount || ''},${t.toAccount || ''},${t.exchangeRate || ''}`
  //   ).join('\n')

  //   const csv = `Initial Balance,${account.initialBalance}\nCurrent Balance,${account.currentBalance}\n\n${headers.join(',')}\n${csvContent}`
  //   downloadCSV(csv, `${account.name}_transactions.csv`)
  // }

  const exportAllDataCSV = () => {
    if (!user) {
      toast.error('You must be logged in to export data')
      return
    }
    
    const accountsCSV = accounts.map(a => `${a.id},${a.name},${a.initialBalance},${a.currentBalance},${a.isForeignCurrency}`).join('\n')
    const transactionsCSV = accounts.flatMap(a => a.transactions
      .filter(t => t.type !== 'transfer' || t.fromAccount === a.id) // Only export transfers from the 'from' account
      .map(t =>
        `${t.id},${t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString()},${t.description},${t.amount},${t.type},${t.fromAccount || ''},${t.toAccount || ''},${t.exchangeRate || ''}`
      )).join('\n')

    const csv = `Accounts\nID,Name,Initial Balance,Current Balance,IsForeignCurrency\n${accountsCSV}\n\nTransactions\nID,Date,Description,Amount,Type,FromAccount,ToAccount,ExchangeRate\n${transactionsCSV}`
    downloadCSV(csv, 'all_accounts_data.csv')
  }

  const downloadCSV = (csv: string, filename: string) => {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const importData = (event: React.ChangeEvent<HTMLInputElement>, accountId?: number) => {
    if (!user) {
      toast.error('You must be logged in to import data')
      return
    }
    
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (accountId) {
        importAccountTransactions(content, accountId)
      } else {
        importAllData(content)
      }
    }
    reader.readAsText(file)
  }

  const importAccountTransactions = async (content: string, accountId: number) => {
    if (!user) {
      toast.error('You must be logged in to import data')
      return
    }
    
    try {
      const lines = content.split('\n')
      const initialBalance = parseFloat(lines[0].split(',')[1])
      const currentBalance = parseFloat(lines[1].split(',')[1])
      const transactions = lines.slice(4).map(line => {
        const values = line.split(',')
        return {
          id: Math.max(0, ...accounts.flatMap(acc => acc.transactions.map(t => t.id))) + 1,
          date: new Date(values[0]),
          description: values[1],
          amount: parseFloat(values[2]),
          type: values[3] as 'income' | 'expense' | 'transfer',
          fromAccount: parseInt(values[4]),
          toAccount: values[5] ? parseInt(values[5]) : undefined,
          exchangeRate: values[6] ? parseFloat(values[6]) : undefined
        }
      })

      // Update UI first
      const updatedAccounts = accounts.map(account => {
        if (account.id === accountId) {
          return {
            ...account,
            initialBalance,
            currentBalance,
            transactions: transactions
          }
        }
        return account
      })
      
      setAccounts(updatedAccounts)
      
      // Save to API
      const accountToUpdate = updatedAccounts.find(a => a.id === accountId)
      if (accountToUpdate) {
        const response = await fetch(`/api/accounts/${accountId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ account: accountToUpdate }),
        })
        
        if (!response.ok) {
          throw new Error('Failed to save account transactions')
        }
        
        toast.success('Account transactions imported successfully')
      }
    } catch (error) {
      console.error('Error importing account transactions:', error)
      toast.error('Failed to import account transactions')
      // Refresh accounts to ensure UI is in sync with server
      fetchAccounts()
    }
  }

  const importAllData = async (content: string) => {
    if (!user) {
      toast.error('You must be logged in to import data')
      return
    }
    
    try {
      const [accountsSection, transactionsSection] = content.split('\n\n')
      const accountLines = accountsSection.split('\n').slice(2)
      const transactionLines = transactionsSection.split('\n').slice(2)
  
      const importedAccounts = accountLines.map(line => {
        const [id, name, initialBalance, currentBalance, isForeignCurrency] = line.split(',')
        return {
          id: parseInt(id),
          name,
          initialBalance: parseFloat(initialBalance),
          currentBalance: parseFloat(currentBalance),
          isForeignCurrency: isForeignCurrency === 'true',
          transactions: [] as Transaction[]
        }
      })
  
      const transactions: Transaction[] = transactionLines.map(line => {
        const [id, date, description, amount, type, fromAccount, toAccount, exchangeRate] = line.split(',')
        return {
          id: parseInt(id),
          date: new Date(date),
          description,
          amount: parseFloat(amount),
          type: type as 'income' | 'expense' | 'transfer',
          fromAccount: parseInt(fromAccount),
          toAccount: toAccount ? parseInt(toAccount) : undefined,
          exchangeRate: exchangeRate ? parseFloat(exchangeRate) : undefined
        }
      })
  
      transactions.forEach(transaction => {
        if (transaction.type === 'transfer' && transaction.fromAccount && transaction.toAccount) {
          const fromAccount = importedAccounts.find(a => a.id === transaction.fromAccount)
          const toAccount = importedAccounts.find(a => a.id === transaction.toAccount)
          if (fromAccount && toAccount) {
            fromAccount.transactions.push({ ...transaction, amount: transaction.amount })
            toAccount.transactions.push({ ...transaction, amount: transaction.exchangeRate ? -transaction.amount * (1 / transaction.exchangeRate) : -transaction.amount })
          }
        } else {
          const account = importedAccounts.find(a => a.id === (transaction.fromAccount || transaction.toAccount))
          if (account) {
            account.transactions.push(transaction)
          }
        }
      })
  
      // Update UI first
      setAccounts(importedAccounts)
      
      // Save to API
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accounts: importedAccounts }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save imported data')
      }
      
      toast.success('Data imported successfully')
    } catch (error) {
      console.error('Error importing data:', error)
      toast.error('Failed to import data')
      // Refresh accounts to ensure UI is in sync with server
      fetchAccounts()
    }
  }

  // const addNewAccountForm = () => (

  const renderMainView = () => (
    <>
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            Total balance: <span className="font-semibold">{accounts.reduce((acc, curr) => acc + curr.currentBalance, 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
          </CardTitle>
        </CardHeader>
        {!user && (<CardContent className='text-muted-foreground'>Please sign in to manage your accounts.</CardContent>)}
        {user && accounts.length === 0 && (<CardContent className='text-muted-foreground'>Add a new account to get started.</CardContent>)}
        {user && accounts.length > 0 && (
          <CardContent className="flex flex-col gap-4">
            <span className="flex flex-wrap gap-4">
              {accounts.map(account => (
                <Card key={account.id} className="grow animate-in slide-in-from-top-4 relative overflow-hidden"
                  style={{ background: `url(https://api.dicebear.com/9.x/glass/svg?seed=${account.name.replace(' ', '')}) no-repeat center/cover`, }}>
                  <CardHeader>
                    <CardTitle className='flex justify-between items-center gap-2 text-black '>
                      <p>{account.name}</p>
                      <Badge variant={account.isForeignCurrency ? 'default' : 'secondary'}>
                        {account.isForeignCurrency ? 'Foreign' : 'Local'}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4 text-black">
                    <div className='flex justify-between items-center gap-2'>
                      <h2 className="text-2xl font-bold">
                        {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                      </h2>
                      <Button variant="ghost" className='self-end' size="sm" onClick={() => setViewingTransactions(account.id)}>
                        <History className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </span>
          </CardContent>
        )}
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>New Transaction</CardTitle>
        </CardHeader>
        {!user && (<CardContent className='text-muted-foreground'>Please sign in to add transactions.</CardContent>)}
        {user && accounts.length === 0 && (<CardContent className='text-muted-foreground'>Add a new account to get started.</CardContent>)}
        {user && accounts.length > 0 && (
          <CardContent>
            <div className="flex flex-col gap-4">
              {/* <Select onValueChange={(value) => setSelectedAccount(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Account" />
                </SelectTrigger>
                <SelectContent>
                  {accounts.map(account => (
                    <SelectItem key={account.id} value={account.id.toString()}>{account.name}: {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</SelectItem>
                  ))}
                </SelectContent>
              </Select> */}

              {/* native select */}

              <select className="w-full rounded-md border p-2 bg-background" onChange={(e) => setSelectedAccount(parseInt(e.target.value))}>
                <option value="" selected disabled>Select Account</option>
                {accounts.map(account => (
                  <option key={account.id} value={account.id}>{account.name}: {account.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</option>
                ))}
              </select>


              <ToggleGroup className="flex-1" type="single" variant="outline"
                onValueChange={(value) => setTransactionType(value as 'income' | 'expense' | 'transfer')}>
                <ToggleGroupItem className="flex-1" value="expense">Expense</ToggleGroupItem>
                <ToggleGroupItem className="flex-1" value="income">Income</ToggleGroupItem>
                { accounts.length > 1 && (<ToggleGroupItem className="flex-1" value="transfer">Transfer</ToggleGroupItem>)}
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
                max={ selectedAccount ? accounts.find(acc => acc.id === selectedAccount)?.currentBalance : 0 }
                onChange={(e) => setTransactionAmount(e.target.value)}
              />
              
              {transactionType === 'transfer' &&
                ((selectedAccount !== null && accounts.find(acc => acc.id === selectedAccount)?.isForeignCurrency) ||
                  (transferTo !== null && accounts.find(acc => acc.id === transferTo)?.isForeignCurrency)) && (
                  <Input
                    type="number"
                    placeholder="Exchange Rate"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                  />
                )}
              <Button disabled={!selectedAccount || !transactionAmount} onClick={handleTransaction}>Submit Transaction</Button>
            </div>
          </CardContent>
        )}
      </Card>

      <Card>
        <Collapsible className='flex flex-col'>
          <CollapsibleTrigger className="flex flex-1">
            <CardHeader className='flex-1'>
              <CardTitle className="flex flex-1 justify-between items-center gap-2">
                Add New Account
                <Plus className="h-6 w-6" />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent>
              {!user && <div className='text-muted-foreground'>Please sign in to add accounts.</div>}
              {user && <div className="flex flex-col gap-4">
                <Input
                  placeholder="Account Name"
                  value={newAccountName}
                  onChange={(e) => setNewAccountName(e.target.value)}
                />
                <Input
                  type="number"
                  placeholder="Initial Balance"
                  value={newAccountBalance}
                  onChange={(e) => setNewAccountBalance(e.target.value)}
                />
                <div className="flex items-center gap-4">
                  <Switch
                    id="foreign-currency"
                    checked={newAccountForeignCurrency}
                    onCheckedChange={setNewAccountForeignCurrency}
                  />
                  <Label htmlFor="foreign-currency">Foreign Currency</Label>
                </div>
                <Button onClick={addAccount}>Add Account</Button>
              </div>}
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </>
  )

  const renderTransactionHistory = () => {
    const account = accounts.find(acc => acc.id === viewingTransactions)
    if (!account) return null

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
                  <li><span className="font-semibold">Number of Transactions:</span> {account.transactions.length}</li>
                </ul>
                {user && (
                  <Button 
                    variant="destructive" 
                    className="mt-4" 
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
                        deleteAccount(account.id);
                      }
                    }}
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
            <CardTitle className="flex justify-between items-center">
              <span>Transactions</span>
            </CardTitle>
          </CardHeader>
          { account.transactions.length === 0 && (<CardContent className='text-muted-foreground'>No transactions yet.</CardContent>)}
          { account.transactions.length > 0 && (
            <CardContent>
              <div className="space-y-2">
                {account.transactions.map(transaction => (
                  <div key={transaction.id} className="flex justify-between items-center p-2 gap-2 border-b last:border-b-0">
                    <div>
                      <div className="font-semibold capitalize">{transaction.description}</div>
                      <div className="text-sm text-gray-500">
                        {typeof transaction.date === 'string' 
                          ? new Date(transaction.date).toLocaleString('es-AR')
                          : transaction.date.toLocaleString('es-AR')}
                      </div>
                    </div>
                    <div className={`font-semibold ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      </>
    )
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-wrap gap-4 justify-between sm:items-center mb-4 p-1">
        <h1 className="text-2xl font-bold">Account Tracker</h1>
        {!viewingTransactions && user && (
          <div className="flex grow justify-end gap-4">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className='grow sm:grow-0' disabled={isLoading}>
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <FileInput className="h-4 w-4" />}
              Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => importData(e)}
              accept=".csv"
            />
            <Button variant="outline" size="sm" onClick={exportAllDataCSV} className='grow sm:grow-0' disabled={isLoading}>
              {isLoading ? <Loader className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              Export
            </Button>
          </div>
        )}
        {viewingTransactions && (
          <Button variant="outline" size="sm" onClick={() => setViewingTransactions(null)}>
            <ArrowLeftCircle className="h-4 w-4" />
            Back
          </Button>
        )}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className='grow sm:grow-0'>
              <UserIcon />
            </Button>
          </SheetTrigger>
          <SheetContent className='flex flex-col gap-4'>
            <AccountSheet />
          </SheetContent>
        </Sheet>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading your accounts...</span>
        </div>
      ) : (
        viewingTransactions === null ? renderMainView() : renderTransactionHistory()
      )}
    </div>
  )
}