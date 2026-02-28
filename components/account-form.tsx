'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface AccountFormProps {
  onAddAccount: (name: string, initialBalance: number, isForeignCurrency: boolean) => void;
}

export function AccountForm({ onAddAccount }: AccountFormProps) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isForeign, setIsForeign] = useState(false);

  const canSubmit = name.trim().length > 0 && balance.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onAddAccount(name.trim(), Number.parseFloat(balance), isForeign);
    setName('');
    setBalance('');
    setIsForeign(false);
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="account-name" className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Name
        </Label>
        <Input
          id="account-name"
          placeholder="Savings, Travel, Checking…"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-11 rounded-xl text-sm"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="initial-balance" className="font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Initial Balance
        </Label>
        <Input
          id="initial-balance"
          type="number"
          placeholder="0.00"
          value={balance}
          onChange={(e) => setBalance(e.target.value)}
          className="h-11 rounded-xl font-mono text-sm tabular"
        />
      </div>
      <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Foreign currency</p>
          <p className="font-mono text-xs text-muted-foreground">Non-ARS account</p>
        </div>
        <Switch id="foreign-currency" checked={isForeign} onCheckedChange={setIsForeign} />
      </div>
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="h-11 w-full rounded-xl font-display font-bold active:scale-[0.98]"
      >
        Create Account
      </Button>
    </div>
  );
}
