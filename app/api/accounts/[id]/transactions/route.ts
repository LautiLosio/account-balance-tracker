import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { addTransaction, addTransferTransaction } from '@/lib/db';
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
    
    if (!transaction) {
      return NextResponse.json({ error: 'Invalid transaction data' }, { status: 400 });
    }
    
    let success = false;
    
    // Handle transfer transactions
    if (transaction.type === 'transfer' && toAccountId) {
      success = await addTransferTransaction(
        userId,
        accountId,
        toAccountId,
        transaction.amount,
        exchangeRate
      );
    } else {
      // Handle regular transactions
      success = await addTransaction(userId, accountId, {
        ...transaction,
        fromAccount: accountId,
        date: new Date(transaction.date) // Ensure date is a Date object
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