
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

const LeaderboardPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Leaderboard</h1>
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-6">
          <div className="text-center p-12 text-zinc-400">
            Leaderboard is coming soon! Check back later to see the top winners.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
