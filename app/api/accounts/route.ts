import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { createAccount, getUserAccounts } from '@/lib/db';
import { Account } from '@/types/schema';

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

// POST handler to create an account for the authenticated user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();

    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.sub;
    const { account } = await req.json() as { account: Account };

    if (!account) {
      return NextResponse.json({ error: 'Invalid account data' }, { status: 400 });
    }

    const success = await createAccount(userId, account);

    if (!success) {
      return NextResponse.json({ error: 'Account already exists or could not be created' }, { status: 409 });
    }

    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
