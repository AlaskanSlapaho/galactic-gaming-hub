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
import { useAuth } from "@/hooks/useAuth";

const LeaderboardPage = () => {
  const { user } = useAuth();
  
  // Use registered users from local storage
  const getRegisteredUsers = () => {
    const storedUsers = localStorage.getItem("galactic_ledgers_users");
    if (!storedUsers) return {};
    return JSON.parse(storedUsers);
  };
  
  const generateLeaderboardData = () => {
    const registeredUsers = getRegisteredUsers();
    
    if (!registeredUsers) return [];
    
    // Convert registered users to array and sort by balance
    const players = Object.values(registeredUsers)
      .map((userData: any) => userData.user)
      .filter(user => user !== undefined)
      .sort((a: any, b: any) => b.balance - a.balance);
    
    // Add rank to each player
    return players.map((player: any, index) => ({
      rank: index + 1,
      username: player.username,
      winnings: player.balance,
      games: Math.floor(Math.random() * 300) + 100, // Placeholder for now
      biggestWin: Math.floor(player.balance / (Math.random() * 5 + 5)), // Placeholder
    }));
  };

  const generateRecentWins = () => {
    const registeredUsers = getRegisteredUsers();
    
    if (!registeredUsers) return [];
    
    // Get up to 5 users for recent wins
    const players = Object.values(registeredUsers)
      .map((userData: any) => userData.user)
      .filter(user => user !== undefined)
      .slice(0, 5);
    
    return players.map((player: any) => {
      const userGameTypes = ["Mines", "Dice", "Tower", "Blackjack", "HiLo", "Roulette", "Cases"];
      const userGame = userGameTypes[Math.floor(Math.random() * userGameTypes.length)];
      return {
        username: player.username,
        game: userGame,
        amount: Math.floor(Math.random() * 20000) + 5000,
        multiplier: (Math.random() * 15 + 2).toFixed(1) + "x",
        timestamp: Math.floor(Math.random() * 12) + 1 + "h ago"
      };
    });
  };

  const topPlayers = generateLeaderboardData();
  const recentBigWins = generateRecentWins();

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
                  <h3 className="text-2xl font-bold">
                    {player.username}
                    {player.username === user?.username ? " (You)" : ""}
                  </h3>
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
                <TableRow key={player.rank} className={`border-zinc-800 ${player.username === user?.username ? "bg-zinc-800/50" : ""}`}>
                  <TableCell className="font-medium">#{player.rank}</TableCell>
                  <TableCell>
                    {player.username}
                    {player.username === user?.username ? " (You)" : ""}
                  </TableCell>
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
                <TableRow key={index} className={`border-zinc-800 ${win.username === user?.username ? "bg-zinc-800/50" : ""}`}>
                  <TableCell className="font-medium">
                    {win.username}
                    {win.username === user?.username ? " (You)" : ""}
                  </TableCell>
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
