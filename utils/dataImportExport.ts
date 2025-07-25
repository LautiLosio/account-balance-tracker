import { toast } from 'sonner'
import { Account, Transaction } from '@/types/schema'
import { UserProfile } from '@auth0/nextjs-auth0/client'

export const exportAllDataCSV = (accounts: Account[]) => {
  const accountsCSV = accounts.map(a => `${a.id},${a.name},${a.initialBalance},${a.currentBalance},${a.isForeignCurrency}`).join('\n')
  const transactionsCSV = accounts.flatMap(a => a.transactions
    .filter(t => t.type !== 'transfer' || t.fromAccount === a.id) // Only export transfers from the 'from' account
    .map(t =>
      `${t.id},${t.date instanceof Date ? t.date.toISOString() : new Date(t.date).toISOString()},${t.description},${t.amount},${t.type},${t.fromAccount || ''},${t.toAccount || ''},${t.exchangeRate || ''}`
    )).join('\n')

  const csv = `Accounts\nID,Name,Initial Balance,Current Balance,IsForeignCurrency\n${accountsCSV}\n\nTransactions\nID,Date,Description,Amount,Type,FromAccount,ToAccount,ExchangeRate\n${transactionsCSV}`
  downloadCSV(csv, 'all_accounts_data.csv')
}

export const downloadCSV = (csv: string, filename: string) => {
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

export const importAccountTransactions = async (
  content: string, 
  accountId: number, 
  accounts: Account[], 
  setAccounts: (accounts: Account[]) => void,
  user: UserProfile | undefined
) => {
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
  }
}

export const importAllData = async (
  content: string, 
  setAccounts: (accounts: Account[]) => void,
  user: UserProfile | undefined
) => {
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
  }
}

export const handleFileImport = (
  event: React.ChangeEvent<HTMLInputElement>, 
  accounts: Account[],
  setAccounts: (accounts: Account[]) => void,
  user: UserProfile | undefined,
  accountId?: number
) => {
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
      importAccountTransactions(content, accountId, accounts, setAccounts, user)
    } else {
      importAllData(content, setAccounts, user)
    }
  }
  reader.readAsText(file)
}