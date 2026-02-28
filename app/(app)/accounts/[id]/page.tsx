import { notFound } from 'next/navigation';
import { AccountHistoryClient } from '@/components/app/account-history-client';
import { getAuthenticatedUser, getInitialAccountById, getInitialAccounts } from '@/lib/server-accounts';

export const dynamic = 'force-dynamic';

interface AccountHistoryPageProps {
  params: { id: string };
}

export default async function AccountHistoryPage({ params }: AccountHistoryPageProps) {
  const accountId = Number(params.id);

  if (Number.isNaN(accountId)) {
    notFound();
  }

  const [user, account, accounts] = await Promise.all([
    getAuthenticatedUser(),
    getInitialAccountById(accountId),
    getInitialAccounts(),
  ]);

  if (!account) {
    notFound();
  }

  return (
    <AccountHistoryClient
      accountId={accountId}
      initialAccounts={accounts}
      user={{
        name: user?.name,
        email: user?.email,
        picture: user?.picture,
      }}
    />
  );
}
