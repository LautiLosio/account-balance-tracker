import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { addTransaction, addTransferTransaction } from '@/lib/db';

interface TransactionRequestBody {
  transaction: {
    date: string | Date;
    description: string;
    amount: number;
    type: 'income' | 'expense' | 'transfer';
  };
  toAccountId?: string;
  exchangeRate?: number;
}

// POST handler to add a transaction to an account
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const accountId = params.id;

    if (!accountId) {
      return NextResponse.json({ error: 'Invalid account ID' }, { status: 400 });
    }

    const { transaction, toAccountId, exchangeRate } = await req.json() as TransactionRequestBody;

    if (!transaction) {
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }

    // Handle transfer transactions
    if (transaction.type === 'transfer' && toAccountId) {
      const transferResult = await addTransferTransaction(
        userId,
        accountId,
        toAccountId,
        transaction.amount,
        exchangeRate
      );

      if (!transferResult) {
        return NextResponse.json({ error: 'Failed to add transfer transaction' }, { status: 500 });
      }

      return NextResponse.json({ success: true, ...transferResult }, { status: 201 });
    }

    // Handle regular transactions
    const createdTransaction = await addTransaction(userId, accountId, {
      ...transaction,
      fromAccount: accountId,
      date: new Date(transaction.date), // Ensure date is a Date object
    });

    if (!createdTransaction) {
      return NextResponse.json({ error: 'Failed to add transaction' }, { status: 500 });
    }

    return NextResponse.json({ success: true, transaction: createdTransaction }, { status: 201 });
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
