import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/lib/server-accounts';

export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthenticatedUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-md rounded-lg border p-8 text-center">
          <h1 className="text-2xl font-semibold">You are signed out</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in to log and track movements between your accounts.
          </p>
          {/* Auth0 recommends plain anchors for auth endpoints to avoid client-side interception. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/api/auth/login" className="mt-6 block">
            <Button className="w-full">Sign In</Button>
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
