'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { Download, Moon, Sun, Upload } from 'lucide-react';
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
}

export function AppHeader({ accounts, setAccounts, user }: AppHeaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <h1 className="text-3xl font-bold">Account Balance Tracker</h1>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="sm" onClick={() => exportAllDataCSV(accounts)}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
        <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
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
            <Button variant="outline" size="icon">
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
            <h2 className="text-xl font-semibold">Account</h2>
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
    </div>
  );
}
