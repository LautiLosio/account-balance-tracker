'use client'

import { useState, useRef } from 'react'
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet"
import { useUser } from '@auth0/nextjs-auth0/client'
import { ArrowLeftCircle, Download, Upload, User, Loader } from 'lucide-react'
import { useAccountData } from '@/hooks/useAccountData'
import { exportAllDataCSV, handleFileImport } from '@/utils/dataImportExport'
import { AccountForm } from '@/components/account-form'
import { TransactionForm } from '@/components/transaction-form'
import { AccountList } from '@/components/account-list'
import { TransactionHistory } from '@/components/transaction-history'

function UserIcon() {
  const { user } = useUser()
  
  if (!user) {
    return <User className="h-6 w-6" />
  }
  
  return (
    <div className="flex items-center gap-2">
      {user.picture && (
        <img
          src={user.picture}
          alt={user.name || 'User'}
          width={24}
          height={24}
          className="rounded-full"
        />
      )}
    </div>
  )
}

function AccountSheet() {
  const { user, isLoading } = useUser()
  
  if (isLoading) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <Loader className="h-4 w-4 animate-spin" />
          </Button>
        </SheetTrigger>
        <SheetContent>
          <div className="flex items-center justify-center h-full">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        </SheetContent>
      </Sheet>
    )
  }
  
  if (!user) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon">
            <UserIcon />
          </Button>
        </SheetTrigger>
        <SheetContent className="flex flex-col">
          <div className="flex-1 flex flex-col justify-center">
            <h2 className="text-xl font-semibold mb-2">Account</h2>
            <p className="text-muted-foreground mb-4">
              Sign in to manage your accounts and transactions.
            </p>
            <a href="/api/auth/login">
              <Button className="w-full">Sign In</Button>
            </a>
          </div>
        </SheetContent>
      </Sheet>
    )
  }
  
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <UserIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex flex-col">
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Account</h2>
        </div>
        <div className="flex-1">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={user.picture || ''}
                alt={user.name || 'User'}
                width={40}
                height={40}
                className="rounded-full"
              />
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <a href="/api/auth/logout" className="w-full">
            <Button variant="outline" className="w-full">
              Sign Out
            </Button>
          </a>
        </div>
      </SheetContent>
    </Sheet>
  )
}

export function AccountBalanceTrackerComponent() {
  const { user, isLoading: isUserLoading } = useUser()
  const {
    accounts,
    isLoading,
    fetchAccounts,
    deleteAccount,
    addAccount,
    addTransaction,
    updateTransaction,
    softDeleteTransaction
  } = useAccountData()
  
  const [viewingTransactions, setViewingTransactions] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleExport = () => {
    if (!user) return
    exportAllDataCSV(accounts)
  }

  const handleImport = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (user) {
      handleFileImport(event, accounts, () => {
         // Update local state and refresh from server
         fetchAccounts()
       }, user)
    }
  }

  const handleViewTransactions = (accountId: number) => {
    setViewingTransactions(accountId)
  }

  const handleBackToMain = () => {
    setViewingTransactions(null)
  }

  const handleDeleteAccount = async (accountId: number) => {
    await deleteAccount(accountId)
    setViewingTransactions(null)
  }

  const viewingAccount = viewingTransactions ? accounts.find(a => a.id === viewingTransactions) : null

  if (isUserLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Account Balance Tracker</h1>
        <div className="flex gap-2">
          {user && (
            <>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" onClick={handleImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
          <AccountSheet />
        </div>
      </div>

      {viewingTransactions && (
        <Button 
          variant="ghost" 
          className="mb-4" 
          onClick={handleBackToMain}
        >
          <ArrowLeftCircle className="h-4 w-4 mr-2" />
          Back to accounts
        </Button>
      )}

      {!viewingTransactions ? (
        <div className="space-y-6">
          <AccountList 
            user={user}
            accounts={accounts}
            onViewTransactions={handleViewTransactions}
          />
          
          <TransactionForm 
            user={user}
            accounts={accounts}
            onAddTransaction={addTransaction}
          />
          
          <AccountForm 
            user={user}
            onAddAccount={addAccount}
          />
        </div>
      ) : (
        viewingAccount && (
          <TransactionHistory 
            user={user}
            account={viewingAccount}
            onDeleteAccount={handleDeleteAccount}
            onRefresh={fetchAccounts}
            onUpdateTransaction={updateTransaction}
            onSoftDeleteTransaction={softDeleteTransaction}
          />
        )
      )}
    </div>
  )
}