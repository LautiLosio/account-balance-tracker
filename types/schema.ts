// Define the Account type
export interface Account {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  isForeignCurrency: boolean;
  transactions: Transaction[];
}

// Define the Transaction type
export interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  fromAccount: string;
  toAccount?: string;
  exchangeRate?: number;
}

// Define the User type (for future use)
export interface User {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  accounts: Account[];
}
