import { notFound } from 'next/navigation';
import { AccountHistoryClient } from '@/components/app/account-history-client';

interface AccountHistoryPageProps {
  params: Promise<{ id: string }>;
}

export default async function AccountHistoryPage({ params }: AccountHistoryPageProps) {
  const { id } = await params;
  const accountId = Number(id);

  if (Number.isNaN(accountId)) {
    notFound();
  }

  return <AccountHistoryClient accountId={accountId} />;
}
