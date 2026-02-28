import { NextRequest, NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { appendTransaction, getAccount, transferBetweenAccounts } from '@/lib/db';
import { Transaction } from '@/types/schema';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

// POST handler to add a transaction to an account
export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth0.getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const { id } = await context.params;
    const accountId = Number.parseInt(id, 10);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const { transaction, toAccountId, exchangeRate } = (await req.json()) as {
      transaction: Transaction;
      toAccountId?: number;
      exchangeRate?: number;
    };

    if (!transaction || !transaction.type || !Number.isFinite(transaction.amount)) {
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }

    const fromAccount = await getAccount(userId, accountId);
    if (!fromAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    if (transaction.type === 'transfer') {
      if (!toAccountId || !Number.isInteger(toAccountId)) {
        return NextResponse.json({ error: 'Transfer requires a destination account' }, { status: 400 });
      }

      if (toAccountId === accountId) {
        return NextResponse.json({ error: 'Transfer destination must be different from source account' }, { status: 400 });
      }

      if (transaction.amount === 0) {
        return NextResponse.json({ error: 'Transfer amount cannot be zero' }, { status: 400 });
      }

      if (transaction.fromAccount && transaction.fromAccount !== accountId) {
        return NextResponse.json({ error: 'Transfer source account mismatch' }, { status: 400 });
      }

      if (transaction.toAccount && transaction.toAccount !== toAccountId) {
        return NextResponse.json({ error: 'Transfer destination account mismatch' }, { status: 400 });
      }

      const destinationAccount = await getAccount(userId, toAccountId);
      if (!destinationAccount) {
        return NextResponse.json({ error: 'Destination account not found' }, { status: 404 });
      }

      const isCrossCurrency = fromAccount.isForeignCurrency || destinationAccount.isForeignCurrency;
      if (isCrossCurrency && (!exchangeRate || exchangeRate <= 0)) {
        return NextResponse.json({ error: 'Cross-currency transfer requires a positive exchange rate' }, { status: 400 });
      }

      if (!isCrossCurrency && exchangeRate !== undefined && exchangeRate <= 0) {
        return NextResponse.json({ error: 'Exchange rate must be positive' }, { status: 400 });
      }

      const transferResult = await transferBetweenAccounts(
        userId,
        accountId,
        toAccountId,
        Math.abs(transaction.amount),
        exchangeRate
      );

      if (!transferResult.success) {
        if (transferResult.error === 'ACCOUNT_NOT_FOUND') {
          return NextResponse.json({ error: 'One or more accounts do not exist' }, { status: 404 });
        }

        if (transferResult.error === 'INSUFFICIENT_FUNDS') {
          return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
        }

        return NextResponse.json({ error: 'Failed to process transfer' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    if (toAccountId !== undefined) {
      return NextResponse.json({ error: 'Only transfers may include destination account' }, { status: 400 });
    }

    if (exchangeRate !== undefined) {
      return NextResponse.json({ error: 'Only transfers may include exchange rate' }, { status: 400 });
    }

    if (transaction.type === 'income' && transaction.amount <= 0) {
      return NextResponse.json({ error: 'Income amount must be positive' }, { status: 400 });
    }

    if (transaction.type === 'expense' && transaction.amount >= 0) {
      return NextResponse.json({ error: 'Expense amount must be negative' }, { status: 400 });
    }

    const success = await appendTransaction(userId, accountId, {
      ...transaction,
      fromAccount: accountId,
      date: new Date(transaction.date),
    });

    if (!success) {
      return NextResponse.json({ error: 'Account not found or transaction could not be added' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
