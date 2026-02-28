import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/lib/server-accounts';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/25">
              <Wallet className="h-7 w-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Pocket Ledger</h1>
            <p className="text-sm text-muted-foreground">
              Track and manage your account balances offline&#8209;first.
            </p>
          </div>

          <div className="rounded-xl border bg-card p-6 text-left shadow-sm">
            <p className="mb-4 text-sm text-muted-foreground">Sign in to access your accounts and transaction history.</p>
            {/* Auth0 recommends plain anchors for auth endpoints to avoid client-side interception. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/login" className="block">
              <Button className="w-full font-semibold">Sign In</Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
