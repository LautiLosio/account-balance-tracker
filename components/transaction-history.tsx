'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Info } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Account } from '@/types/schema'
import { UserProfile } from '@auth0/nextjs-auth0/client'

interface TransactionHistoryProps {
  user: UserProfile | undefined
  account: Account
  onDeleteAccount: (accountId: string) => void
}

export function TransactionHistory({ user, account, onDeleteAccount }: TransactionHistoryProps) {
  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete this account? This action cannot be undone.')) {
      onDeleteAccount(account.id)
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
                <li><span className="font-semibold">Number of Transactions:</span> {account.transactions.length}</li>
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
          <CardTitle className="flex justify-between items-center">
            <span>Transactions</span>
          </CardTitle>
        </CardHeader>
        {account.transactions.length === 0 && (
          <CardContent className='text-muted-foreground'>No transactions yet.</CardContent>
        )}
        {account.transactions.length > 0 && (
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