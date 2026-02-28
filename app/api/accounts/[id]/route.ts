import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getAccount, saveAccount, deleteAccount } from '@/lib/db';
import { Account } from '@/types/schema';

// GET handler to fetch a specific account
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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

    const account = await getAccount(userId, accountId);

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT handler to update a specific account
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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

    const { account } = await req.json() as { account: Account };

    if (!account || account.id !== accountId) {
      return NextResponse.json({ error: 'Invalid account data' }, { status: 400 });
    }

    const success = await saveAccount(userId, account);

    if (success) {
      return NextResponse.json({ success: true, account });
    } else {
      return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE handler to delete a specific account
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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

    const success = await deleteAccount(userId, accountId);

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Account not found or could not be deleted' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
