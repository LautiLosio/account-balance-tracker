import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createAccount, getUserAccounts, saveUserAccounts } from '@/lib/db';
import { Account } from '@/types/schema';

interface CreateAccountBody {
  name: string;
  initialBalance: number;
  isForeignCurrency: boolean;
}

// GET handler to fetch all accounts for the authenticated user
export async function GET() {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const accounts = await getUserAccounts(userId);

    return NextResponse.json({ accounts });
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST handler supports account creation and bulk account replace (for import)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const body = await req.json() as { account?: CreateAccountBody; accounts?: Account[] };

    if (body.account) {
      const { name, initialBalance, isForeignCurrency } = body.account;

      if (!name || typeof initialBalance !== 'number' || typeof isForeignCurrency !== 'boolean') {
        return NextResponse.json({ error: 'Invalid account data' }, { status: 400 });
      }

      const account = await createAccount(userId, { name, initialBalance, isForeignCurrency });
      if (!account) {
        return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
      }

      return NextResponse.json({ success: true, account }, { status: 201 });
    }

    if (body.accounts && Array.isArray(body.accounts)) {
      const success = await saveUserAccounts(userId, body.accounts);
      if (!success) {
        return NextResponse.json({ error: 'Failed to save accounts' }, { status: 500 });
      }
      return NextResponse.json({ success: true, accounts: body.accounts });
    }

    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  } catch (error) {
    console.error('Error saving accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
