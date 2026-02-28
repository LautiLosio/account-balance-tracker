import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';
import { deleteAllUserData } from '@/lib/db';
import { validateServerEnv } from '@/lib/env';

validateServerEnv();

export async function DELETE() {
  try {
    const session = await auth0.getSession();

    if (!session?.user?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteAllUserData(session.user.sub);
    if (!success) {
      return NextResponse.json({ error: 'Could not delete user data' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
