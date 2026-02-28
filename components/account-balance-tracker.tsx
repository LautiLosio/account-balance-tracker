'use client'

import { MainAccountsClient } from '@/components/app/main-accounts-client'
import { Account } from '@/types/schema'

export function AccountBalanceTrackerComponent({ initialAccounts = [] }: { initialAccounts?: Account[] }) {
  return <MainAccountsClient initialAccounts={initialAccounts} user={{}} />
}
