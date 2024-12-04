"use client";

import { useEffect, useState } from "react";
// import { useRouter } from "next/navigation";
// import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { ArrowLeftCircle } from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ArrowLeft, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "./ui/button";

interface Transaction {
  id: number;
  date: Date;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  fromAccount?: number;
  toAccount?: number;
  exchangeRate?: number;
}

interface Account {
  id: number;
  name: string;
  initialBalance: number;
  currentBalance: number;
  isForeignCurrency: boolean;
  transactions: Transaction[];
}

export default function TransactionHistory({
  accountId,
}: {
  accountId: number;
}) {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    // In a real application, you would fetch the account data from an API or database here
    // For this example, we'll use mock data
    const mockAccount: Account = {
      id: accountId,
      name: `Account ${accountId}`,
      initialBalance: 1000,
      currentBalance: 1500,
      isForeignCurrency: false,
      transactions: [
        {
          id: 1,
          date: new Date(),
          description: "Initial deposit",
          amount: 1000,
          type: "income",
        },
        {
          id: 2,
          date: new Date(),
          description: "Grocery shopping",
          amount: -50,
          type: "expense",
        },
        {
          id: 3,
          date: new Date(),
          description: "Salary",
          amount: 2000,
          type: "income",
        },
        {
          id: 4,
          date: new Date(),
          description: "Transfer to Savings",
          amount: -1450,
          type: "transfer",
          toAccount: 2,
        },
      ],
    };
    setAccount(mockAccount);
  }, [accountId]);

  if (!account) {
    return <div>Loading...</div>;
  }

  return (
    <span className="flex flex-col gap-4 p-4">
      <div className="flex items-start gap-2 mb-4">
        <Link href="/">
          <Button variant="outline" className="flex-1 p-9">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeft className="h-6 w-6" />
              <span>Back</span>
            </CardTitle>
          </Button>
        </Link>
        <Card className="mb-4 flex grow">
          <Collapsible className="flex flex-col grow">
            <CollapsibleTrigger className="flex flex-1">
              <CardHeader className="flex-1">
                <CardTitle className="flex flex-1 justify-between items-center gap-2">
                  Account Details
                  <Info className="h-6 w-6" />
                </CardTitle>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <ul className="grid grid-cols-2 flex-wrap gap-4">
                  <li>
                    <span className="font-semibold">ID:</span> {account.id}
                  </li>
                  <li>
                    <span className="font-semibold">Name:</span> {account.name}
                  </li>
                  <li>
                    <span className="font-semibold">Initial Balance:</span>{" "}
                    {account.initialBalance.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </li>
                  <li>
                    <span className="font-semibold">Currency:</span>{" "}
                    {account.isForeignCurrency ? "Foreign" : "Local"}
                  </li>
                  <li>
                    <span className="font-semibold">Current Balance:</span>{" "}
                    {account.currentBalance.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </li>
                  <li>
                    <span className="font-semibold">
                      Number of Transactions:
                    </span>{" "}
                    {account.transactions.length}
                  </li>
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>Transactions</span>
          </CardTitle>
        </CardHeader>
        {account.transactions.length === 0 && (
          <CardContent className="text-muted-foreground">
            No transactions yet.
          </CardContent>
        )}
        {account.transactions.length > 0 && (
          <CardContent>
            <div className="space-y-2">
              {account.transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex justify-between items-center p-2 gap-2 border-b last:border-b-0"
                >
                  <div>
                    <div className="font-semibold capitalize">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.date.toLocaleString("es-AR")}
                    </div>
                  </div>
                  <div
                    className={`font-semibold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}
                  >
                    {transaction.amount.toLocaleString("es-AR", {
                      style: "currency",
                      currency: "ARS",
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </span>
  );
}
