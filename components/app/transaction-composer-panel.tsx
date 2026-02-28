'use client';

import { Account } from '@/types/schema';
import { TransactionForm } from '@/components/transaction-form';

interface TransactionComposerPanelProps {
  accounts: Account[];
  onAddTransaction: (
    selectedAccount: number,
    amount: number,
    type: 'income' | 'expense' | 'transfer',
    transferTo?: number,
    exchangeRate?: number
  ) => void;
}

export function TransactionComposerPanel({ accounts, onAddTransaction }: TransactionComposerPanelProps) {
  return <TransactionForm accounts={accounts} onAddTransaction={onAddTransaction} />;
}
