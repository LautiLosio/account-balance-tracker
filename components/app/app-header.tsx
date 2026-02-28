'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { CheckCircle2, CloudOff, Download, Moon, RefreshCw, Sun, Upload, Wallet, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { SessionUserSummary } from '@/lib/server-accounts';
import { Account } from '@/types/schema';
import { exportAllDataCSV, handleFileImport } from '@/utils/dataImportExport';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

interface AppHeaderProps {
  accounts: Account[];
  setAccounts: (accounts: Account[]) => void;
  user: SessionUserSummary;
  pendingSyncCount: number;
  isSyncing: boolean;
  isOnline: boolean;
  onSyncNow: () => void;
}

export function AppHeader({ accounts, setAccounts, user, pendingSyncCount, isSyncing, isOnline, onSyncNow }: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  const syncLabel = !isOnline ? 'Offline' : isSyncing ? 'Syncing…' : pendingSyncCount > 0 ? `${pendingSyncCount} pending` : 'Synced';

  const SyncIcon = !isOnline ? CloudOff : isSyncing ? RefreshCw : pendingSyncCount > 0 ? Zap : CheckCircle2;

  const syncColor = !isOnline
    ? 'text-rose-500'
    : isSyncing
      ? 'text-amber-400'
      : pendingSyncCount > 0
        ? 'text-amber-400'
        : 'text-emerald-500';

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary">
            <Wallet className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">Pocket Ledger</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSyncNow}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <SyncIcon className={cn('h-3.5 w-3.5', syncColor, isSyncing && 'animate-spin')} />
            <span className="hidden sm:inline">{syncLabel}</span>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => exportAllDataCSV(accounts)}
            title="Export CSV"
          >
            <Download className="h-3.5 w-3.5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => fileInputRef.current?.click()}
            title="Import CSV"
          >
            <Upload className="h-3.5 w-3.5" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(event) => handleFileImport(event, accounts, setAccounts)}
            className="hidden"
          />

          <div className="mx-1 h-4 w-px bg-border" />

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                {user.picture ? (
                  <Image
                    src={user.picture}
                    alt={user.name || 'User'}
                    width={24}
                    height={24}
                    className="h-6 w-6 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {user.name?.charAt(0).toUpperCase() ?? 'U'}
                  </div>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="flex flex-col gap-0 p-0">
              <div className="border-b border-border p-6">
                <h2 className="text-lg font-semibold">Account</h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-4">
                  {user.picture ? (
                    <Image src={user.picture} alt={user.name || 'User'} width={40} height={40} className="h-10 w-10 rounded-full" unoptimized />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                      {user.name?.charAt(0).toUpperCase() ?? 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{user.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </div>
              </div>
              {/* Auth0 recommends plain anchors for auth endpoints to avoid client-side interception. */}
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/auth/logout" className="mt-auto block p-6 pt-0">
                <Button variant="outline" className="w-full">Sign Out</Button>
              </a>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
