'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { CheckCircle2, CloudOff, Download, Moon, RefreshCw, Sun, Upload, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAppData } from '@/components/app/app-data-context';
import { exportAllDataCSV, handleFileImport } from '@/utils/dataImportExport';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function AppHeader() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const {
    accounts,
    clearAllLocalData,
    isOnline,
    isSyncing,
    pendingSyncCount,
    setAccounts,
    syncNow,
    user,
  } = useAppData();

  const SyncIcon = !isOnline ? CloudOff : isSyncing ? RefreshCw : pendingSyncCount > 0 ? Zap : CheckCircle2;
  const syncColor = !isOnline
    ? 'text-rose-600 dark:text-rose-500'
    : isSyncing || pendingSyncCount > 0
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-lime-700 dark:text-primary';
  const syncLabel = !isOnline ? 'Offline' : isSyncing ? 'Syncing' : pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'Synced';

  const handleDeleteAccountAndData = async () => {
    if (isDeleting) {
      return;
    }

    if (!isOnline) {
      toast.error('You are offline', {
        description: 'Reconnect to delete account data.',
      });
      return;
    }

    const confirmed = window.confirm(
      'Delete account and all data? This permanently removes every account and transaction and signs you out.'
    );

    if (!confirmed) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch('/api/user', { method: 'DELETE' });

      if (!response.ok) {
        throw new Error(`Failed to delete account data: ${response.status}`);
      }

      clearAllLocalData();
      toast.success('Account data deleted');
      window.location.assign('/api/auth/logout');
    } catch (error) {
      console.error('Failed to delete account data:', error);
      toast.error('Could not delete account data', {
        description: 'No changes were made. Please try again.',
      });
      setIsDeleting(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-screen-lg items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-primary">
            <span className="font-display text-[10px] font-bold leading-none text-primary-foreground">PL</span>
          </span>
          <span className="font-display text-sm font-bold tracking-tight text-foreground">Pocket Ledger</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={syncNow}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={syncLabel}
          >
            <SyncIcon className={cn('h-3.5 w-3.5 transition-colors', syncColor, isSyncing && 'animate-spin')} />
            <span className="hidden sm:inline">{syncLabel}</span>
          </button>

          <div className="mx-1 h-3.5 w-px bg-border" />

          <button
            type="button"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Toggle theme"
          >
            <Sun className="hidden h-3.5 w-3.5 dark:block" />
            <Moon className="h-3.5 w-3.5 dark:hidden" />
          </button>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                className="ml-0.5 flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
                aria-label="Account"
              >
                {user.picture ? (
                  <Image src={user.picture} alt={user.name ?? 'User'} width={40} height={40} className="h-6 w-6 rounded-full object-cover" />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-[11px] font-bold text-primary-foreground">
                    {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent
              side="bottom"
              className="mx-auto w-full max-w-screen-md rounded-t-3xl border-t border-border bg-card/95 p-0 backdrop-blur-xl"
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="h-1 w-10 rounded-full bg-border" />
              </div>

              <SheetHeader className="border-b border-border px-6 pb-4 pt-2">
                <SheetTitle className="font-display text-2xl font-bold tracking-tight text-foreground">Account</SheetTitle>
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
                  Profile and session controls
                </p>
              </SheetHeader>

              <div className="space-y-4 px-6 py-5">
                <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/15 via-card to-card p-4">
                  <div className="flex items-center gap-3">
                    {user.picture ? (
                      <Image src={user.picture} alt={user.name ?? 'User'} width={40} height={40} className="h-11 w-11 rounded-full object-cover ring-2 ring-primary/25" />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground ring-2 ring-primary/25">
                        {user.name?.charAt(0).toUpperCase() ?? 'U'}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">{user.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Accounts</p>
                      <p className="mt-0.5 font-display text-lg font-bold text-foreground">{accounts.length}</p>
                    </div>
                    <div className="rounded-xl border border-border bg-background/70 px-3 py-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Sync</p>
                      <p className={cn(
                        'mt-0.5 font-display text-lg font-bold',
                        !isOnline
                          ? 'text-rose-600 dark:text-rose-500'
                          : isSyncing || pendingSyncCount > 0
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-lime-700 dark:text-primary'
                      )}>
                        {syncLabel}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-start rounded-xl px-4 text-sm"
                    onClick={() => exportAllDataCSV(accounts)}
                  >
                    <Download className="h-4 w-4" />
                    Export CSV
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 w-full justify-start rounded-xl px-4 text-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Import CSV
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileImport(e, accounts, setAccounts)}
                    className="hidden"
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {/* Auth0 recommends plain anchors for auth endpoints to avoid client-side interception. */}
                  {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
                  <a href="/api/auth/logout" className="block">
                    <Button variant="outline" className="h-11 w-full rounded-xl text-sm">Sign Out</Button>
                  </a>

                  <Button
                    type="button"
                    variant="destructive"
                    className="h-11 w-full rounded-xl text-sm"
                    onClick={handleDeleteAccountAndData}
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Account & Data'}
                  </Button>
                </div>
              </div>

            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
