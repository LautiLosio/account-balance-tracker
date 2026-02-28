'use client';

import { Account } from '@/types/schema';
import { AccountForm } from '@/components/account-form';
import { AccountList } from '@/components/account-list';

interface AccountCrudPanelProps {
  accounts: Account[];
  onAddAccount: (name: string, initialBalance: number, isForeignCurrency: boolean) => void;
}

export function AccountCrudPanel({ accounts, onAddAccount }: AccountCrudPanelProps) {
  return (
    <>
      <AccountList accounts={accounts} />
      <AccountForm onAddAccount={onAddAccount} />
    </>
  );
}
