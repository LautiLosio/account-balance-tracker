'use client';

import { useMemo, useState, useSyncExternalStore } from 'react';
import { ArrowRightLeft, MinusCircle, PlusCircle } from 'lucide-react';
import { NumericFormat } from 'react-number-format';
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

type TxVisualConfig = {
  label: string;
  icon: typeof PlusCircle;
  selected: string;
  unselected: string;
  submit: string;
};

const TYPE_CONFIG: Record<TxType, TxVisualConfig> = {
  income: {
    label: 'Income',
    icon: PlusCircle,
    selected: 'border-emerald-400/70 bg-emerald-500/20 text-emerald-200',
    unselected: 'border-transparent text-emerald-300/70 hover:border-emerald-400/40 hover:bg-emerald-500/10 hover:text-emerald-200',
    submit: '!bg-emerald-500 !text-white hover:!bg-emerald-600',
  },
  expense: {
    label: 'Expense',
    icon: MinusCircle,
    selected: 'border-rose-400/70 bg-rose-500/20 text-rose-200',
    unselected: 'border-transparent text-rose-300/70 hover:border-rose-400/40 hover:bg-rose-500/10 hover:text-rose-200',
    submit: '!bg-rose-500 !text-white hover:!bg-rose-600',
  },
  transfer: {
    label: 'Transfer',
    icon: ArrowRightLeft,
    selected: 'border-sky-400/70 bg-sky-500/20 text-sky-200',
    unselected: 'border-transparent text-sky-300/70 hover:border-sky-400/40 hover:bg-sky-500/10 hover:text-sky-200',
    submit: '!bg-sky-500 !text-sky-950 hover:!bg-sky-400',
  },
};

const TYPE_COLOR_CONFIGS = {
  income: { selected: TYPE_CONFIG.income.selected, unselected: TYPE_CONFIG.income.unselected },
  expense: { selected: TYPE_CONFIG.expense.selected, unselected: TYPE_CONFIG.expense.unselected },
  transfer: { selected: TYPE_CONFIG.transfer.selected, unselected: TYPE_CONFIG.transfer.unselected },
} as const;

export function TransactionForm({ accounts, onAddTransaction }: TransactionFormProps) {
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<TxType>('income');
  const [transferTo, setTransferTo] = useState<number | null>(null);
  const [exchangeRate, setExchangeRate] = useState('');
  const locale = useSyncExternalStore(
    () => () => undefined,
    () => (typeof navigator !== 'undefined' && navigator.language ? navigator.language : 'es-AR'),
    () => 'es-AR'
  );

  const { groupSeparator, decimalSeparator } = useMemo(() => {
    try {
      const parts = new Intl.NumberFormat(locale).formatToParts(12345.6);
      return {
        groupSeparator: parts.find((part) => part.type === 'group')?.value ?? '.',
        decimalSeparator: parts.find((part) => part.type === 'decimal')?.value ?? ',',
      };
    } catch {
      return { groupSeparator: '.', decimalSeparator: ',' };
    }
  }, [locale]);

  const amountPlaceholder = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(0);
    } catch {
      return '0,00';
    }
  }, [locale]);

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
        colorConfigs={TYPE_COLOR_CONFIGS}
        type="single"
        value={type}
        onValueChange={(v) => setType((v || 'income') as TxType)}
      >
        {(Object.entries(TYPE_CONFIG) as [TxType, typeof TYPE_CONFIG[TxType]][]).map(([key, cfg]) => {
          const Icon = cfg.icon;
          return (
            <ToggleGroupItem
              key={key}
              value={key}
              disabled={key === 'transfer' && accounts.length < 2}
              className="h-10 gap-1.5 rounded-lg border font-display text-xs font-bold transition-all data-[state=on]:scale-[1.01]"
            >
              <Icon className="h-3.5 w-3.5" />
              {cfg.label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>

      {/* Account + Amount row */}
      <div className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] gap-2">
        <Select onValueChange={(v) => setSelectedAccount(Number.parseInt(v, 10))}>
          <SelectTrigger className="h-12 rounded-xl text-sm">
            <SelectValue placeholder="Select account" />
          </SelectTrigger>
          <SelectContent>
            {accounts.map((a) => (
              <SelectItem key={a.id} value={a.id.toString()}>
                <span className="font-semibold">{a.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <NumericFormat
          customInput={Input}
          value={amount}
          valueIsNumericString
          allowNegative={false}
          decimalScale={2}
          thousandSeparator={groupSeparator}
          decimalSeparator={decimalSeparator}
          allowedDecimalSeparators={[decimalSeparator, decimalSeparator === ',' ? '.' : ',']}
          inputMode="decimal"
          placeholder={amountPlaceholder}
          onValueChange={({ value }) => setAmount(value)}
          className="h-12 rounded-xl text-right font-mono text-base font-semibold tabular"
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
        variant="ghost"
        className={cn(
          'h-12 w-full rounded-xl font-display text-sm font-bold transition-all active:scale-[0.98]',
          disabled ? 'border border-border bg-muted/60 text-muted-foreground' : TYPE_CONFIG[type].submit,
        )}
      >
        Save {type.charAt(0).toUpperCase() + type.slice(1)}
      </Button>
    </div>
  );
}
