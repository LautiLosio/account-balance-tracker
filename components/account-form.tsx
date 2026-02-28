'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface AccountFormProps {
  onAddAccount: (name: string, initialBalance: number, isForeignCurrency: boolean) => void;
}

export function AccountForm({ onAddAccount }: AccountFormProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isForeign, setIsForeign] = useState(false);

  const handleSubmit = () => {
    if (!name || !balance) return;
    onAddAccount(name, Number.parseFloat(balance), isForeign);
    setName('');
    setBalance('');
    setIsForeign(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="account-name" className="text-xs font-medium text-muted-foreground">Account name</Label>
        <Input
          id="account-name"
          placeholder="e.g. Savings, Checking, Travel"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-9 text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="initial-balance" className="text-xs font-medium text-muted-foreground">Initial balance</Label>
        <Input
          id="initial-balance"
          type="number"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="h-9 font-mono text-sm tabular-nums"
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2.5">
        <div>
          <p className="text-sm font-medium text-foreground">Foreign currency</p>
          <p className="text-xs text-muted-foreground">Enable for non-ARS accounts</p>
        </div>
        <Switch id="foreign-currency" checked={isForeign} onCheckedChange={setIsForeign} />
      </div>
      <Button onClick={handleSubmit} disabled={!name || !balance} className="h-9 w-full text-sm font-semibold">
        Create Account
      </Button>
    </div>
  );
}
