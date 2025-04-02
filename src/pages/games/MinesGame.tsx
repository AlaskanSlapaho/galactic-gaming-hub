
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, RefreshCw, DollarSign, X } from "lucide-react";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateMultipleResults,
} from "@/utils/provablyFair";

const MinesGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState<string>("500");
  const [mineCount, setMineCount] = useState<number>(5);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [mines, setMines] = useState<Set<number>>(new Set());
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [potentialWin, setPotentialWin] = useState<number>(0);
  const [gameState, setGameState] = useState(createDefaultGameState());
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  
  const GRID_SIZE = 25; // 5x5 grid
  
  const calculateMultiplier = (mines: number, revealed: number) => {
    if (revealed === 0) return 1.0;
    
    const totalCells = GRID_SIZE;
    const safeFields = totalCells - mines;
    
    // Calculate the mathematical fair multiplier
    let multi = 1.0;
    for (let i = 0; i < revealed; i++) {
      multi *= (totalCells - i) / (totalCells - mines - i);
    }
    
    // Apply a house edge and cap the multiplier to prevent it from going too high
    multi = multi * 0.95; // 5% house edge
    
    // Cap the multiplier to 20x as requested
    multi = Math.min(multi, 20);
    
    return Math.round(multi * 100) / 100;
  };
  
  useEffect(() => {
    const betValue = parseFloat(betAmount) || 0;
    setPotentialWin(betValue * multiplier);
  }, [betAmount, multiplier]);
  
  const startNewGame = () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please login to play",
      });
      return;
    }
    
    const betValue = parseFloat(betAmount);
    
    if (isNaN(betValue) || betValue <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
      });
      return;
    }
    
    if (betValue > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits",
      });
      return;
    }
    
    const newGameState = createDefaultGameState();
    setGameState(newGameState);
    
    const fairParams = getProvablyFairParams(newGameState);
    
    const uniqueMines = new Set<number>();
    
    // Simplified approach to generate unique mine positions
    const positions = generateMultipleResults(fairParams, 0, GRID_SIZE - 1, mineCount);
    positions.forEach(position => {
      uniqueMines.add(position);
    });
    
    // Ensure we have exactly mineCount mines
    if (uniqueMines.size < mineCount) {
      // If there were duplicate numbers in the generated results, add random positions
      while (uniqueMines.size < mineCount) {
        const randomPosition = Math.floor(Math.random() * GRID_SIZE);
        uniqueMines.add(randomPosition);
      }
    }
    
    setMines(uniqueMines);
    setRevealed(new Set());
    setGameActive(true);
    setGameOver(false);
    setMultiplier(1.0);
    setGameResult(null);
    
    updateBalance((user?.balance || 0) - betValue);
  };
  
  const handleTileClick = (index: number) => {
    if (!gameActive || gameOver || revealed.has(index)) {
      return;
    }
    
    if (mines.has(index)) {
      const newRevealed = new Set(revealed);
      newRevealed.add(index);
      setRevealed(newRevealed);
      setGameOver(true);
      setGameActive(false);
      setGameResult("lose");
      
      toast({
        variant: "destructive",
        title: "Boom! You hit a mine",
        description: "Better luck next time!",
      });
      
      return;
    }
    
    const newRevealed = new Set(revealed);
    newRevealed.add(index);
    setRevealed(newRevealed);
    
    const newMultiplier = calculateMultiplier(mineCount, newRevealed.size);
    setMultiplier(newMultiplier);
    
    if (newRevealed.size === GRID_SIZE - mineCount) {
      cashout();
    }
  };
  
  const cashout = () => {
    if (!gameActive || gameOver) {
      return;
    }
    
    setGameOver(true);
    setGameActive(false);
    setGameResult("win");
    
    const betValue = parseFloat(betAmount) || 0;
    const winAmount = betValue * multiplier;
    
    updateBalance((user?.balance || 0) + winAmount);
    
    toast({
      title: "Cashed Out!",
      description: `You won ${winAmount.toFixed(2)} credits!`,
    });
  };
  
  const getTileStatus = (index: number) => {
    if (!gameActive && !gameOver) {
      return "unrevealed";
    }
    
    if (revealed.has(index)) {
      return mines.has(index) ? "mine" : "gem";
    }
    
    if (gameOver && mines.has(index)) {
      return "mine-hidden";
    }
    
    return "unrevealed";
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Mines</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800 col-span-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-5 gap-2 aspect-square">
              {Array.from({ length: GRID_SIZE }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleTileClick(index)}
                  disabled={!gameActive || revealed.has(index)}
                  className={`aspect-square rounded-md flex items-center justify-center text-lg font-bold transition-all duration-200 ${
                    getTileStatus(index) === "unrevealed"
                      ? "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
                      : getTileStatus(index) === "gem"
                      ? "bg-gradient-to-br from-purple-500 to-blue-500 border-none"
                      : getTileStatus(index) === "mine" || getTileStatus(index) === "mine-hidden"
                      ? "bg-red-600 border-none"
                      : "bg-zinc-800 border border-zinc-700"
                  }`}
                >
                  {getTileStatus(index) === "gem" && <DollarSign className="h-6 w-6 text-white" />}
                  {getTileStatus(index) === "mine" && <X className="h-6 w-6 text-white" />}
                  {getTileStatus(index) === "mine-hidden" && <X className="h-6 w-6 text-white opacity-50" />}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="bet-amount">Bet Amount</Label>
                <Input
                  id="bet-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  disabled={gameActive}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="mine-count">Mines: {mineCount}</Label>
                  <span className="text-sm text-zinc-400">2-24</span>
                </div>
                <Slider
                  id="mine-count"
                  defaultValue={[mineCount]}
                  min={2}
                  max={24}
                  step={1}
                  onValueChange={(vals) => setMineCount(vals[0])}
                  disabled={gameActive}
                  className="py-2"
                />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Current Multiplier</p>
                <p className="text-2xl font-bold text-green-500">{multiplier.toFixed(2)}x</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Potential Win</p>
                <p className="text-xl font-medium">
                  {potentialWin.toFixed(2)} Credits
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              {!gameActive && (
                <Button
                  onClick={startNewGame}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!isAuthenticated}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {gameOver ? "New Game" : "Start Game"}
                </Button>
              )}
              
              {gameActive && (
                <Button
                  onClick={cashout}
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-500/20"
                >
                  Cashout ({(parseFloat(betAmount) * multiplier).toFixed(2)})
                </Button>
              )}
            </div>
            
            {gameResult && (
              <div className={`p-3 rounded-md ${
                gameResult === "win" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              }`}>
                <p className="text-center font-medium">
                  {gameResult === "win"
                    ? `You won ${(parseFloat(betAmount) * multiplier).toFixed(2)} credits!`
                    : "You hit a mine!"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4 text-sm text-zinc-400">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-2">
                <strong>How to play:</strong> Click on tiles to reveal gems. Avoid mines!
              </p>
              <p>
                The more gems you reveal, the higher your multiplier. Press Cashout any time to collect your winnings.
                Higher mine counts increase potential multipliers but also increase risk.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MinesGame;
