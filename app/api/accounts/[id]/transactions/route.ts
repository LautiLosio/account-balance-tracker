import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { appendTransaction, transferBetweenAccounts } from '@/lib/db';
import { Transaction } from '@/types/schema';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

// POST handler to add a transaction to an account
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const accountId = Number.parseInt(params.id, 10);

    if (Number.isNaN(accountId)) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const { transaction, toAccountId, exchangeRate } = await req.json() as {
      transaction: Transaction;
      toAccountId?: number;
      exchangeRate?: number;
    };

    if (!transaction) {
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }

    if (transaction.type === 'transfer') {
      if (!toAccountId || toAccountId === accountId || transaction.amount <= 0) {
        return NextResponse.json({ error: 'Invalid transfer payload' }, { status: 400 });
      }

      const transferResult = await transferBetweenAccounts(
        userId,
        accountId,
        toAccountId,
        transaction.amount,
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

    const success = await appendTransaction(userId, accountId, {
      ...transaction,
      fromAccount: accountId,
      date: new Date(transaction.date)
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
