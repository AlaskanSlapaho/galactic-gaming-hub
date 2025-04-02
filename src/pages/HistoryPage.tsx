
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Check, 
  X, 
  Search, 
  ArrowDownUp, 
  ChevronLeft, 
  ChevronRight,
  Dices,
  Layers,
  Bomb
} from "lucide-react";

// Sample data - would be replaced with actual data from backend
const gameHistory = [
  { id: "123456", game: "Dice", bet: 500, multiplier: "1.98x", payout: 990, result: "win", timestamp: "2023-06-15 14:32:15" },
  { id: "123455", game: "Mines", bet: 1000, multiplier: "3.25x", payout: 3250, result: "win", timestamp: "2023-06-15 14:30:22" },
  { id: "123454", game: "Tower", bet: 750, multiplier: "0x", payout: 0, result: "lose", timestamp: "2023-06-15 14:28:55" },
  { id: "123453", game: "Blackjack", bet: 500, multiplier: "2.0x", payout: 1000, result: "win", timestamp: "2023-06-15 14:25:18" },
  { id: "123452", game: "HiLo", bet: 1000, multiplier: "0x", payout: 0, result: "lose", timestamp: "2023-06-15 14:22:30" },
  { id: "123451", game: "Mines", bet: 250, multiplier: "0x", payout: 0, result: "lose", timestamp: "2023-06-15 14:20:45" },
  { id: "123450", game: "Dice", bet: 500, multiplier: "1.98x", payout: 990, result: "win", timestamp: "2023-06-15 14:18:10" },
  { id: "123449", game: "Tower", bet: 1000, multiplier: "6.0x", payout: 6000, result: "win", timestamp: "2023-06-15 14:15:22" },
  { id: "123448", game: "Blackjack", bet: 500, multiplier: "0x", payout: 0, result: "lose", timestamp: "2023-06-15 14:12:55" },
  { id: "123447", game: "HiLo", bet: 750, multiplier: "2.5x", payout: 1875, result: "win", timestamp: "2023-06-15 14:10:18" },
  { id: "123446", game: "Mines", bet: 500, multiplier: "0x", payout: 0, result: "lose", timestamp: "2023-06-15 14:08:30" },
  { id: "123445", game: "Dice", bet: 250, multiplier: "1.98x", payout: 495, result: "win", timestamp: "2023-06-15 14:05:45" },
  { id: "123444", game: "Tower", bet: 500, multiplier: "0x", payout: 0, result: "lose", timestamp: "2023-06-15 14:03:10" },
  { id: "123443", game: "Blackjack", bet: 1000, multiplier: "2.0x", payout: 2000, result: "win", timestamp: "2023-06-15 14:00:22" },
  { id: "123442", game: "HiLo", bet: 500, multiplier: "0x", payout: 0, result: "lose", timestamp: "2023-06-15 13:58:55" },
];

// Game icons
const gameIcons = {
  "Dice": <Dices className="h-4 w-4" />,
  "Mines": <Bomb className="h-4 w-4" />,
  "Tower": <Layers className="h-4 w-4" />,
  "Blackjack": <div className="font-bold text-sm">21</div>,
  "HiLo": <ArrowDownUp className="h-4 w-4" />
};

// Stats summary data
const statsSummary = {
  totalBets: 2548,
  totalWagered: 1250000,
  totalWon: 1375000,
  netProfit: 125000,
  winRate: 54.2,
  averageMultiplier: 2.34
};

const HistoryPage = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({
    game: "all",
    result: "all"
  });
  
  // Filter history based on selected filters
  const filteredHistory = gameHistory.filter(item => {
    if (filter.game !== "all" && item.game !== filter.game) return false;
    if (filter.result !== "all" && item.result !== filter.result) return false;
    return true;
  });
  
  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const paginatedHistory = filteredHistory.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Game History</h1>
      
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Total Bets</p>
              <p className="text-2xl font-bold">{statsSummary.totalBets.toLocaleString()}</p>
              <p className="text-sm text-zinc-400">Win Rate: {statsSummary.winRate}%</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Total Wagered</p>
              <p className="text-2xl font-bold">{statsSummary.totalWagered.toLocaleString()} Credits</p>
              <p className="text-sm text-zinc-400">Average Multiplier: {statsSummary.averageMultiplier}x</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4">
            <div className="space-y-1">
              <p className="text-sm text-zinc-400">Net Profit</p>
              <p className={`text-2xl font-bold ${statsSummary.netProfit >= 0 ? "text-green-500" : "text-red-500"}`}>
                {statsSummary.netProfit >= 0 ? "+" : ""}{statsSummary.netProfit.toLocaleString()} Credits
              </p>
              <p className="text-sm text-zinc-400">Total Won: {statsSummary.totalWon.toLocaleString()} Credits</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Filter Controls */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/3">
              <Label htmlFor="game-filter" className="mb-2 block">Game</Label>
              <select
                id="game-filter"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white"
                value={filter.game}
                onChange={(e) => setFilter({...filter, game: e.target.value})}
              >
                <option value="all">All Games</option>
                <option value="Dice">Dice</option>
                <option value="Mines">Mines</option>
                <option value="Tower">Tower</option>
                <option value="Blackjack">Blackjack</option>
                <option value="HiLo">HiLo</option>
              </select>
            </div>
            
            <div className="md:w-1/3">
              <Label htmlFor="result-filter" className="mb-2 block">Result</Label>
              <select
                id="result-filter"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-md p-2 text-white"
                value={filter.result}
                onChange={(e) => setFilter({...filter, result: e.target.value})}
              >
                <option value="all">All Results</option>
                <option value="win">Wins</option>
                <option value="lose">Losses</option>
              </select>
            </div>
            
            <div className="md:w-1/3">
              <Label htmlFor="search" className="mb-2 block">Search</Label>
              <div className="relative">
                <Input
                  id="search"
                  placeholder="Search by ID..."
                  className="w-full bg-zinc-800 border-zinc-700 pl-9"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* History Table */}
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-xl font-semibold">Bet History</CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800">
                <TableHead className="text-zinc-400">Game</TableHead>
                <TableHead className="text-zinc-400 text-right">Bet Amount</TableHead>
                <TableHead className="text-zinc-400 text-right">Multiplier</TableHead>
                <TableHead className="text-zinc-400 text-right">Payout</TableHead>
                <TableHead className="text-zinc-400 text-center">Result</TableHead>
                <TableHead className="text-zinc-400 text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            
            <TableBody>
              {paginatedHistory.map((bet) => (
                <TableRow key={bet.id} className="border-zinc-800">
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                        {gameIcons[bet.game]}
                      </div>
                      <span>{bet.game}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">{bet.bet.toLocaleString()}</TableCell>
                  <TableCell className="text-right">{bet.multiplier}</TableCell>
                  <TableCell className="text-right">
                    {bet.payout.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {bet.result === "win" ? (
                      <div className="inline-flex items-center p-1 rounded-full bg-green-500/20 text-green-500">
                        <Check className="h-4 w-4" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center p-1 rounded-full bg-red-500/20 text-red-500">
                        <X className="h-4 w-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right text-zinc-400 text-sm">
                    {bet.timestamp.split(' ')[1]}
                  </TableCell>
                </TableRow>
              ))}
              
              {paginatedHistory.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-zinc-400">
                    No results found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Pagination */}
      {filteredHistory.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-zinc-400">
            Showing {(page - 1) * itemsPerPage + 1} to {Math.min(page * itemsPerPage, filteredHistory.length)} of {filteredHistory.length} results
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(Math.max(1, page - 1))}
              className="border-zinc-800"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <span className="text-sm">
              Page {page} of {totalPages}
            </span>
            
            <Button 
              variant="outline" 
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className="border-zinc-800"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryPage;
