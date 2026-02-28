import { cache } from 'react';
import { auth0 } from '@/lib/auth0';
import { getAccount, getUserAccounts } from '@/lib/db';
import { Account } from '@/types/schema';

export interface SessionUserSummary {
  name?: string;
  email?: string;
  picture?: string;
}

export const getAuthenticatedUser = cache(async () => {
  try {
    const session = await auth0.getSession();
    return session?.user;
  } catch (error) {
    console.error('Failed to read session:', error);
    return null;
  }
});

export async function getInitialAccountsForUser(userId: string): Promise<Account[]> {
  return getUserAccounts(userId);
}

export async function getInitialAccounts(): Promise<Account[]> {
  const user = await getAuthenticatedUser();
  if (!user?.sub) {
    return [];
  }

  return getInitialAccountsForUser(user.sub);
}

export async function getInitialAccountById(accountId: number): Promise<Account | null> {
  const user = await getAuthenticatedUser();
  if (!user?.sub) {
    return null;
  }

  return getAccount(user.sub, accountId);
}
