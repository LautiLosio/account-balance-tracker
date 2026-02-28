import { getAuthenticatedUser } from '@/lib/server-accounts';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background p-6">
        {/* Background glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

        <div className="animate-scale-in relative w-full max-w-sm space-y-8 opacity-0" style={{ animationFillMode: 'forwards' }}>
          {/* Wordmark */}
          <div className="text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary shadow-xl shadow-primary/30">
              <span className="font-display text-2xl font-bold text-primary-foreground">PL</span>
            </div>
            <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">Pocket Ledger</h1>
            <p className="mt-2 font-mono text-sm text-muted-foreground">
              Offline-first balance tracker
            </p>
          </div>

          {/* Sign-in card */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="mb-5 text-sm text-muted-foreground">
              Sign in to access your accounts, track balances, and log transactions from anywhere — even offline.
            </p>
            {/* Auth0 recommends plain anchors for auth endpoints to avoid client-side interception. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/login" className="block">
              <button
                type="button"
                className="flex h-12 w-full items-center justify-center rounded-xl bg-primary font-display font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-transform active:scale-[0.98]"
              >
                Sign In
              </button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
