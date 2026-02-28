import { redirect } from 'next/navigation';

interface LegacyTransactionsPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function LegacyTransactionsPage({ params }: LegacyTransactionsPageProps) {
  const { accountId } = await params;
  redirect(`/accounts/${accountId}`);
}
