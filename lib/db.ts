import { kv } from '@vercel/kv';
import { Account, Transaction } from '@/types/schema';

export interface OperationResult {
  success: boolean;
  error?: string;
}

function getActiveTransactions(account: Account) {
  return account.transactions.filter(transaction => !transaction.isDeleted);
}

function recalculateBalances(accounts: Account[]) {
  accounts.forEach(account => {
    const movement = getActiveTransactions(account).reduce((total, transaction) => total + transaction.amount, 0);
    account.currentBalance = account.initialBalance + movement;
  });
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
      return false;
    }

    return await saveUserAccounts(userId, updatedAccounts);
  } catch (error) {
    console.error('Error deleting account:', error);
    return false;
  }
}

// Transaction operations
export async function addTransaction(userId: string, accountId: number, transaction: Transaction): Promise<OperationResult> {
  try {
    const account = await getAccount(userId, accountId);
    if (!account) return { success: false, error: 'Account not found' };

    const amount = Math.abs(transaction.amount);
    if (transaction.type === 'expense' && account.currentBalance < amount) {
      return { success: false, error: 'Insufficient funds for this expense.' };
    }

    account.transactions.push({
      ...transaction,
      amount: transaction.type === 'expense' ? -amount : amount,
      isDeleted: false,
      updatedAt: new Date()
    });

    recalculateBalances([account]);

    const saved = await saveAccount(userId, account);
    return { success: saved, error: saved ? undefined : 'Failed to save transaction' };
  } catch (error) {
    console.error('Error adding transaction:', error);
    return { success: false, error: 'Internal error while adding transaction' };
  }
}

export async function addTransferTransaction(
  userId: string,
  fromAccountId: number,
  toAccountId: number,
  amount: number,
  exchangeRate?: number
): Promise<OperationResult> {
  try {
    const accounts = await getUserAccounts(userId);
    const fromAccount = accounts.find(account => account.id === fromAccountId);
    const toAccount = accounts.find(account => account.id === toAccountId);

    if (!fromAccount || !toAccount) {
      return { success: false, error: 'Account not found' };
    }

    if (fromAccount.currentBalance < amount) {
      return { success: false, error: 'Insufficient funds for this transfer.' };
    }

    const transactionId = Date.now();
    const now = new Date();

    let toAmount = amount;
    if (exchangeRate && (fromAccount.isForeignCurrency || toAccount.isForeignCurrency)) {
      toAmount = fromAccount.isForeignCurrency ? amount * exchangeRate : amount / exchangeRate;
    }

    const fromTransaction: Transaction = {
      id: transactionId,
      date: now,
      description: `Transfer to ${toAccount.name}`,
      amount: -amount,
      type: 'transfer',
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      exchangeRate,
      isDeleted: false,
      updatedAt: now
    };

    const toTransaction: Transaction = {
      id: transactionId,
      date: now,
      description: `Transfer from ${fromAccount.name}`,
      amount: toAmount,
      type: 'transfer',
      fromAccount: fromAccountId,
      toAccount: toAccountId,
      exchangeRate,
      isDeleted: false,
      updatedAt: now
    };

    fromAccount.transactions.push(fromTransaction);
    toAccount.transactions.push(toTransaction);
    recalculateBalances(accounts);

    const saved = await saveUserAccounts(userId, accounts);
    return { success: saved, error: saved ? undefined : 'Failed to save transfer' };
  } catch (error) {
    console.error('Error adding transfer transaction:', error);
    return { success: false, error: 'Internal error while adding transfer' };
  }
}

export async function updateTransaction(
  userId: string,
  accountId: number,
  transactionId: number,
  updates: Pick<Transaction, 'description' | 'amount' | 'date'> & { exchangeRate?: number }
): Promise<OperationResult> {
  try {
    const accounts = await getUserAccounts(userId);
    const account = accounts.find(item => item.id === accountId);

    if (!account) return { success: false, error: 'Account not found' };

    const transaction = account.transactions.find(item => item.id === transactionId);
    if (!transaction || transaction.isDeleted) return { success: false, error: 'Transaction not found' };

    const nextDate = new Date(updates.date);
    const nextDescription = updates.description.trim() || transaction.description;

    if (transaction.type === 'transfer') {
      const sourceAccount = accounts.find(item => item.id === transaction.fromAccount);
      const destinationAccount = transaction.toAccount ? accounts.find(item => item.id === transaction.toAccount) : null;
      if (!sourceAccount || !destinationAccount) {
        return { success: false, error: 'Transfer accounts could not be resolved' };
      }

      const sourceEntry = sourceAccount.transactions.find(item => item.id === transactionId && item.type === 'transfer' && !item.isDeleted);
      const destinationEntry = destinationAccount.transactions.find(item => item.id === transactionId && item.type === 'transfer' && !item.isDeleted);
      if (!sourceEntry || !destinationEntry) {
        return { success: false, error: 'Transfer transaction could not be resolved' };
      }

      const nextAmount = Math.abs(updates.amount);
      const sourceBalanceWithoutTransaction = sourceAccount.currentBalance - sourceEntry.amount;
      if (sourceBalanceWithoutTransaction < nextAmount) {
        return { success: false, error: 'Insufficient funds for this transfer.' };
      }

      const nextExchangeRate = updates.exchangeRate ?? sourceEntry.exchangeRate ?? destinationEntry.exchangeRate;
      let destinationAmount = nextAmount;
      if (nextExchangeRate && (sourceAccount.isForeignCurrency || destinationAccount.isForeignCurrency)) {
        destinationAmount = sourceAccount.isForeignCurrency ? nextAmount * nextExchangeRate : nextAmount / nextExchangeRate;
      }

      sourceEntry.amount = -nextAmount;
      sourceEntry.date = nextDate;
      sourceEntry.description = nextDescription;
      sourceEntry.exchangeRate = nextExchangeRate;
      sourceEntry.updatedAt = new Date();

      destinationEntry.amount = destinationAmount;
      destinationEntry.date = nextDate;
      destinationEntry.description = nextDescription;
      destinationEntry.exchangeRate = nextExchangeRate;
      destinationEntry.updatedAt = new Date();
    } else {
      const nextAmount = transaction.type === 'expense' ? -Math.abs(updates.amount) : Math.abs(updates.amount);
      const accountBalanceWithoutTransaction = account.currentBalance - transaction.amount;
      if (transaction.type === 'expense' && accountBalanceWithoutTransaction < Math.abs(nextAmount)) {
        return { success: false, error: 'Insufficient funds for this expense.' };
      }

      transaction.amount = nextAmount;
      transaction.date = nextDate;
      transaction.description = nextDescription;
      transaction.updatedAt = new Date();
    }

    recalculateBalances(accounts);
    const saved = await saveUserAccounts(userId, accounts);
    return { success: saved, error: saved ? undefined : 'Failed to update transaction' };
  } catch (error) {
    console.error('Error updating transaction:', error);
    return { success: false, error: 'Internal error while updating transaction' };
  }
}

export async function softDeleteTransaction(
  userId: string,
  accountId: number,
  transactionId: number
): Promise<OperationResult> {
  try {
    const accounts = await getUserAccounts(userId);
    const account = accounts.find(item => item.id === accountId);
    if (!account) return { success: false, error: 'Account not found' };

    const target = account.transactions.find(item => item.id === transactionId);
    if (!target || target.isDeleted) return { success: false, error: 'Transaction not found' };

    const now = new Date();
    if (target.type === 'transfer') {
      accounts.forEach(item => {
        item.transactions.forEach(transaction => {
          if (transaction.id === transactionId && transaction.type === 'transfer') {
            transaction.isDeleted = true;
            transaction.deletedAt = now;
            transaction.updatedAt = now;
          }
        });
      });
    } else {
      target.isDeleted = true;
      target.deletedAt = now;
      target.updatedAt = now;
    }

    recalculateBalances(accounts);
    const saved = await saveUserAccounts(userId, accounts);
    return { success: saved, error: saved ? undefined : 'Failed to delete transaction' };
  } catch (error) {
    console.error('Error soft deleting transaction:', error);
    return { success: false, error: 'Internal error while deleting transaction' };
  }
}
