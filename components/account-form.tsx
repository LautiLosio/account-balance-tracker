'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Plus, Sparkles } from 'lucide-react'

interface AccountFormProps {
  onAddAccount: (name: string, initialBalance: number, isForeignCurrency: boolean) => void
}

export function AccountForm({ onAddAccount }: AccountFormProps) {
  const [newAccountName, setNewAccountName] = useState('')
  const [newAccountBalance, setNewAccountBalance] = useState('')
  const [newAccountForeignCurrency, setNewAccountForeignCurrency] = useState(false)

  const handleSubmit = () => {
    if (!newAccountName || !newAccountBalance) {
      return
    }

    onAddAccount(newAccountName, Number.parseFloat(newAccountBalance), newAccountForeignCurrency)
    setNewAccountName('')
    setNewAccountBalance('')
    setNewAccountForeignCurrency(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400">Create</p>
          <h3 className="font-display text-3xl text-zinc-900 dark:text-zinc-100">New Account</h3>
        </div>
        <Plus className="h-6 w-6 text-zinc-500 dark:text-zinc-300" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="account-name" className="font-mono text-[11px] uppercase tracking-[0.2em]">Label</Label>
        <Input
          id="account-name"
          placeholder="Personal · Savings · Travel"
          value={newAccountName}
          onChange={(e) => setNewAccountName(e.target.value)}
          className="rounded-2xl border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/35"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="initial-balance" className="font-mono text-[11px] uppercase tracking-[0.2em]">Initial Balance</Label>
        <Input
          id="initial-balance"
          type="number"
          placeholder="0"
          value={newAccountBalance}
          onChange={(e) => setNewAccountBalance(e.target.value)}
          className="rounded-2xl border-black/10 bg-white/70 dark:border-white/10 dark:bg-black/35"
        />
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-black/10 bg-white/70 p-3 dark:border-white/10 dark:bg-black/30">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em]">Foreign Currency</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Enable if this account is non-ARS</p>
        </div>
        <Switch
          id="foreign-currency"
          checked={newAccountForeignCurrency}
          onCheckedChange={setNewAccountForeignCurrency}
        />
      </div>
      <Button onClick={handleSubmit} className="w-full rounded-2xl bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300">
        <Sparkles className="mr-2 h-4 w-4" />
        Create Instantly
      </Button>
    </div>
  )
}
