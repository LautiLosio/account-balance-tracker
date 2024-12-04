import TransactionHistory from "@/components/transaction-history";

export default function TransactionHistoryPage({
  params,
}: {
  params: { accountId: string };
}) {
  return <TransactionHistory accountId={parseInt(params.accountId)} />;
}
