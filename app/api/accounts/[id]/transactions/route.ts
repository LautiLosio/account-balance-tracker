import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { addTransaction, addTransferTransaction, getAccount } from '@/lib/db';
import { Transaction } from '@/types/schema';

// POST handler to add a transaction to an account
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const accountId = parseInt(params.id);

    if (isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const { transaction, toAccountId, exchangeRate } = await req.json() as {
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

    let success = false;

    if (transaction.type === 'transfer') {
      if (!toAccountId || !Number.isInteger(toAccountId)) {
        return NextResponse.json({ error: 'Transfer requires a destination account' }, { status: 400 });
      }

      if (toAccountId === accountId) {
        return NextResponse.json({ error: 'Transfer destination must be different from source account' }, { status: 400 });
      }

      if (transaction.amount >= 0) {
        return NextResponse.json({ error: 'Transfer source amount must be negative' }, { status: 400 });
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

      success = await addTransferTransaction(
        userId,
        accountId,
        toAccountId,
        Math.abs(transaction.amount),
        exchangeRate
      );
    } else {
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

      success = await addTransaction(userId, accountId, {
        ...transaction,
        fromAccount: accountId,
        date: new Date(transaction.date),
      });
    }

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
