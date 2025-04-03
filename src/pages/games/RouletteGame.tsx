
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, RefreshCw } from "lucide-react";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateRandomNumber,
} from "@/utils/provablyFair";

// Types for bet positions
type BetPosition = 
  | "straight" 
  | "split" 
  | "street" 
  | "corner" 
  | "fiveNumber" 
  | "sixLine" 
  | "dozen" 
  | "column" 
  | "red" 
  | "black" 
  | "odd" 
  | "even" 
  | "high" 
  | "low";

interface Bet {
  position: BetPosition;
  numbers: number[];
  amount: number;
  payout: number;
}

const RouletteGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState<string>("100");
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [outcome, setOutcome] = useState<number | null>(null);
  const [previousOutcomes, setPreviousOutcomes] = useState<number[]>([]);
  const [bets, setBets] = useState<Bet[]>([]);
  const [gameState, setGameState] = useState(createDefaultGameState());
  const [message, setMessage] = useState<string>("Place your bets to begin");
  const [totalBet, setTotalBet] = useState<number>(0);
  const [highlightedNumbers, setHighlightedNumbers] = useState<number[]>([]);
  
  // Roulette numbers and colors
  const numbers = Array.from({ length: 37 }, (_, i) => i); // 0-36
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  
  // Get number color
  const getNumberColor = (num: number): "red" | "black" | "green" => {
    if (num === 0) return "green";
    return redNumbers.includes(num) ? "red" : "black";
  };
  
  // Payout ratios for different bet types
  const payoutRatios: Record<BetPosition, number> = {
    straight: 35,    // 35 to 1
    split: 17,       // 17 to 1
    street: 11,      // 11 to 1
    corner: 8,       // 8 to 1
    fiveNumber: 6,   // 6 to 1
    sixLine: 5,      // 5 to 1
    dozen: 2,        // 2 to 1
    column: 2,       // 2 to 1
    red: 1,          // 1 to 1
    black: 1,        // 1 to 1
    odd: 1,          // 1 to 1
    even: 1,         // 1 to 1
    high: 1,         // 1 to 1
    low: 1,          // 1 to 1
  };
  
  // Bet descriptions for the UI
  const betDescriptions: Record<BetPosition, string> = {
    straight: "Single Number",
    split: "Two Adjacent Numbers",
    street: "Three Numbers in a Row",
    corner: "Four Numbers in a Square",
    fiveNumber: "0, 00, 1, 2, 3",
    sixLine: "Six Numbers (Two Rows)",
    dozen: "Dozen (1-12, 13-24, 25-36)",
    column: "Column",
    red: "Red",
    black: "Black",
    odd: "Odd",
    even: "Even",
    high: "High (19-36)",
    low: "Low (1-18)",
  };
  
  // Reset the game and start a new round
  const resetGame = () => {
    setBets([]);
    setOutcome(null);
    setGameActive(false);
    setSpinning(false);
    setTotalBet(0);
    setMessage("Place your bets to begin");
    setHighlightedNumbers([]);
  };
  
  // Add a bet
  const placeBet = (position: BetPosition, numbers: number[]) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please login to play",
      });
      return;
    }
    
    if (spinning) return;
    
    const betValue = parseFloat(betAmount);
    
    if (isNaN(betValue) || betValue <= 0) {
      toast({
        variant: "destructive",
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
      });
      return;
    }
    
    const newTotalBet = totalBet + betValue;
    
    if (newTotalBet > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits",
      });
      return;
    }
    
    // Add new bet
    const newBet: Bet = {
      position,
      numbers,
      amount: betValue,
      payout: payoutRatios[position],
    };
    
    setBets([...bets, newBet]);
    setTotalBet(newTotalBet);
    setGameActive(true);
    setMessage("Bet placed. Add more bets or spin the wheel.");
  };
  
  // Spin the wheel and determine outcome
  const spinWheel = () => {
    if (!gameActive || spinning || bets.length === 0) return;
    
    // Deduct total bet amount from balance
    updateBalance((user?.balance || 0) - totalBet);
    
    // Create a new game state for provably fair results
    const newGameState = createDefaultGameState();
    setGameState(newGameState);
    
    // Start spinning animation
    setSpinning(true);
    setMessage("Wheel spinning...");
    
    // Generate outcome using provably fair method
    const params = getProvablyFairParams(newGameState);
    const result = generateRandomNumber(params, 0, 36);
    
    // Simulate spinning delay
    setTimeout(() => {
      setOutcome(result);
      setPreviousOutcomes(prev => [result, ...prev].slice(0, 10));
      
      // Calculate winnings
      calculateWinnings(result);
      
      setSpinning(false);
    }, 3000);
  };
  
  // Calculate and distribute winnings
  const calculateWinnings = (result: number) => {
    let totalWinnings = 0;
    const winningBets: Bet[] = [];
    
    bets.forEach(bet => {
      if (bet.numbers.includes(result)) {
        // This bet is a winner
        const winAmount = bet.amount * (bet.payout + 1); // Payout plus original bet
        totalWinnings += winAmount;
        winningBets.push(bet);
      }
    });
    
    if (totalWinnings > 0) {
      // Add winnings to balance
      updateBalance((user?.balance || 0) + totalWinnings);
      
      toast({
        title: "You Won!",
        description: `You won ${totalWinnings.toFixed(2)} credits!`,
      });
      
      setMessage(`You won ${totalWinnings.toFixed(2)} credits! Place new bets to play again.`);
    } else {
      toast({
        variant: "destructive",
        title: "You Lost",
        description: `No winning bets. You lost ${totalBet} credits.`,
      });
      
      setMessage("No winning bets. Place new bets to play again.");
    }
    
    resetGame();
  };
  
  // Highlight numbers on hover
  const highlightBetNumbers = (numbers: number[]) => {
    setHighlightedNumbers(numbers);
  };
  
  // Clear highlighted numbers
  const clearHighlight = () => {
    setHighlightedNumbers([]);
  };
  
  // Render the roulette wheel (simplified visual representation)
  const renderWheel = () => {
    return (
      <div className="relative w-full max-w-xs mx-auto aspect-square rounded-full bg-gradient-to-br from-zinc-800 to-zinc-950 border-4 border-zinc-700 overflow-hidden">
        {spinning ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>
        ) : outcome !== null ? (
          <div className="absolute inset-0 flex items-center justify-center flex-col">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold ${
              outcome === 0 
                ? "bg-green-600" 
                : getNumberColor(outcome) === "red" 
                ? "bg-red-600" 
                : "bg-black"
            }`}>
              {outcome}
            </div>
            <p className="mt-2 text-sm">
              {outcome === 0 ? "Green" : getNumberColor(outcome)}
            </p>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-xl font-medium">Place Bets</p>
          </div>
        )}
      </div>
    );
  };
  
  // Render the betting board
  const renderBettingBoard = () => {
    // Create the number grid (3 rows x 12 columns + 0)
    const rows = [
      [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
      [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
      [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
    ];
    
    return (
      <div className="w-full max-w-3xl mx-auto">
        <div className="grid grid-cols-13 gap-px bg-zinc-700 border border-zinc-700 mb-4">
          {/* Zero */}
          <div 
            className={`col-span-1 row-span-3 bg-green-600 hover:bg-green-500 flex items-center justify-center cursor-pointer transition-colors ${
              highlightedNumbers.includes(0) ? "ring-2 ring-white" : ""
            }`}
            onClick={() => placeBet("straight", [0])}
            onMouseEnter={() => highlightBetNumbers([0])}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">0</span>
          </div>
          
          {/* Number grid */}
          {rows.map((row, rowIndex) => (
            <React.Fragment key={rowIndex}>
              {row.map(num => (
                <div 
                  key={num}
                  className={`col-span-1 aspect-square ${
                    getNumberColor(num) === "red" ? "bg-red-600 hover:bg-red-500" : "bg-black hover:bg-zinc-800"
                  } flex items-center justify-center cursor-pointer transition-colors ${
                    highlightedNumbers.includes(num) ? "ring-2 ring-white" : ""
                  }`}
                  onClick={() => placeBet("straight", [num])}
                  onMouseEnter={() => highlightBetNumbers([num])}
                  onMouseLeave={clearHighlight}
                >
                  <span className="text-white font-bold">{num}</span>
                </div>
              ))}
            </React.Fragment>
          ))}
          
          {/* 2:1 column bets */}
          <div 
            className="col-span-1 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
            onClick={() => placeBet("column", [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36])}
            onMouseEnter={() => highlightBetNumbers([3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36])}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">2:1</span>
          </div>
          <div 
            className="col-span-1 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
            onClick={() => placeBet("column", [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35])}
            onMouseEnter={() => highlightBetNumbers([2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35])}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">2:1</span>
          </div>
          <div 
            className="col-span-1 bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center cursor-pointer"
            onClick={() => placeBet("column", [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34])}
            onMouseEnter={() => highlightBetNumbers([1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34])}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">2:1</span>
          </div>
        </div>
        
        {/* Bottom betting options */}
        <div className="grid grid-cols-6 gap-2 mb-4">
          {/* Dozens */}
          <div 
            className="col-span-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-center cursor-pointer rounded"
            onClick={() => placeBet("dozen", [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
            onMouseEnter={() => highlightBetNumbers([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">1st Dozen (1-12)</span>
          </div>
          <div 
            className="col-span-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-center cursor-pointer rounded"
            onClick={() => placeBet("dozen", [13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24])}
            onMouseEnter={() => highlightBetNumbers([13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24])}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">2nd Dozen (13-24)</span>
          </div>
          <div 
            className="col-span-2 py-2 bg-zinc-800 hover:bg-zinc-700 text-center cursor-pointer rounded"
            onClick={() => placeBet("dozen", [25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36])}
            onMouseEnter={() => highlightBetNumbers([25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36])}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">3rd Dozen (25-36)</span>
          </div>
        </div>
        
        <div className="grid grid-cols-6 gap-2">
          {/* Even/Odd, Red/Black, High/Low */}
          <div 
            className="col-span-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-center cursor-pointer rounded"
            onClick={() => placeBet("low", Array.from({ length: 18 }, (_, i) => i + 1))}
            onMouseEnter={() => highlightBetNumbers(Array.from({ length: 18 }, (_, i) => i + 1))}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">1-18</span>
          </div>
          <div 
            className="col-span-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-center cursor-pointer rounded"
            onClick={() => placeBet("even", Array.from({ length: 18 }, (_, i) => (i + 1) * 2))}
            onMouseEnter={() => highlightBetNumbers(Array.from({ length: 18 }, (_, i) => (i + 1) * 2))}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">Even</span>
          </div>
          <div 
            className="col-span-1 py-2 bg-red-600 hover:bg-red-500 text-center cursor-pointer rounded"
            onClick={() => placeBet("red", redNumbers)}
            onMouseEnter={() => highlightBetNumbers(redNumbers)}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">Red</span>
          </div>
          <div 
            className="col-span-1 py-2 bg-black hover:bg-zinc-800 text-center cursor-pointer rounded"
            onClick={() => placeBet("black", numbers.filter(n => n !== 0 && !redNumbers.includes(n)))}
            onMouseEnter={() => highlightBetNumbers(numbers.filter(n => n !== 0 && !redNumbers.includes(n)))}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">Black</span>
          </div>
          <div 
            className="col-span-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-center cursor-pointer rounded"
            onClick={() => placeBet("odd", Array.from({ length: 18 }, (_, i) => (i * 2) + 1))}
            onMouseEnter={() => highlightBetNumbers(Array.from({ length: 18 }, (_, i) => (i * 2) + 1))}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">Odd</span>
          </div>
          <div 
            className="col-span-1 py-2 bg-zinc-800 hover:bg-zinc-700 text-center cursor-pointer rounded"
            onClick={() => placeBet("high", Array.from({ length: 18 }, (_, i) => i + 19))}
            onMouseEnter={() => highlightBetNumbers(Array.from({ length: 18 }, (_, i) => i + 19))}
            onMouseLeave={clearHighlight}
          >
            <span className="text-white font-bold">19-36</span>
          </div>
        </div>
      </div>
    );
  };
  
  // Render previous results
  const renderPreviousOutcomes = () => {
    if (previousOutcomes.length === 0) return null;
    
    return (
      <div className="mt-4">
        <p className="text-sm text-zinc-400 mb-2">Previous Results:</p>
        <div className="flex flex-wrap gap-2">
          {previousOutcomes.map((num, index) => (
            <div 
              key={index} 
              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm ${
                num === 0 
                  ? "bg-green-600" 
                  : getNumberColor(num) === "red" 
                  ? "bg-red-600" 
                  : "bg-black"
              }`}
            >
              {num}
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render active bets
  const renderActiveBets = () => {
    if (bets.length === 0) return null;
    
    return (
      <div className="mt-4">
        <p className="text-sm text-zinc-400 mb-2">Your Bets:</p>
        <div className="space-y-2">
          {bets.map((bet, index) => (
            <div key={index} className="flex justify-between bg-zinc-800 p-2 rounded">
              <div>
                <span className="text-sm">{betDescriptions[bet.position]}</span>
                {bet.position === "straight" && (
                  <span className="ml-2 text-sm">#{bet.numbers[0]}</span>
                )}
              </div>
              <div className="text-sm">{bet.amount} Credits</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex justify-between font-medium">
          <span>Total Bet:</span>
          <span>{totalBet} Credits</span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Roulette</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-4">
              <div>
                {renderWheel()}
                {renderPreviousOutcomes()}
              </div>
              
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
                    disabled={spinning}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                
                {renderActiveBets()}
                
                <div className="flex flex-col space-y-2">
                  <Button
                    onClick={spinWheel}
                    className="bg-purple-600 hover:bg-purple-700"
                    disabled={!gameActive || spinning || bets.length === 0 || !isAuthenticated}
                  >
                    {spinning ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Spinning...
                      </>
                    ) : (
                      "Spin the Wheel"
                    )}
                  </Button>
                  
                  {bets.length > 0 && !spinning && (
                    <Button
                      onClick={resetGame}
                      variant="outline"
                      className="border-red-500 text-red-500 hover:bg-red-500/20"
                    >
                      Clear Bets
                    </Button>
                  )}
                </div>
              </div>
              
              <div className="text-center">
                <p className={`text-sm ${
                  outcome !== null && previousOutcomes.length > 0
                    ? getNumberColor(previousOutcomes[0]) === "green"
                      ? "text-green-500"
                      : getNumberColor(previousOutcomes[0]) === "red"
                      ? "text-red-500"
                      : "text-zinc-300"
                    : "text-zinc-300"
                }`}>
                  {message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              {renderBettingBoard()}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4 text-sm text-zinc-400">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-2">
                <strong>How to play:</strong> Place bets on where you think the ball will land on the roulette wheel.
              </p>
              <p className="mb-2">
                <strong>Inside Bets:</strong> Straight (35:1), Split (17:1), Street (11:1), Corner (8:1), Six Line (5:1)
              </p>
              <p>
                <strong>Outside Bets:</strong> Dozens/Columns (2:1), Even/Odd, Red/Black, High/Low (1:1)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouletteGame;
