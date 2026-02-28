import { kv } from '@vercel/kv';
import { Account, Transaction } from '@/types/schema';
import { buildTransferEntries, toCanonicalAmount } from '@/lib/transactions';

type AccountMeta = Omit<Account, 'transactions'>;

type TransferResult = {
  success: boolean;
  error?: 'ACCOUNT_NOT_FOUND' | 'INSUFFICIENT_FUNDS';
};

const userAccountIdsKey = (userId: string) => `user:${userId}:accounts:ids`;
const userAccountMetaKey = (userId: string, accountId: number) => `user:${userId}:account:${accountId}:meta`;
const userAccountTransactionsKey = (userId: string, accountId: number) => `user:${userId}:account:${accountId}:transactions`;
const legacyUserAccountsKey = (userId: string) => `user:${userId}:accounts`;

function toAccountMeta(account: Account): AccountMeta {
  return {
    id: account.id,
    name: account.name,
    initialBalance: account.initialBalance,
    currentBalance: account.currentBalance,
    isForeignCurrency: account.isForeignCurrency,
  };
}

async function migrateLegacyAccounts(userId: string): Promise<Account[]> {
  const legacyAccounts = await kv.get<Account[]>(legacyUserAccountsKey(userId));
  if (!legacyAccounts?.length) {
    return [];
  }

  const pipeline = kv.multi();

  for (const account of legacyAccounts) {
    pipeline.sadd(userAccountIdsKey(userId), account.id.toString());
    pipeline.set(userAccountMetaKey(userId, account.id), toAccountMeta(account));
    pipeline.del(userAccountTransactionsKey(userId, account.id));

    for (const transaction of account.transactions ?? []) {
      pipeline.rpush(userAccountTransactionsKey(userId, account.id), transaction);
    }
  }

  pipeline.del(legacyUserAccountsKey(userId));
  await pipeline.exec();

  return legacyAccounts;
}

async function getAccountMeta(userId: string, accountId: number): Promise<AccountMeta | null> {
  const account = await kv.get<AccountMeta>(userAccountMetaKey(userId, accountId));
  return account || null;
}

async function getAccountTransactions(userId: string, accountId: number): Promise<Transaction[]> {
  const transactions = await kv.lrange<Transaction[]>(userAccountTransactionsKey(userId, accountId), 0, -1);
  return transactions || [];
}

// User accounts operations
export async function getUserAccounts(userId: string): Promise<Account[]> {
  try {
    const accountIds = await kv.smembers<string[]>(userAccountIdsKey(userId));

    if (!accountIds?.length) {
      return await migrateLegacyAccounts(userId);
    }

    const sortedIds = accountIds
      .map(id => Number.parseInt(id, 10))
      .filter(id => !Number.isNaN(id))
      .sort((a, b) => a - b);

    const accounts = await Promise.all(
      sortedIds.map(async (accountId) => {
        const [meta, transactions] = await Promise.all([
          getAccountMeta(userId, accountId),
          getAccountTransactions(userId, accountId),
        ]);

        if (!meta) {
          return null;
        }

        return {
          ...meta,
          transactions,
        } satisfies Account;
      })
    );

    return accounts.filter((account): account is Account => account !== null);
  } catch (error) {
    console.error('Error fetching user accounts:', error);
    return [];
  }
}

// Individual account operations
export async function getAccount(userId: string, accountId: number): Promise<Account | null> {
  try {
    const [meta, transactions] = await Promise.all([
      getAccountMeta(userId, accountId),
      getAccountTransactions(userId, accountId),
    ]);

    if (!meta) {
      return null;
    }

    return {
      ...meta,
      transactions,
    };
  } catch (error) {
    console.error('Error fetching account:', error);
    return null;
  }
}

export async function createAccount(userId: string, account: Account): Promise<boolean> {
  try {
    const exists = await kv.sismember(userAccountIdsKey(userId), account.id.toString());
    if (exists) {
      return false;
    }

    const pipeline = kv.multi();
    pipeline.sadd(userAccountIdsKey(userId), account.id.toString());
    pipeline.set(userAccountMetaKey(userId, account.id), toAccountMeta(account));
    pipeline.del(userAccountTransactionsKey(userId, account.id));

    for (const transaction of account.transactions ?? []) {
      pipeline.rpush(userAccountTransactionsKey(userId, account.id), transaction);
    }

    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Error creating account:', error);
    return false;
  }
}

export async function updateAccount(userId: string, account: Account): Promise<boolean> {
  try {
    const exists = await kv.sismember(userAccountIdsKey(userId), account.id.toString());
    if (!exists) {
      return false;
    }

    await kv.set(userAccountMetaKey(userId, account.id), toAccountMeta(account));
    return true;
  } catch (error) {
    console.error('Error updating account:', error);
    return false;
  }
}

export async function deleteAccount(userId: string, accountId: number): Promise<boolean> {
  try {
    const exists = await kv.sismember(userAccountIdsKey(userId), accountId.toString());
    if (!exists) {
      return false;
    }

    const pipeline = kv.multi();
    pipeline.srem(userAccountIdsKey(userId), accountId.toString());
    pipeline.del(userAccountMetaKey(userId, accountId));
    pipeline.del(userAccountTransactionsKey(userId, accountId));
    await pipeline.exec();
    return true;
  } catch (error) {
    console.error('Error deleting account:', error);
    return false;
  }
}

export async function appendTransaction(userId: string, accountId: number, transaction: Transaction): Promise<boolean> {
  try {
    const accountMeta = await getAccountMeta(userId, accountId);
    if (!accountMeta) {
      return false;
    }

    const canonicalAmount =
      transaction.type === 'income' || transaction.type === 'expense'
        ? toCanonicalAmount(transaction.type, transaction.amount)
        : transaction.amount;

    const balanceDelta = transaction.type === 'transfer' ? 0 : canonicalAmount;
    const updatedMeta: AccountMeta = {
      ...accountMeta,
      currentBalance: accountMeta.currentBalance + balanceDelta,
    };

    const normalizedTransaction: Transaction = {
      ...transaction,
      amount: canonicalAmount,
      date: new Date(transaction.date),
      fromAccount: transaction.fromAccount ?? accountId,
    };

    const pipeline = kv.multi();
    pipeline.set(userAccountMetaKey(userId, accountId), updatedMeta);
    pipeline.rpush(userAccountTransactionsKey(userId, accountId), normalizedTransaction);
    await pipeline.exec();

    return true;
  } catch (error) {
    console.error('Error appending transaction:', error);
    return false;
  }
}

export async function transferBetweenAccounts(
  userId: string,
  fromAccountId: number,
  toAccountId: number,
  amount: number,
  exchangeRate?: number
): Promise<TransferResult> {
  try {
    const [fromAccount, toAccount] = await Promise.all([
      getAccountMeta(userId, fromAccountId),
      getAccountMeta(userId, toAccountId),
    ]);

    if (!fromAccount || !toAccount) {
      return { success: false, error: 'ACCOUNT_NOT_FOUND' };
    }

    const normalizedAmount = Math.abs(amount);
    if (fromAccount.currentBalance < normalizedAmount) {
      return { success: false, error: 'INSUFFICIENT_FUNDS' };
    }

    const { fromEntry, toEntry } = buildTransferEntries({
      id: Date.now(),
      date: new Date(),
      fromAccountId,
      toAccountId,
      fromAccountName: fromAccount.name,
      toAccountName: toAccount.name,
      sourceAmount: normalizedAmount,
      fromAccountIsForeign: fromAccount.isForeignCurrency,
      toAccountIsForeign: toAccount.isForeignCurrency,
      exchangeRate,
    });

    const pipeline = kv.multi();
    pipeline.set(userAccountMetaKey(userId, fromAccountId), {
      ...fromAccount,
      currentBalance: fromAccount.currentBalance + fromEntry.amount,
    });
    pipeline.set(userAccountMetaKey(userId, toAccountId), {
      ...toAccount,
      currentBalance: toAccount.currentBalance + toEntry.amount,
    });
    pipeline.rpush(userAccountTransactionsKey(userId, fromAccountId), fromEntry);
    pipeline.rpush(userAccountTransactionsKey(userId, toAccountId), toEntry);
    await pipeline.exec();

    return { success: true };
  } catch (error) {
    console.error('Error transferring between accounts:', error);
    return { success: false };
  }
}
