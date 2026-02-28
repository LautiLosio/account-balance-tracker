'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { CheckCircle2, CloudOff, Download, Moon, RefreshCw, Sun, Upload, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { SessionUserSummary } from '@/lib/server-accounts';
import { Account } from '@/types/schema';
import { exportAllDataCSV, handleFileImport } from '@/utils/dataImportExport';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  user: SessionUserSummary;
  pendingSyncCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  onSyncNow: () => void;
  onClearAllData: () => void;
}

export function AppHeader({ accounts, setAccounts, user, pendingSyncCount, isSyncing, isOnline, onSyncNow, onClearAllData }: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  const SyncIcon = !isOnline ? CloudOff : isSyncing ? RefreshCw : pendingSyncCount > 0 ? Zap : CheckCircle2;
  const syncColor = !isOnline ? 'text-rose-500' : isSyncing || pendingSyncCount > 0 ? 'text-amber-400' : 'text-primary';
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

      onClearAllData();
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
            onClick={onSyncNow}
            className="inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title={syncLabel}
          >
            <SyncIcon className={cn('h-3.5 w-3.5 transition-colors', syncColor, isSyncing && 'animate-spin')} />
            <span className="hidden sm:inline">{syncLabel}</span>
          </button>

          <button
            type="button"
            onClick={() => exportAllDataCSV(accounts)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Import CSV"
          >
            <Upload className="h-3.5 w-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => handleFileImport(e, accounts, setAccounts)}
            className="hidden"
          />

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
                  <Image src={user.picture} alt={user.name ?? 'User'} width={24} height={24} className="h-6 w-6 rounded-full object-cover" unoptimized />
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary font-display text-[11px] font-bold text-primary-foreground">
                    {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </span>
                )}
              </button>
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-0 p-0">
              <SheetHeader className="border-b border-border px-6 py-5">
                <SheetTitle className="font-display text-xl font-bold text-foreground">Account</SheetTitle>
              </SheetHeader>
              <div className="p-6">
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-4">
                  {user.picture ? (
                    <Image src={user.picture} alt={user.name ?? 'User'} width={40} height={40} className="h-10 w-10 rounded-full" unoptimized />
                  ) : (
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-display text-sm font-bold text-primary-foreground">
                      {user.name?.charAt(0).toUpperCase() ?? 'U'}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
              <div className="px-6 pb-4">
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 w-full text-sm"
                  onClick={handleDeleteAccountAndData}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account & Data'}
                </Button>
              </div>
              {/* Auth0 recommends plain anchors for auth endpoints to avoid client-side interception. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/auth/logout" className="mt-auto block p-6 pt-0">
                <Button variant="outline" className="h-11 w-full text-sm">Sign Out</Button>
              </a>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
