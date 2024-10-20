'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "sonner"
import { ArrowLeftCircle, FileDown, FileInput, Plus, Info, History } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"

interface Account {
  id: number
  name: string
  initialBalance: number
  currentBalance: number
  isForeignCurrency: boolean
  transactions: Transaction[]
}

interface Transaction {
  id: number
  date: Date
  description: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  fromAccount: number
  toAccount?: number
  exchangeRate?: number
}

export function AccountBalanceTrackerComponent() {
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

  const fileInputRef = useRef<HTMLInputElement>(null)

  const addAccount = () => {
    if (newAccountName && newAccountBalance) {
      const initialBalance = parseFloat(newAccountBalance)
      const accountId = accounts.length + 1
      setAccounts([
        ...accounts,
        {
          id: accountId,
          name: newAccountName,
          initialBalance: initialBalance,
          currentBalance: initialBalance,
          isForeignCurrency: newAccountForeignCurrency,
          transactions: []
        }
      ])
      toast.success('Account added successfully', {
        description: `Account "${newAccountName}" added successfully. 
          With ${initialBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })} initial balance.`,
        action: {
          label: 'Undo',
          onClick: () => {
            setAccounts(prevAccounts => {
              return prevAccounts.filter(acc => acc.id !== accountId)
            })
            setNewAccountName('')
            setNewAccountBalance('')
            setNewAccountForeignCurrency(false)
          }
        }
      })
      setNewAccountName('')
      setNewAccountBalance('')
      setNewAccountForeignCurrency(false)
    }
  }

  const handleTransaction = () => {
    if (selectedAccount === null || !transactionAmount) return

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

    if (transactionType === 'transfer' && transferTo !== null) {
      const fromAccount = updatedAccounts.find(acc => acc.id === selectedAccount)
      const toAccount = updatedAccounts.find(acc => acc.id === transferTo)

      if (fromAccount && toAccount) {
        let transferAmount = amount
        if (fromAccount.isForeignCurrency || toAccount.isForeignCurrency) {
          const rate = parseFloat(exchangeRate)
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
      }
    } else {
      const account = updatedAccounts.find(acc => acc.id === selectedAccount)
      if (account) {
        account.currentBalance += amount
        account.transactions.push(newTransaction)
      }
    }

    toast.success(`${newTransaction.description} added successfully`, {
      description: `Amount: ${amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}`,
      action: {
        label: 'X',
        onClick: () => {
        }
      }
    })

    setAccounts(updatedAccounts)
    setTransactionAmount('')
    setExchangeRate('')
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
    const accountsCSV = accounts.map(a => `${a.id},${a.name},${a.initialBalance},${a.currentBalance},${a.isForeignCurrency}`).join('\n')
    const transactionsCSV = accounts.flatMap(a => a.transactions
      .filter(t => t.type !== 'transfer' || t.fromAccount === a.id) // Only export transfers from the 'from' account
      .map(t =>
        `${t.id},${t.date.toISOString()},${t.description},${t.amount},${t.type},${t.fromAccount || ''},${t.toAccount || ''},${t.exchangeRate || ''}`
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

  const importAccountTransactions = (content: string, accountId: number) => {
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

    setAccounts(prevAccounts => {
      return prevAccounts.map(account => {
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
    })
  }

  const importAllData = (content: string) => {
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

    setAccounts(importedAccounts)
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
        {accounts.length === 0 && (<CardContent className='text-muted-foreground'>Add a new account to get started.</CardContent>)}
        {accounts.length > 0 && (
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
            {/* <Button variant="outline" onClick={() => console.log('add account')}>
              <Plus className="h-4 w-4" />
              Add new account
            </Button> */}
          </CardContent>
        )}
      </Card>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>New Transaction</CardTitle>
        </CardHeader>
        {accounts.length === 0 && (<CardContent className='text-muted-foreground'>Add a new account to get started.</CardContent>)}
        {accounts.length > 0 && (
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
              <div className="flex flex-col gap-4">
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
              </div>
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
                      <div className="text-sm text-gray-500">{transaction.date.toLocaleString('es-AR')}</div>
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
        {!viewingTransactions && (
          <div className="flex grow justify-end gap-4">
            <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className='grow sm:grow-0'>
              <FileInput className="h-4 w-4" />
              Import
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={(e) => importData(e)}
              accept=".csv"
            />
            <Button variant="outline" size="sm" onClick={exportAllDataCSV} className='grow sm:grow-0'>
              <FileDown className="h-4 w-4" />
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
      </div>
      {viewingTransactions === null ? renderMainView() : renderTransactionHistory()}
    </div>
  )
}