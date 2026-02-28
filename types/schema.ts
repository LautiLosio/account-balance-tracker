export type TransactionType = 'income' | 'expense' | 'transfer';

export const TRANSACTION_CANONICAL_RULES = {
  income: 'Income entries are always stored as positive amounts.',
  expense: 'Expense entries are always stored as negative amounts.',
  transferOut: 'Transfer-out entries are always negative on the source account ledger.',
  transferIn: 'Transfer-in entries are always positive on the destination account ledger.',
} as const;

// Define the Account type
export interface Account {
  id: number;
  name: string;
  initialBalance: number;
  currentBalance: number;
  isForeignCurrency: boolean;
  transactions: Transaction[];
}

// Define the Transaction type
export interface Transaction {
  id: number;
  date: Date;
  description: string;
  amount: number;
  type: TransactionType;
  fromAccount: number;
  toAccount?: number;
  exchangeRate?: number;
  isDeleted?: boolean;
  deletedAt?: Date;
  updatedAt?: Date;
}

// Define the User type (for future use)
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  accounts: Account[];
}
