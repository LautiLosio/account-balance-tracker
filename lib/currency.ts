import { Account } from '@/types/schema';

export const getCurrencyFromAccount = (account: Pick<Account, 'isForeignCurrency'>): 'ARS' | 'USD' =>
  account.isForeignCurrency ? 'USD' : 'ARS';

export const formatMoney = (amount: number, currency: 'ARS' | 'USD') =>
  amount.toLocaleString('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export const formatAccountMoney = (amount: number, account: Pick<Account, 'isForeignCurrency'>) =>
  formatMoney(amount, getCurrencyFromAccount(account));
