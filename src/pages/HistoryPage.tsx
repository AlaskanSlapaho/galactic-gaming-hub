
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { CalendarIcon, DollarSign, GameController2 } from "lucide-react";
import { format } from "date-fns";

const HistoryPage = () => {
  const { user } = useAuth();

  // Mock transaction history data
  // In a real app, this would be fetched from a backend
  const transactions = [
    {
      id: 1,
      type: "bet",
      game: "Mines",
      amount: 500,
      outcome: "win",
      resultAmount: 950,
      timestamp: new Date(2023, 4, 15, 14, 30),
    },
    {
      id: 2,
      type: "bet",
      game: "Dice",
      amount: 200,
      outcome: "loss",
      resultAmount: -200,
      timestamp: new Date(2023, 4, 15, 15, 45),
    },
    {
      id: 3,
      type: "bet",
      game: "Tower",
      amount: 300,
      outcome: "win",
      resultAmount: 600,
      timestamp: new Date(2023, 4, 16, 9, 20),
    },
    {
      id: 4,
      type: "deposit",
      amount: 1000,
      timestamp: new Date(2023, 4, 14, 11, 10),
    },
    {
      id: 5,
      type: "withdrawal",
      amount: 2500,
      timestamp: new Date(2023, 4, 13, 16, 30),
    },
  ];

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Transaction History</h1>

      {!user ? (
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-8 text-center">
            <p className="text-zinc-400">Please login to view your transaction history</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {transactions.length === 0 ? (
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-8 text-center">
                <p className="text-zinc-400">No transactions yet</p>
              </CardContent>
            </Card>
          ) : (
            transactions.map((transaction) => (
              <Card key={transaction.id} className="bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === "deposit"
                          ? "bg-green-500/20 text-green-500"
                          : transaction.type === "withdrawal"
                          ? "bg-blue-500/20 text-blue-500"
                          : transaction.outcome === "win"
                          ? "bg-purple-500/20 text-purple-500"
                          : "bg-red-500/20 text-red-500"
                      }`}>
                        {transaction.type === "deposit" || transaction.type === "withdrawal" ? (
                          <DollarSign className="h-5 w-5" />
                        ) : (
                          <GameController2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">
                          {transaction.type === "bet"
                            ? `${transaction.game} Game - ${transaction.outcome === "win" ? "Win" : "Loss"}`
                            : transaction.type === "deposit"
                            ? "Deposit"
                            : "Withdrawal"}
                        </p>
                        <div className="flex items-center text-sm text-zinc-400">
                          <CalendarIcon className="mr-1 h-3 w-3" />
                          <span>{format(transaction.timestamp, "PPp")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${
                        transaction.type === "deposit" || (transaction.type === "bet" && transaction.outcome === "win")
                          ? "text-green-500"
                          : "text-red-500"
                      }`}>
                        {transaction.type === "deposit"
                          ? `+${transaction.amount}`
                          : transaction.type === "withdrawal"
                          ? `-${transaction.amount}`
                          : transaction.outcome === "win"
                          ? `+${transaction.resultAmount}`
                          : `-${transaction.amount}`} Credits
                      </p>
                      {transaction.type === "bet" && (
                        <p className="text-sm text-zinc-400">
                          Bet: {transaction.amount} Credits
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
