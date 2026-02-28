import { kv } from '@vercel/kv';
import { Account, Transaction } from '@/types/schema';

interface NewAccountInput {
  name: string;
  initialBalance: number;
  isForeignCurrency: boolean;
}

interface NewTransactionInput {
  date: Date;
  description: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  fromAccount: string;
  toAccount?: string;
  exchangeRate?: number;
}

// User accounts operations
export async function getUserAccounts(userId: string): Promise<Account[]> {
  try {
    const accounts = await kv.get<Account[]>(`user:${userId}:accounts`);
    return accounts || [];
  } catch (error) {
    console.error('Error fetching user accounts:', error);
    return [];
  }
}

export async function saveUserAccounts(userId: string, accounts: Account[]): Promise<boolean> {
  try {
    await kv.set(`user:${userId}:accounts`, accounts);
    return true;
  } catch (error) {
    console.error('Error saving user accounts:', error);
    return false;
  }
}

// Individual account operations
export async function getAccount(userId: string, accountId: string): Promise<Account | null> {
  try {
    const accounts = await getUserAccounts(userId);
    return accounts.find(account => account.id === accountId) || null;
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}

export async function createAccount(userId: string, accountData: NewAccountInput): Promise<Account | null> {
  try {
    const accounts = await getUserAccounts(userId);
    const newAccount: Account = {
      id: crypto.randomUUID(),
      name: accountData.name,
      initialBalance: accountData.initialBalance,
      currentBalance: accountData.initialBalance,
      isForeignCurrency: accountData.isForeignCurrency,
      transactions: [],
    };

    accounts.push(newAccount);
    const success = await saveUserAccounts(userId, accounts);
    return success ? newAccount : null;
  } catch (error) {
    console.error('Error creating account:', error);
    return null;
  }
}

export async function saveAccount(userId: string, account: Account): Promise<boolean> {
  try {
    const accounts = await getUserAccounts(userId);
    const existingIndex = accounts.findIndex(a => a.id === account.id);

    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }

    return await saveUserAccounts(userId, accounts);
  } catch (error) {
    console.error('Error saving account:', error);
    return false;
  }
}

export async function deleteAccount(userId: string, accountId: string): Promise<boolean> {
  try {
    const accounts = await getUserAccounts(userId);
    const updatedAccounts = accounts.filter(account => account.id !== accountId);

    if (accounts.length === updatedAccounts.length) {
      return false; // No account was deleted
    }

    return await saveUserAccounts(userId, updatedAccounts);
  } catch (error) {
    console.error('Error deleting account:', error);
    return false;
  }
}

// Transaction operations
export async function addTransaction(userId: string, accountId: string, transactionData: NewTransactionInput): Promise<Transaction | null> {
  try {
    const account = await getAccount(userId, accountId);
    if (!account) return null;

    const transaction: Transaction = {
      ...transactionData,
      id: crypto.randomUUID(),
    };

    account.transactions.push(transaction);

    // Update account balance
    if (transaction.type === 'income' || transaction.type === 'expense') {
      // For both income and expense, we directly add the amount to the balance
      // Income amounts are positive, expense amounts are negative
      account.currentBalance += transaction.amount;
    }

    const saved = await saveAccount(userId, account);
    return saved ? transaction : null;
  } catch (error) {
    console.error('Error adding transaction:', error);
    return null;
  }
}

export async function addTransferTransaction(
  userId: string,
  fromAccountId: string,
  toAccountId: string,
  amount: number,
  exchangeRate?: number
): Promise<{ fromTransaction: Transaction; toTransaction: Transaction } | null> {
  try {
    const fromAccount = await getAccount(userId, fromAccountId);
    const toAccount = await getAccount(userId, toAccountId);

    if (!fromAccount || !toAccount) return null;

    // Calculate transfer amount with exchange rate if applicable
    let toAmount = amount;
    if (exchangeRate && (fromAccount.isForeignCurrency || toAccount.isForeignCurrency)) {
      toAmount = fromAccount.isForeignCurrency ? amount * exchangeRate : amount / exchangeRate;
    }

    const transferId = crypto.randomUUID();

    // Create transaction for source account
    const fromTransaction: Transaction = {
      id: transferId,
      date: new Date(),
      description: `Transfer to ${toAccount.name}`,
      amount: amount,
      type: 'transfer',
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      exchangeRate,
    };

    // Create transaction for destination account
    const toTransaction: Transaction = {
      id: transferId,
      date: new Date(),
      description: `Transfer from ${fromAccount.name}`,
      amount: toAmount,
      type: 'transfer',
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      exchangeRate,
    };

    // Update balances
    fromAccount.currentBalance -= amount;
    toAccount.currentBalance += toAmount;

    // Add transactions to accounts
    fromAccount.transactions.push(fromTransaction);
    toAccount.transactions.push(toTransaction);

    // Save both accounts
    const fromSaved = await saveAccount(userId, fromAccount);
    const toSaved = await saveAccount(userId, toAccount);

    return fromSaved && toSaved ? { fromTransaction, toTransaction } : null;
  } catch (error) {
    console.error('Error adding transfer transaction:', error);
    return null;
  }
}
