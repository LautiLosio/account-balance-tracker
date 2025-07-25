'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Plus } from 'lucide-react'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { UserProfile } from '@auth0/nextjs-auth0/client'

interface AccountFormProps {
  user: UserProfile | undefined
  onAddAccount: (name: string, initialBalance: number, isForeignCurrency: boolean) => void
}

export function AccountForm({ user, onAddAccount }: AccountFormProps) {
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [newAccountForeignCurrency, setNewAccountForeignCurrency] = useState(false)

  const handleSubmit = () => {
    if (newAccountName && newAccountBalance) {
      onAddAccount(newAccountName, parseFloat(newAccountBalance), newAccountForeignCurrency)
      // Reset form
      setNewAccountName('')
      setNewAccountBalance('')
      setNewAccountForeignCurrency(false)
    }
  }

  return (
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
            {user && (
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
                <Button onClick={handleSubmit}>Add Account</Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}