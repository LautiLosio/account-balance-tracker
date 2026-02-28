'use client';

import { Account } from '@/types/schema';
import { TransactionHistory } from '@/components/transaction-history';

interface HistoryPanelProps {
  account: Account;
  onDeleteAccount: (accountId: number) => void;
}

export function HistoryPanel({ account, onDeleteAccount }: HistoryPanelProps) {
  return <TransactionHistory account={account} onDeleteAccount={onDeleteAccount} />;
}
