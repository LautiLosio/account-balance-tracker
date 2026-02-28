import { getSession } from '@auth0/nextjs-auth0';
import { getAccount, getUserAccounts } from '@/lib/db';
import { Account } from '@/types/schema';

export interface SessionUserSummary {
  name?: string;
  email?: string;
  picture?: string;
}

export async function getAuthenticatedUser() {
  try {
    const session = await getSession();
    return session?.user;
  } catch (error) {
    console.error('Failed to read session:', error);
    return null;
  }
}

export async function getInitialAccounts(): Promise<Account[]> {
  const user = await getAuthenticatedUser();
  if (!user?.sub) {
    return [];
  }

  return getUserAccounts(user.sub);
}

export async function getInitialAccountById(accountId: number): Promise<Account | null> {
  const user = await getAuthenticatedUser();
  if (!user?.sub) {
    return null;
  }

  return getAccount(user.sub, accountId);
}
