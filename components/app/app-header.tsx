'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { CheckCircle2, CloudOff, Download, Moon, RefreshCw, Sun, Upload, Zap } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { SessionUserSummary } from '@/lib/server-accounts';
import { Account } from '@/types/schema';
import { exportAllDataCSV, handleFileImport } from '@/utils/dataImportExport';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';

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

  const syncLabel = !isOnline
    ? 'Offline'
    : isSyncing
      ? 'Syncing'
      : pendingSyncCount > 0
        ? `${pendingSyncCount} pending`
        : 'Synced';

  const SyncIcon = !isOnline ? CloudOff : isSyncing ? RefreshCw : pendingSyncCount > 0 ? Zap : CheckCircle2;

  return (
    <header className="mb-8 rounded-3xl border border-black/10 bg-white/70 p-5 shadow-[0_25px_80px_-40px_rgba(20,16,9,0.65)] backdrop-blur-xl dark:border-white/10 dark:bg-black/40">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-orange-500 dark:text-orange-300">Pocket Ledger</p>
          <h1 className="font-display text-4xl leading-none tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-5xl">Account Balance Tracker</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/80 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-zinc-600 transition hover:scale-[1.02] dark:border-white/15 dark:bg-black/40 dark:text-zinc-300"
            onClick={onSyncNow}
          >
            <SyncIcon className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {syncLabel}
          </button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
            className="rounded-full border-black/10 dark:border-white/20"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-black/10 bg-white/90 dark:border-white/20 dark:bg-black/35"
          onClick={() => exportAllDataCSV(accounts)}
        >
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-black/10 bg-white/90 dark:border-white/20 dark:bg-black/35"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={(event) => handleFileImport(event, accounts, setAccounts)}
          className="hidden"
        />

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto rounded-full border-black/10 dark:border-white/20">
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name || 'User'}
                  width={24}
                  height={24}
                  className="rounded-full"
                  unoptimized
                />
              ) : (
                <span className="text-xs font-semibold">U</span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="flex flex-col">
            <h2 className="font-display text-3xl">Account</h2>
            <div className="mt-4 rounded-lg border p-4">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {/* Auth0 recommends plain anchors for auth endpoints to avoid client-side interception. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/auth/logout" className="mt-auto block">
              <Button variant="outline" className="w-full">
                Sign Out
              </Button>
            </a>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
