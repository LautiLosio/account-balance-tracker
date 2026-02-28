import { kv } from '@vercel/kv';
import { Account, Transaction } from '@/types/schema';
import { buildTransferEntries, toCanonicalAmount } from '@/lib/transactions';

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
export async function getAccount(userId: string, accountId: number): Promise<Account | null> {
  try {
    const accounts = await getUserAccounts(userId);
    return accounts.find(account => account.id === accountId) || null;
  } catch (error) {
    console.error('Error fetching account:', error);
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

export async function deleteAccount(userId: string, accountId: number): Promise<boolean> {
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
export async function addTransaction(userId: string, accountId: number, transaction: Transaction): Promise<boolean> {
  try {
    const account = await getAccount(userId, accountId);
    if (!account) return false;

    if (transaction.type === 'income' || transaction.type === 'expense') {
      transaction.amount = toCanonicalAmount(transaction.type, transaction.amount);
      account.currentBalance += transaction.amount;
    }

    account.transactions.push(transaction);

    return await saveAccount(userId, account);
  } catch (error) {
    console.error('Error adding transaction:', error);
    return false;
  }
}

export async function addTransferTransaction(
  userId: string,
  fromAccountId: number,
  toAccountId: number,
  amount: number,
  exchangeRate?: number
): Promise<boolean> {
  try {
    const fromAccount = await getAccount(userId, fromAccountId);
    const toAccount = await getAccount(userId, toAccountId);

    if (!fromAccount || !toAccount) return false;

    const { fromEntry, toEntry } = buildTransferEntries({
      id: Date.now(),
      date: new Date(),
      fromAccountId,
      toAccountId,
      fromAccountName: fromAccount.name,
      toAccountName: toAccount.name,
      sourceAmount: amount,
      fromAccountIsForeign: fromAccount.isForeignCurrency,
      toAccountIsForeign: toAccount.isForeignCurrency,
      exchangeRate,
    });

    fromAccount.currentBalance += fromEntry.amount;
    toAccount.currentBalance += toEntry.amount;

    fromAccount.transactions.push(fromEntry);
    toAccount.transactions.push(toEntry);

    const fromSaved = await saveAccount(userId, fromAccount);
    const toSaved = await saveAccount(userId, toAccount);

    return fromSaved && toSaved;
  } catch (error) {
    console.error('Error adding transfer transaction:', error);
    return false;
  }
}
