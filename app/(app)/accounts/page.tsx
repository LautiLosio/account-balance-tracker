import { MainAccountsClient } from '@/components/app/main-accounts-client';
import { getAuthenticatedUser, getInitialAccounts } from '@/lib/server-accounts';

export const dynamic = 'force-dynamic';

export default async function AccountsPage() {
  const [user, accounts] = await Promise.all([getAuthenticatedUser(), getInitialAccounts()]);

  return (
    <MainAccountsClient
      initialAccounts={accounts}
      user={{
        name: user?.name,
        email: user?.email,
        picture: user?.picture,
      }}
    />
  );
}
