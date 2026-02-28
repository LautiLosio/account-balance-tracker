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
  type: 'income' | 'expense' | 'transfer';
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
