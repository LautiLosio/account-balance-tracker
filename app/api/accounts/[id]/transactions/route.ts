import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { addTransaction, addTransferTransaction, softDeleteTransaction, updateTransaction } from '@/lib/db';
import { Transaction } from '@/types/schema';

function parseAccountId(rawId: string) {
  const accountId = parseInt(rawId, 10);
  if (isNaN(accountId)) {
    return { error: NextResponse.json({ error: 'Invalid account ID' }, { status: 400 }) };
  }
  return { accountId };
}

// POST handler to add a transaction to an account
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = parseAccountId(params.id);
    if (parsed.error) return parsed.error;

    const { transaction, toAccountId, exchangeRate } = await req.json() as {
      transaction: Transaction;
      toAccountId?: number;
      exchangeRate?: number;
    };

    if (!transaction) {
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }

    const userId = session.user.sub;
    const result = transaction.type === 'transfer' && toAccountId
      ? await addTransferTransaction(userId, parsed.accountId!, toAccountId, Math.abs(transaction.amount), exchangeRate)
      : await addTransaction(userId, parsed.accountId!, {
          ...transaction,
          fromAccount: parsed.accountId!,
          date: new Date(transaction.date)
        });

    if (result.success) {
      return NextResponse.json({ success: true });
    }

    const status = result.error?.includes('Insufficient funds') ? 400 : 500;
    return NextResponse.json({ error: result.error || 'Failed to add transaction' }, { status });
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT handler to edit a transaction
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = parseAccountId(params.id);
    if (parsed.error) return parsed.error;

    const { transactionId, updates } = await req.json() as {
      transactionId: number;
      updates: Pick<Transaction, 'description' | 'amount' | 'date'> & { exchangeRate?: number };
    };

    if (!transactionId || !updates) {
      return NextResponse.json({ error: 'Invalid transaction update payload' }, { status: 400 });
    }

    const result = await updateTransaction(session.user.sub, parsed.accountId!, transactionId, {
      ...updates,
      date: new Date(updates.date)
    });

    if (result.success) {
      return NextResponse.json({ success: true });
    }

    const status = result.error?.includes('Insufficient funds') ? 400 : 500;
    return NextResponse.json({ error: result.error || 'Failed to update transaction' }, { status });
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE handler to soft-delete a transaction
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const parsed = parseAccountId(params.id);
    if (parsed.error) return parsed.error;

    const { transactionId } = await req.json() as { transactionId: number };
    if (!transactionId) {
      return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
    }

    const result = await softDeleteTransaction(session.user.sub, parsed.accountId!, transactionId);
    if (result.success) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.error || 'Failed to delete transaction' }, { status: 500 });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
