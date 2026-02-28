'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft, MinusCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Account } from '@/types/schema';
import { cn } from '@/lib/utils';

interface TransactionFormProps {
  accounts: Account[];
  onAddTransaction: (
    selectedAccount: number,
    amount: number,
    type: 'income' | 'expense' | 'transfer',
    transferTo?: number,
    exchangeRate?: number
  ) => void;
}

export function TransactionForm({ accounts, onAddTransaction }: TransactionFormProps) {
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'income' | 'expense' | 'transfer'>('income');
  const [transferTo, setTransferTo] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState('');

  const needsExchangeRate =
    transactionType === 'transfer' &&
    ((selectedAccount !== null && accounts.find((a) => a.id === selectedAccount)?.isForeignCurrency) ||
      (transferTo !== null && accounts.find((a) => a.id === transferTo)?.isForeignCurrency));

  const disabledSubmit = useMemo(() => {
    const amount = Number.parseFloat(transactionAmount);
    const rate = Number.parseFloat(exchangeRate);
    if (selectedAccount === null) return true;
    if (!Number.isFinite(amount) || amount <= 0) return true;
    if (transactionType === 'transfer' && transferTo === null) return true;
    if (needsExchangeRate && (!Number.isFinite(rate) || rate <= 0)) return true;
    return false;
  }, [selectedAccount, transactionAmount, transactionType, transferTo, needsExchangeRate, exchangeRate]);

  const handleSubmit = () => {
    if (disabledSubmit || selectedAccount === null) return;
    onAddTransaction(
      selectedAccount,
      Number.parseFloat(transactionAmount),
      transactionType,
      transferTo ?? undefined,
      exchangeRate ? Number.parseFloat(exchangeRate) : undefined
    );
    setTransactionAmount('');
    setExchangeRate('');
  };

  return (
    <section className="rounded-xl border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">New Transaction</h3>
      </div>

      {accounts.length === 0 ? (
        <p className="px-4 py-6 text-center text-xs text-muted-foreground">Create an account first.</p>
      ) : (
        <div className="space-y-3 p-4">
          <ToggleGroup
            className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/30 p-1"
            type="single"
            variant="outline"
            value={transactionType}
            onValueChange={(v) => setTransactionType((v || 'income') as 'income' | 'expense' | 'transfer')}
          >
            <ToggleGroupItem
              value="expense"
              className={cn(
                'rounded-md text-xs font-medium',
                transactionType === 'expense' && 'bg-rose-500/10 text-rose-500 border-rose-500/30'
              )}
            >
              <MinusCircle className="mr-1.5 h-3.5 w-3.5" />
              Expense
            </ToggleGroupItem>
            <ToggleGroupItem
              value="income"
              className={cn(
                'rounded-md text-xs font-medium',
                transactionType === 'income' && 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
              )}
            >
              <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
              Income
            </ToggleGroupItem>
            <ToggleGroupItem
              value="transfer"
              disabled={accounts.length < 2}
              className={cn(
                'rounded-md text-xs font-medium',
                transactionType === 'transfer' && 'bg-primary/10 text-primary border-primary/30'
              )}
            >
              <ArrowRightLeft className="mr-1.5 h-3.5 w-3.5" />
              Transfer
            </ToggleGroupItem>
          </ToggleGroup>

          <Select onValueChange={(v) => setSelectedAccount(Number.parseInt(v, 10))}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue placeholder="Select account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((a) => (
                <SelectItem key={a.id} value={a.id.toString()}>
                  <span className="font-medium">{a.name}</span>
                  <span className="ml-2 font-mono text-xs text-muted-foreground tabular-nums">
                    {a.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            type="number"
            placeholder="Amount"
            value={transactionAmount}
            min={0}
            onChange={(e) => setTransactionAmount(e.target.value)}
            className="h-9 font-mono text-sm tabular-nums"
          />

          {transactionType === 'transfer' && (
            <Select onValueChange={(v) => setTransferTo(Number.parseInt(v, 10))}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Destination account" />
              </SelectTrigger>
              <SelectContent>
                {accounts.filter((a) => a.id !== selectedAccount).map((a) => (
                  <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {needsExchangeRate && (
            <Input
              type="number"
              placeholder="Exchange rate"
              value={exchangeRate}
              onChange={(e) => setExchangeRate(e.target.value)}
              className="h-9 font-mono text-sm tabular-nums"
            />
          )}

          <Button
            disabled={disabledSubmit}
            onClick={handleSubmit}
            className="h-9 w-full text-sm font-semibold"
          >
            Save Transaction
          </Button>
        </div>
      )}
    </section>
  );
}
