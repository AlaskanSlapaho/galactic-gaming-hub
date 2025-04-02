
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Trophy, ArrowDown } from "lucide-react";

// Sample data - would be replaced with actual data from backend
const topPlayers = [
  { rank: 1, username: "Lucky777", winnings: 250000, games: 543, biggestWin: 35000 },
  { rank: 2, username: "GalaxyGambler", winnings: 175000, games: 612, biggestWin: 21000 },
  { rank: 3, username: "CryptoWinner", winnings: 125000, games: 387, biggestWin: 18500 },
  { rank: 4, username: "BetMaster", winnings: 95000, games: 429, biggestWin: 15000 },
  { rank: 5, username: "LuckyStreak", winnings: 85000, games: 315, biggestWin: 12000 },
  { rank: 6, username: "RiskyPlayer", winnings: 78000, games: 276, biggestWin: 9500 },
  { rank: 7, username: "HighRoller", winnings: 65000, games: 210, biggestWin: 8700 },
  { rank: 8, username: "DiamondBet", winnings: 58000, games: 195, biggestWin: 7800 },
  { rank: 9, username: "VIPGamer", winnings: 42000, games: 168, biggestWin: 6200 },
  { rank: 10, username: "LuckyCharm", winnings: 35000, games: 124, biggestWin: 5500 },
];

// Recent big wins
const recentBigWins = [
  { username: "StellarWinner", game: "Mines", amount: 22500, multiplier: "15.0x", timestamp: "2h ago" },
  { username: "MoonPlayer", game: "Tower", amount: 18000, multiplier: "12.0x", timestamp: "4h ago" },
  { username: "CryptoKing", game: "Blackjack", amount: 15000, multiplier: "2.5x", timestamp: "7h ago" },
  { username: "BetWizard", game: "Dice", amount: 12500, multiplier: "25.0x", timestamp: "10h ago" },
  { username: "GalacticBet", game: "HiLo", amount: 9500, multiplier: "19.0x", timestamp: "12h ago" },
];

const LeaderboardPage = () => {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Leaderboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Top 3 Players */}
        {topPlayers.slice(0, 3).map((player) => (
          <Card key={player.rank} className="bg-zinc-900 border-zinc-800">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                  player.rank === 1 
                    ? "bg-yellow-500" 
                    : player.rank === 2 
                    ? "bg-gray-400" 
                    : "bg-amber-700"
                }`}>
                  <Trophy className="h-8 w-8 text-white" />
                </div>
                
                <div className="text-center">
                  <h3 className="text-2xl font-bold">{player.username}</h3>
                  <p className="text-lg text-green-500 font-medium mt-1">
                    {player.winnings.toLocaleString()} Credits
                  </p>
                  <p className="text-sm text-zinc-400 mt-2">
                    Biggest Win: {player.biggestWin.toLocaleString()} Credits
                  </p>
                  <p className="text-sm text-zinc-400">
                    Games Played: {player.games}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Full Leaderboard */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Top 10 All-Time Winners</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Rank</TableHead>
                <TableHead className="text-zinc-400">Player</TableHead>
                <TableHead className="text-zinc-400 text-right">Total Winnings</TableHead>
                <TableHead className="text-zinc-400 text-right">Games</TableHead>
                <TableHead className="text-zinc-400 text-right">Biggest Win</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topPlayers.map((player) => (
                <TableRow key={player.rank} className="border-zinc-800">
                  <TableCell className="font-medium">#{player.rank}</TableCell>
                  <TableCell>{player.username}</TableCell>
                  <TableCell className="text-right text-green-500">
                    {player.winnings.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{player.games}</TableCell>
                  <TableCell className="text-right">
                    {player.biggestWin.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Recent Big Wins */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Recent Big Wins</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Player</TableHead>
                <TableHead className="text-zinc-400">Game</TableHead>
                <TableHead className="text-zinc-400 text-right">Amount</TableHead>
                <TableHead className="text-zinc-400 text-right">Multiplier</TableHead>
                <TableHead className="text-zinc-400 text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentBigWins.map((win, index) => (
                <TableRow key={index} className="border-zinc-800">
                  <TableCell className="font-medium">{win.username}</TableCell>
                  <TableCell>{win.game}</TableCell>
                  <TableCell className="text-right text-green-500">
                    {win.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">{win.multiplier}</TableCell>
                  <TableCell className="text-right">{win.timestamp}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeaderboardPage;
