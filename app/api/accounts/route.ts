import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@auth0/nextjs-auth0';
import { getUserAccounts, saveUserAccounts } from '@/lib/db';
import { Account } from '@/types/schema';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

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

// POST handler to create or update accounts for the authenticated user
export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    
    // Check if user is authenticated
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.sub;
    const { accounts } = await req.json() as { accounts: Account[] };
    
    if (!accounts || !Array.isArray(accounts)) {
      return NextResponse.json({ error: 'Invalid accounts data' }, { status: 400 });
    }
    
    const success = await saveUserAccounts(userId, accounts);
    
    if (success) {
      return NextResponse.json({ success: true, accounts });
    } else {
      return NextResponse.json({ error: 'Failed to save accounts' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error saving accounts:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}