import { Transaction, TransactionType } from '@/types/schema';

interface TransferAmountInput {
  sourceAmount: number;
  fromAccountIsForeign: boolean;
  toAccountIsForeign: boolean;
  exchangeRate?: number;
}

interface BuildTransferEntriesInput extends TransferAmountInput {
  id: number;
  date: Date;
  fromAccountId: number;
  toAccountId: number;
  fromAccountName: string;
  toAccountName: string;
}

export const toCanonicalAmount = (type: TransactionType, amount: number): number => {
  const absoluteAmount = Math.abs(amount);

  if (type === 'income') return absoluteAmount;
  if (type === 'expense') return -absoluteAmount;

  return amount;
};

export const getTransferInAmount = ({
  sourceAmount,
  fromAccountIsForeign,
  toAccountIsForeign,
  exchangeRate,
}: TransferAmountInput): number => {
  const absoluteSourceAmount = Math.abs(sourceAmount);

  if (!fromAccountIsForeign && !toAccountIsForeign) {
    return absoluteSourceAmount;
  }

  if (!exchangeRate || exchangeRate <= 0) {
    throw new Error('A positive exchange rate is required for cross-currency transfers.');
  }

  return fromAccountIsForeign
    ? absoluteSourceAmount * exchangeRate
    : absoluteSourceAmount / exchangeRate;
};

export const buildTransferEntries = ({
  id,
  date,
  fromAccountId,
  toAccountId,
  fromAccountName,
  toAccountName,
  sourceAmount,
  fromAccountIsForeign,
  toAccountIsForeign,
  exchangeRate,
}: BuildTransferEntriesInput): {
  fromEntry: Transaction;
  toEntry: Transaction;
} => {
  const transferInAmount = getTransferInAmount({
    sourceAmount,
    fromAccountIsForeign,
    toAccountIsForeign,
    exchangeRate,
  });

  const normalizedExchangeRate =
    fromAccountIsForeign || toAccountIsForeign ? exchangeRate : undefined;

  return {
    fromEntry: {
      id,
      date,
      description: `Transfer to ${toAccountName}`,
      amount: -Math.abs(sourceAmount),
      type: 'transfer',
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      exchangeRate: normalizedExchangeRate,
    },
    toEntry: {
      id,
      date,
      description: `Transfer from ${fromAccountName}`,
      amount: transferInAmount,
      type: 'transfer',
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      exchangeRate: normalizedExchangeRate,
    },
  };
};

export const isCanonicalTransferOut = (transaction: Transaction): boolean =>
  transaction.type === 'transfer' && transaction.amount < 0;
