'use client';

import { useMemo, useState } from 'react';
import { ArrowRightLeft, MinusCircle, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Account } from '@/types/schema';
import { cn } from '@/lib/utils';

type TxType = 'income' | 'expense' | 'transfer';

interface TransactionFormProps {
  accounts: Account[];
  onAddTransaction: (
    selectedAccount: number,
    amount: number,
    type: TxType,
    transferTo?: number,
    exchangeRate?: number
  ) => void;
}

const TYPE_CONFIG: Record<TxType, { label: string; icon: typeof PlusCircle; active: string }> = {
  income: { label: 'Income', icon: PlusCircle, active: 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' },
  expense: { label: 'Expense', icon: MinusCircle, active: 'border-rose-500/50 bg-rose-500/10 text-rose-400' },
  transfer: { label: 'Transfer', icon: ArrowRightLeft, active: 'border-primary/50 bg-primary/10 text-primary' },
};

export function TransactionForm({ accounts, onAddTransaction }: TransactionFormProps) {
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('income');
  const [transferTo, setTransferTo] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState('');

  const needsExchangeRate =
    type === 'transfer' &&
    ((selectedAccount !== null && accounts.find((a) => a.id === selectedAccount)?.isForeignCurrency) ||
      (transferTo !== null && accounts.find((a) => a.id === transferTo)?.isForeignCurrency));

  const disabled = useMemo(() => {
    const parsedAmount = Number.parseFloat(amount);
    const parsedRate = Number.parseFloat(exchangeRate);
    if (selectedAccount === null) return true;
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) return true;
    if (type === 'transfer' && transferTo === null) return true;
    if (needsExchangeRate && (!Number.isFinite(parsedRate) || parsedRate <= 0)) return true;
    return false;
  }, [selectedAccount, amount, type, transferTo, needsExchangeRate, exchangeRate]);

  const handleSubmit = () => {
    if (disabled || selectedAccount === null) return;
    onAddTransaction(
      selectedAccount,
      Number.parseFloat(amount),
      type,
      transferTo ?? undefined,
      exchangeRate ? Number.parseFloat(exchangeRate) : undefined
    );
    setAmount('');
    setExchangeRate('');
  };

  if (accounts.length === 0) {
    return (
      <p className="py-4 text-center font-mono text-xs text-muted-foreground">
        Create an account first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <ToggleGroup
        className="grid grid-cols-3 gap-1 rounded-xl border border-border bg-muted/30 p-1"
        type="single"
        variant="outline"
        value={type}
        onValueChange={(v) => setType((v || 'income') as TxType)}
      >
        {(Object.entries(TYPE_CONFIG) as [TxType, typeof TYPE_CONFIG[TxType]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          const isActive = type === key;
          return (
            <ToggleGroupItem
              key={key}
              value={key}
              disabled={key === 'transfer' && accounts.length < 2}
              className={cn(
                'h-10 gap-1.5 rounded-lg border font-display text-xs font-bold transition-all',
                isActive ? cfg.active : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {/* Account + Amount row */}
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <Select onValueChange={(v) => setSelectedAccount(Number.parseInt(v, 10))}>
          <SelectTrigger className="h-12 rounded-xl text-sm">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                <span className="font-semibold">{a.name}</span>
                <span className="ml-2 font-mono text-xs text-muted-foreground tabular">
                  {a.currentBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          min={0}
          onChange={(e) => setAmount(e.target.value)}
          className="h-12 w-32 rounded-xl text-center font-mono text-sm font-semibold tabular sm:w-36"
        />
      </div>

      {/* Transfer destination */}
      {type === 'transfer' && (
        <Select onValueChange={(v) => setTransferTo(Number.parseInt(v, 10))}>
          <SelectTrigger className="h-12 rounded-xl text-sm">
            <SelectValue placeholder="Destination account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.filter((a) => a.id !== selectedAccount).map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Exchange rate */}
      {needsExchangeRate && (
        <Input
          type="number"
          placeholder="Exchange rate"
          value={exchangeRate}
          onChange={(e) => setExchangeRate(e.target.value)}
          className="h-12 rounded-xl font-mono text-sm tabular"
        />
      )}

      {/* Submit */}
      <Button
        disabled={disabled}
        onClick={handleSubmit}
        className={cn(
          'h-12 w-full rounded-xl font-display text-sm font-bold transition-all active:scale-[0.98]',
          type === 'expense' && !disabled && 'bg-rose-500 text-white hover:bg-rose-600',
          type === 'income' && !disabled && 'bg-emerald-500 text-white hover:bg-emerald-600',
          type === 'transfer' && !disabled && 'bg-primary text-primary-foreground hover:opacity-90',
        )}
      >
        Save {type.charAt(0).toUpperCase() + type.slice(1)}
      </Button>
    </div>
  );
}
