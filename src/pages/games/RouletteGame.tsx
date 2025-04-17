import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateRandomNumber,
} from "@/utils/provablyFair";

// Types
interface BetType {
  type: "number" | "color" | "column" | "dozen" | "half" | "even-odd";
  value: string | number;
  multiplier: number;
  label: string;
  amount: string; // Changed to string to match how we handle betAmount
}

// Get color for a number
const getNumberColor = (number: number): "red" | "black" | "green" => {
  if (number === 0) return "green";
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(number) ? "red" : "black";
};

const RouletteGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState<string>("100");
  const [activeBets, setActiveBets] = useState<BetType[]>([]);
  const [fairState, setFairState] = useState(createDefaultGameState());
  const [spinning, setSpinning] = useState<boolean>(false);
  const [result, setResult] = useState<number | null>(null);
  const [resultColor, setResultColor] = useState<"red" | "black" | "green" | null>(null);
  const [totalBetAmount, setTotalBetAmount] = useState<number>(0);
  const [winnings, setWinnings] = useState<number | null>(null);
  const [wheelRef, setWheelRef] = useState<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = useState<string>("inside-bets");
  
  const rouletteWheelRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (rouletteWheelRef.current) {
      setWheelRef(rouletteWheelRef.current);
    }
  }, []);
  
  useEffect(() => {
    // Calculate total bet amount
    const total = activeBets.reduce((sum, bet) => sum + parseFloat(bet.amount || "0"), 0);
    setTotalBetAmount(total);
  }, [activeBets]);
  
  // Add a bet to active bets
  const addBet = (type: BetType['type'], value: string | number, multiplier: number, label: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Not logged in",
        description: "Please login to play",
        variant: "destructive",
      });
      return;
    }

    const bet = parseFloat(betAmount);
    if (isNaN(bet) || bet <= 0) {
      toast({
        title: "Invalid bet",
        description: "Please enter a valid bet amount",
        variant: "destructive",
      });
      return;
    }

    if (bet > (user?.balance || 0)) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough credits",
        variant: "destructive",
      });
      return;
    }

    // Check for existing bet of the same type and value
    const existingBetIndex = activeBets.findIndex(
      (activeBet) => activeBet.type === type && activeBet.value === value
    );

    if (existingBetIndex !== -1) {
      // Update existing bet
      const updatedBets = [...activeBets];
      const currentAmount = parseFloat(updatedBets[existingBetIndex].amount);
      const newAmount = currentAmount + bet;
      updatedBets[existingBetIndex] = {
        ...updatedBets[existingBetIndex],
        amount: newAmount.toString(),
      };
      setActiveBets(updatedBets);
    } else {
      // Add new bet
      setActiveBets((prev) => [...prev, { type, value, multiplier, label, amount: bet.toString() }]);
    }

    // Deduct bet from balance
    updateBalance((user?.balance || 0) - bet);
    
    toast({
      title: "Bet placed",
      description: `${bet} credits on ${label}`,
    });
  };
  
  // Remove a bet
  const removeBet = (index: number) => {
    const bet = activeBets[index];
    const betAmount = parseFloat(bet.amount);
    
    // Refund bet to balance
    updateBalance((user?.balance || 0) + betAmount);
    
    // Remove bet from active bets
    setActiveBets((prev) => prev.filter((_, i) => i !== index));
    
    toast({
      title: "Bet removed",
      description: `${betAmount} credits refunded`,
    });
  };
  
  // Clear all bets
  const clearBets = () => {
    // Refund all bets
    const refundAmount = activeBets.reduce((sum, bet) => sum + parseFloat(bet.amount), 0);
    updateBalance((user?.balance || 0) + refundAmount);
    
    setActiveBets([]);
    
    toast({
      title: "All bets cleared",
      description: `${refundAmount} credits refunded`,
    });
  };
  
  // Spin the wheel
  const spinWheel = () => {
    if (activeBets.length === 0) {
      toast({
        title: "No bets placed",
        description: "Place at least one bet to spin the wheel",
        variant: "destructive",
      });
      return;
    }
    
    setSpinning(true);
    setWinnings(null);
    
    // Get provably fair result (0-36)
    const params = getProvablyFairParams(fairState);
    const rouletteResult = generateRandomNumber(params, 0, 36);
    
    // Create a new game state for next round
    setFairState(createDefaultGameState());
    
    // Animate spin
    if (wheelRef) {
      const spinDuration = 5000; // 5 seconds spin
      const spinDegrees = 1080 + (rouletteResult * 9.73); // Multiple full rotations + position
      
      wheelRef.style.transition = `transform ${spinDuration}ms cubic-bezier(0.32, 0.64, 0.45, 1)`;
      wheelRef.style.transform = `rotate(${spinDegrees}deg)`;
      
      setTimeout(() => {
        setResult(rouletteResult);
        setResultColor(getNumberColor(rouletteResult));
        
        // Calculate winnings
        const resultWinnings = calculateWinnings(rouletteResult);
        setWinnings(resultWinnings);
        
        // Update player balance with winnings
        if (resultWinnings > 0) {
          updateBalance((user?.balance || 0) + resultWinnings);
          toast({
            title: "You won!",
            description: `You won ${resultWinnings} credits`,
          });
        } else {
          toast({
            title: "Better luck next time",
            description: `Ball landed on ${rouletteResult} ${getNumberColor(rouletteResult)}`,
            variant: "destructive",
          });
        }
        
        setSpinning(false);
        setActiveBets([]);
      }, spinDuration);
    }
  };
  
  // Calculate winnings based on result
  const calculateWinnings = (result: number): number => {
    let totalWinnings = 0;
    
    activeBets.forEach((bet) => {
      const betAmount = parseFloat(bet.amount);
      let win = false;
      
      switch (bet.type) {
        case "number":
          // Straight up bet on a single number
          if (bet.value === result) {
            win = true;
            totalWinnings += betAmount * bet.multiplier;
          }
          break;
          
        case "color":
          // Red or black
          const resultColor = getNumberColor(result);
          if ((bet.value === "red" && resultColor === "red") || 
              (bet.value === "black" && resultColor === "black")) {
            win = true;
            totalWinnings += betAmount * bet.multiplier;
          }
          break;
          
        case "even-odd":
          // Even or odd
          if (result !== 0) {
            if ((bet.value === "even" && result % 2 === 0) || 
                (bet.value === "odd" && result % 2 !== 0)) {
              win = true;
              totalWinnings += betAmount * bet.multiplier;
            }
          }
          break;
          
        case "half":
          // 1-18 or 19-36
          if ((bet.value === "1-18" && result >= 1 && result <= 18) || 
              (bet.value === "19-36" && result >= 19 && result <= 36)) {
            win = true;
            totalWinnings += betAmount * bet.multiplier;
          }
          break;
          
        case "dozen":
          // Dozens (1-12, 13-24, 25-36)
          if ((bet.value === "1-12" && result >= 1 && result <= 12) || 
              (bet.value === "13-24" && result >= 13 && result <= 24) || 
              (bet.value === "25-36" && result >= 25 && result <= 36)) {
            win = true;
            totalWinnings += betAmount * bet.multiplier;
          }
          break;
          
        case "column":
          // Columns
          if (result !== 0) {
            if ((bet.value === "column1" && result % 3 === 1) || 
                (bet.value === "column2" && result % 3 === 2) || 
                (bet.value === "column3" && result % 3 === 0)) {
              win = true;
              totalWinnings += betAmount * bet.multiplier;
            }
          }
          break;
      }
    });
    
    return totalWinnings;
  };
  
  // Render roulette wheel
  const renderRouletteWheel = () => {
    return (
      <div className="relative w-64 h-64 mx-auto">
        <div
          ref={rouletteWheelRef}
          className="absolute inset-0 bg-zinc-800 rounded-full transition-transform duration-0 ease-linear"
          style={{ transform: 'rotate(0deg)' }}
        >
          {/* Number segments */}
          {Array.from({ length: 37 }).map((_, i) => {
            const degrees = i * (360 / 37);
            const color = getNumberColor(i);
            
            return (
              <div
                key={i}
                className="absolute inset-0 flex items-center justify-end overflow-hidden"
                style={{
                  transform: `rotate(${degrees}deg)`,
                }}
              >
                <div
                  className={`absolute h-0 w-0 border-y-[32px] border-l-[50px] border-r-0`}
                  style={{
                    borderLeftColor: color === "red" ? "#dc2626" : color === "black" ? "#000000" : "#16a34a",
                    transformOrigin: "0 0",
                    transform: "rotate(90deg) translateX(-100%)",
                  }}
                />
                <span
                  className="absolute right-2 text-white font-bold"
                  style={{
                    transform: "rotate(90deg)",
                  }}
                >
                  {i}
                </span>
              </div>
            );
          })}
        </div>
        
        {/* Arrow indicator */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-yellow-500 text-2xl">
          <ArrowRight />
        </div>
      </div>
    );
  };
  
  // Render bet table
  const renderBetTable = () => {
    return (
      <Tabs defaultValue="inside-bets" className="w-full">
        <TabsList className="grid grid-cols-2 gap-2 mb-4">
          <TabsTrigger value="inside-bets">Inside Bets</TabsTrigger>
          <TabsTrigger value="outside-bets">Outside Bets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="inside-bets" className="grid grid-cols-12 gap-1">
          {/* Numbers 1-36 */}
          {Array.from({ length: 36 }).map((_, i) => {
            const number = i + 1;
            const color = getNumberColor(number);
            
            return (
              <Button
                key={number}
                variant="outline"
                className={cn(
                  "col-span-1 h-10 flex items-center justify-center rounded-none border-zinc-700",
                  color === "red" ? "bg-red-600/20 hover:bg-red-700/30" : "bg-black/20 hover:bg-zinc-700/30",
                  spinning ? "cursor-not-allowed" : "cursor-pointer"
                )}
                onClick={() => addBet("number", number, 35, `Number ${number}`)}
                disabled={spinning}
              >
                {number}
              </Button>
            );
          })}
          
          {/* Zero */}
          <Button
            variant="outline"
            className={cn(
              "col-span-2 h-10 flex items-center justify-center rounded-none border-zinc-700 bg-green-600/20 hover:bg-green-700/30",
              spinning ? "cursor-not-allowed" : "cursor-pointer"
            )}
            onClick={() => addBet("number", 0, 35, "Number 0")}
            disabled={spinning}
          >
            0
          </Button>
        </TabsContent>
        
        <TabsContent value="outside-bets" className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-red-600/20 hover:bg-red-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("color", "red", 1, "Red")}
              disabled={spinning}
            >
              Red
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-black/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("color", "black", 1, "Black")}
              disabled={spinning}
            >
              Black
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("even-odd", "even", 1, "Even")}
              disabled={spinning}
            >
              Even
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("even-odd", "odd", 1, "Odd")}
              disabled={spinning}
            >
              Odd
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("half", "1-18", 1, "1-18")}
              disabled={spinning}
            >
              1-18
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("half", "19-36", 1, "19-36")}
              disabled={spinning}
            >
              19-36
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("dozen", "1-12", 2, "1-12")}
              disabled={spinning}
            >
              1-12
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("dozen", "13-24", 2, "13-24")}
              disabled={spinning}
            >
              13-24
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("dozen", "25-36", 2, "25-36")}
              disabled={spinning}
            >
              25-36
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("column", "column1", 2, "Column 1")}
              disabled={spinning}
            >
              Column 1
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("column", "column2", 2, "Column 2")}
              disabled={spinning}
            >
              Column 2
            </Button>
            <Button
              variant="outline"
              className={cn(
                "h-10 flex items-center justify-center rounded-none border-zinc-700 bg-zinc-800/20 hover:bg-zinc-700/30",
                spinning ? "cursor-not-allowed" : "cursor-pointer"
              )}
              onClick={() => addBet("column", "column3", 2, "Column 3")}
              disabled={spinning}
            >
              Column 3
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    );
  };
  
  // Render active bets
  const renderActiveBets = () => {
    if (activeBets.length === 0) {
      return (
        <div className="text-center text-zinc-400 py-6">
          No active bets. Place a bet to begin.
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {activeBets.map((bet, index) => (
          <div key={index} className="flex items-center justify-between bg-zinc-800 p-2 rounded-md">
            <div>
              <span className="font-medium">{bet.label}</span>
              <span className="text-sm text-zinc-400 ml-2">{bet.multiplier}x</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>{bet.amount} ₡</span>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-7 w-7 p-0 border-zinc-700"
                onClick={() => removeBet(index)}
                disabled={spinning}
              >
                ×
              </Button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Roulette</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardContent className="p-6 space-y-4">
            {renderRouletteWheel()}
            
            <div className="text-center">
              <p className={`text-xl font-bold ${
                resultColor === "red" ? "text-red-500" : 
                resultColor === "black" ? "text-zinc-300" : 
                "text-green-500"
              }`}>
                {spinning ? "Spinning..." : result !== null ? `Result: ${result} ${resultColor}` : "Place your bets!"}
              </p>
              {winnings !== null && (
                <p className="text-green-500">
                  {winnings > 0 ? `You won ${winnings} credits!` : "Better luck next time!"}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-3">
              <div className="space-y-2">
                <label htmlFor="bet-amount" className="text-sm font-medium block">
                  Bet Amount
                </label>
                <Input
                  id="bet-amount"
                  type="number"
                  min="1"
                  step="1"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-zinc-800 border-zinc-700"
                  disabled={spinning}
                />
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Total Bet Amount</p>
                <p className="text-xl font-medium">
                  {totalBetAmount.toLocaleString()} Credits
                </p>
              </div>
            </div>
            
            {renderBetTable()}
            
            <div className="space-y-2">
              <h4 className="text-lg font-medium">Active Bets</h4>
              {renderActiveBets()}
            </div>
            
            <div className="flex flex-col space-y-2">
              <Button
                onClick={spinWheel}
                className="bg-purple-600 hover:bg-purple-700"
                disabled={spinning || activeBets.length === 0}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Spin Wheel
              </Button>
              <Button
                variant="outline"
                onClick={clearBets}
                className="border-zinc-700 hover:bg-zinc-800"
                disabled={spinning || activeBets.length === 0}
              >
                Clear Bets
              </Button>
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
                <strong>How to play:</strong> Place bets on numbers, colors, or sections of the roulette wheel.
              </p>
              <p className="mb-2">
                The wheel is spun, and a ball lands on a number, determining the winners.
              </p>
              <p>
                Different bets have different payout odds, as shown in the bet table.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouletteGame;
