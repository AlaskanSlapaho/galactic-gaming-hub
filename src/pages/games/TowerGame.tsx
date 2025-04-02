
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, ArrowRight } from "lucide-react";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateRandomNumber,
} from "@/utils/provablyFair";

const TowerGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState<string>("500");
  const [minesPerRow, setMinesPerRow] = useState<number>(1);
  const [currentRow, setCurrentRow] = useState<number>(-1);
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [gameState, setGameState] = useState(createDefaultGameState());
  const [mines, setMines] = useState<Record<number, number[]>>({});
  const [revealedSafeTiles, setRevealedSafeTiles] = useState<Record<number, number[]>>({});
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  
  const ROWS = 5;
  const TILES_PER_ROW = 5;
  
  // Define base multipliers with 0.2 increase per row
  const baseMultipliers = [1.2, 1.4, 1.6, 1.8, 2.0]; // For 1 mine per row

  // Calculate multipliers for different mine counts
  const getRowMultipliers = () => {
    switch(minesPerRow) {
      case 1: 
        return baseMultipliers;
      case 2: 
        // Multiply base by 1.5 for 2 mines
        return baseMultipliers.map(m => parseFloat((m * 1.5).toFixed(2)));
      case 3: 
        // Multiply base by 3 for 3 mines
        return baseMultipliers.map(m => parseFloat((m * 3).toFixed(2)));
      default: 
        return baseMultipliers;
    }
  };
  
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
    
    // Generate a new game state for provably fair results
    const newGameState = createDefaultGameState();
    setGameState(newGameState);
    
    // Generate mine positions for each row
    const fairParams = getProvablyFairParams(newGameState);
    const newMines: Record<number, number[]> = {};
    
    for (let row = 0; row < ROWS; row++) {
      const minePositions: number[] = [];
      
      // For each row, place the specified number of mines
      for (let i = 0; i < minesPerRow; i++) {
        let position;
        let tries = 0;
        
        // Find a unique position that's not already mined
        do {
          // Add randomness to cursor to avoid repetitive patterns
          const modifiedParams = {
            ...fairParams,
            cursor: (row * 100) + (i * 10) + tries + Math.floor(Math.random() * 1000)
          };
          
          position = generateRandomNumber(modifiedParams, 0, TILES_PER_ROW - 1);
          tries++;
        } while (minePositions.includes(position) && tries < 50);
        
        if (!minePositions.includes(position)) {
          minePositions.push(position);
        }
      }
      
      // Ensure we have exactly minesPerRow mines for this row
      while (minePositions.length < minesPerRow) {
        let position = Math.floor(Math.random() * TILES_PER_ROW);
        if (!minePositions.includes(position)) {
          minePositions.push(position);
        }
      }
      
      newMines[row] = minePositions;
    }
    
    setMines(newMines);
    setRevealedSafeTiles({});
    setCurrentRow(0);
    setSelectedTile(null);
    setGameActive(true);
    setGameOver(false);
    setMultiplier(1.0);
    setGameResult(null);
    
    // Deduct bet amount from balance
    updateBalance((user?.balance || 0) - betValue);
  };
  
  const handleTileClick = (row: number, tile: number) => {
    if (!gameActive || gameOver || row !== currentRow || selectedTile !== null) {
      return;
    }
    
    setSelectedTile(tile);
    
    // Check if clicked on a mine
    if (mines[row] && mines[row].includes(tile)) {
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
    
    // Successfully selected a safe tile
    const newRevealedSafeTiles = { ...revealedSafeTiles };
    if (!newRevealedSafeTiles[row]) {
      newRevealedSafeTiles[row] = [];
    }
    newRevealedSafeTiles[row].push(tile);
    setRevealedSafeTiles(newRevealedSafeTiles);
    
    // Get multipliers for current mine count
    const rowMultipliers = getRowMultipliers();
    
    // Set the multiplier based on the current row
    setMultiplier(rowMultipliers[row]);
    
    // Check if reached the top (win condition)
    if (row === ROWS - 1) {
      cashout();
      return;
    }
    
    // Move to the next row
    setTimeout(() => {
      setCurrentRow(row + 1);
      setSelectedTile(null);
    }, 500);
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
    
    // Add winnings to balance
    updateBalance((user?.balance || 0) + winAmount);
    
    toast({
      title: "Cashed Out!",
      description: `You won ${winAmount.toFixed(2)} credits!`,
    });
  };
  
  const renderTowerRow = (row: number) => {
    const isCurrentRow = row === currentRow;
    const rowCompleted = row < currentRow;
    const rowMultipliers = getRowMultipliers();
    
    return (
      <div
        key={`row-${row}`}
        className={`flex justify-center space-x-2 ${
          rowCompleted ? "opacity-50" : isCurrentRow ? "opacity-100" : "opacity-30"
        }`}
      >
        {Array.from({ length: TILES_PER_ROW }).map((_, tile) => {
          const isMine = mines[row]?.includes(tile);
          const isRevealed = revealedSafeTiles[row]?.includes(tile) || (gameOver && isMine);
          const isSelected = row === currentRow && tile === selectedTile;
          
          return (
            <button
              key={`tile-${row}-${tile}`}
              onClick={() => handleTileClick(row, tile)}
              disabled={!isCurrentRow || !gameActive || gameOver}
              className={`w-14 h-14 rounded-md flex items-center justify-center transition-all ${
                isRevealed
                  ? isMine
                    ? "bg-red-600"
                    : "bg-green-600"
                  : isSelected
                  ? "bg-yellow-500"
                  : "bg-zinc-800 hover:bg-zinc-700 border border-zinc-700"
              }`}
            ></button>
          );
        })}
        
        <div className="flex items-center ml-4">
          <span className="text-green-500 font-medium">{rowMultipliers[row]}x</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Tower</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardContent className="p-4">
            <div className="flex flex-col space-y-6 py-6">
              {/* Tower rows - displayed in reverse order (top to bottom) */}
              {Array.from({ length: ROWS }).map((_, i) => renderTowerRow(ROWS - 1 - i))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 space-y-4">
            {/* Game controls */}
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
                <Label htmlFor="mines-per-row">Mines Per Row</Label>
                <div className="flex space-x-2">
                  {[1, 2, 3].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={minesPerRow === value ? "default" : "outline"}
                      className={minesPerRow === value ? "bg-purple-600" : "border-zinc-700"}
                      onClick={() => setMinesPerRow(value)}
                      disabled={gameActive}
                    >
                      {value}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Current Multiplier</p>
                <p className="text-2xl font-bold text-green-500">{multiplier.toFixed(2)}x</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Potential Win</p>
                <p className="text-xl font-medium">
                  {((parseFloat(betAmount) || 0) * multiplier).toFixed(2)} Credits
                </p>
              </div>
            </div>
            
            <div className="flex flex-col space-y-2">
              {!gameActive && !gameOver && (
                <Button
                  onClick={startNewGame}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!isAuthenticated}
                >
                  Start Game
                </Button>
              )}
              
              {gameOver && (
                <Button
                  onClick={startNewGame}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!isAuthenticated}
                >
                  New Game
                </Button>
              )}
              
              {gameActive && !gameOver && (
                <Button
                  onClick={cashout}
                  variant="outline"
                  className="border-green-500 text-green-500 hover:bg-green-500/20"
                >
                  Cashout ({((parseFloat(betAmount) || 0) * multiplier).toFixed(2)})
                </Button>
              )}
            </div>
            
            {gameResult && (
              <div className={`p-3 rounded-md ${
                gameResult === "win" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
              }`}>
                <p className="text-center font-medium">
                  {gameResult === "win"
                    ? `You won ${((parseFloat(betAmount) || 0) * multiplier).toFixed(2)} credits!`
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
                <strong>How to play:</strong> Click on a safe tile in each row to advance to the next level.
              </p>
              <p>
                Each row you climb increases your multiplier. Press Cashout any time to collect your winnings.
                More mines per row means higher risk but also higher rewards!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TowerGame;
