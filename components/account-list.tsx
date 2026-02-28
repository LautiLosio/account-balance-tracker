'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { History } from 'lucide-react'
import { Account } from '@/types/schema'
import { UserProfile } from '@auth0/nextjs-auth0/client'

interface AccountListProps {
  user: UserProfile | undefined
  accounts: Account[]
  onViewTransactions: (accountId: string) => void
}

export function AccountList({ user, accounts, onViewTransactions }: AccountListProps) {
  const totalBalance = accounts.reduce((acc, curr) => acc + curr.currentBalance, 0)

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          Total balance: <span className="font-semibold">{totalBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</span>
        </CardTitle>
      </CardHeader>
      {!user && (<CardContent className='text-muted-foreground'>Please sign in to manage your accounts.</CardContent>)}
      {user && accounts.length === 0 && (<CardContent className='text-muted-foreground'>Add a new account to get started.</CardContent>)}
      {user && accounts.length > 0 && (
        <CardContent className="flex flex-col gap-4">
          <span className="flex flex-wrap gap-4">
            {accounts.map(account => (
              <Card key={account.id} className="grow animate-in slide-in-from-top-4 relative overflow-hidden"
                style={{ background: `url(https://api.dicebear.com/9.x/glass/svg?seed=${account.name.replace(' ', '')}) no-repeat center/cover` }}>
                <CardHeader>
                  <CardTitle className='flex justify-between items-center gap-2 text-black'>
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
                    <Button variant="ghost" className='self-end' size="sm" onClick={() => onViewTransactions(account.id)}>
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
  )
}