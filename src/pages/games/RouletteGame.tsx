
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { RefreshCw, AlertTriangle } from "lucide-react";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateRandomNumber,
} from "@/utils/provablyFair";

// Roulette numbers and colors
const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

type NumberColor = 'red' | 'black' | 'green';

interface BetType {
  type: 'number' | 'color' | 'column' | 'dozen' | 'half' | 'even-odd';
  value: string | number; 
  multiplier: number;
  label: string;
  amount?: string; // Add the amount property to fix the type error
}

// Get color for a number
const getNumberColor = (num: number): NumberColor => {
  if (num === 0) return 'green';
  const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  return redNumbers.includes(num) ? 'red' : 'black';
};

const RouletteGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [fairState, setFairState] = useState(createDefaultGameState());
  const [betAmount, setBetAmount] = useState<string>("500");
  const [selectedBets, setSelectedBets] = useState<BetType[]>([]);
  const [spinResult, setSpinResult] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnings, setWinnings] = useState<number>(0);
  const [gameHistory, setGameHistory] = useState<number[]>([]);
  const [lastBets, setLastBets] = useState<BetType[]>([]);

  // Reset game state
  const resetGame = () => {
    setSelectedBets([]);
    setSpinResult(null);
    setWinnings(0);
    setIsSpinning(false);
  };

  // Add a bet
  const addBet = (bet: BetType) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please login to place bets",
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
    
    const newBet = { ...bet, amount: betValue };
    setSelectedBets(prev => [...prev, newBet]);
    
    // Deduct bet amount from balance
    updateBalance((user?.balance || 0) - betValue);
    
    toast({
      title: "Bet Placed",
      description: `${bet.label}: ${betValue} credits`,
    });
  };

  // Spin the wheel
  const spinWheel = () => {
    if (selectedBets.length === 0) {
      toast({
        variant: "destructive",
        title: "No bets placed",
        description: "Please place at least one bet before spinning",
      });
      return;
    }
    
    setIsSpinning(true);
    setLastBets([...selectedBets]);
    
    // Create a new game state for provably fair results
    const newGameState = createDefaultGameState();
    setFairState(newGameState);
    
    // Generate a random number using provably fair algorithm
    const params = getProvablyFairParams(newGameState);
    const randomIndex = generateRandomNumber(params, 0, ROULETTE_NUMBERS.length - 1);
    const result = ROULETTE_NUMBERS[randomIndex];
    
    // Simulate spinning animation
    setTimeout(() => {
      setSpinResult(result);
      setIsSpinning(false);
      calculateWinnings(result);
      
      // Add to history
      setGameHistory(prev => [result, ...prev].slice(0, 10));
    }, 3000);
  };

  // Calculate winnings based on bets and result
  const calculateWinnings = (result: number) => {
    const resultColor = getNumberColor(result);
    let totalWinnings = 0;
    
    selectedBets.forEach(bet => {
      let win = false;
      const betAmount = parseFloat(bet.amount as string);
      
      switch (bet.type) {
        case 'number':
          win = result === bet.value;
          break;
        case 'color':
          win = bet.value === resultColor;
          break;
        case 'column':
          // Column 1: numbers ending in 1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34
          // Column 2: numbers ending in 2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35
          // Column 3: numbers ending in 3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36
          if (result === 0) win = false;
          else {
            const column = ((result - 1) % 3) + 1;
            win = column === parseInt(bet.value as string);
          }
          break;
        case 'dozen':
          // First dozen: 1-12, Second dozen: 13-24, Third dozen: 25-36
          if (result === 0) win = false;
          else {
            const dozen = Math.ceil(result / 12);
            win = dozen === parseInt(bet.value as string);
          }
          break;
        case 'half':
          // First half: 1-18, Second half: 19-36
          if (result === 0) win = false;
          else {
            win = bet.value === '1' ? result <= 18 : result >= 19;
          }
          break;
        case 'even-odd':
          if (result === 0) win = false;
          else {
            win = bet.value === 'even' ? result % 2 === 0 : result % 2 === 1;
          }
          break;
      }
      
      if (win) {
        const winAmount = betAmount * bet.multiplier;
        totalWinnings += winAmount;
      }
    });
    
    setWinnings(totalWinnings);
    
    if (totalWinnings > 0) {
      // Add winnings to balance
      updateBalance((user?.balance || 0) + totalWinnings);
      
      toast({
        title: "You Won!",
        description: `You won ${totalWinnings.toLocaleString()} credits!`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "No Wins",
        description: "Better luck next time!",
      });
    }
  };

  // Repeat last bets
  const repeatLastBets = () => {
    if (lastBets.length === 0) {
      toast({
        variant: "destructive",
        title: "No previous bets",
        description: "Place some bets first",
      });
      return;
    }
    
    // Check if user has enough balance for all bets
    const totalBetAmount = lastBets.reduce((sum, bet) => sum + parseFloat(bet.amount as string), 0);
    
    if (totalBetAmount > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits for these bets",
      });
      return;
    }
    
    // Deduct total bet amount
    updateBalance((user?.balance || 0) - totalBetAmount);
    
    // Set the bets
    setSelectedBets(lastBets);
    
    toast({
      title: "Bets Repeated",
      description: `${lastBets.length} bets placed for ${totalBetAmount.toLocaleString()} credits`,
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Roulette</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Wheel and Result Display */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="text-center">
                {isSpinning ? (
                  <div className="my-20">
                    <div className="animate-spin rounded-full h-24 w-24 border-t-2 border-b-2 border-white mx-auto"></div>
                    <p className="mt-4 text-xl">Spinning...</p>
                  </div>
                ) : spinResult !== null ? (
                  <div className="my-10">
                    <div className={`text-8xl font-bold mb-6 ${
                      getNumberColor(spinResult) === 'red' 
                        ? 'text-red-500' 
                        : getNumberColor(spinResult) === 'black' 
                        ? 'text-white' 
                        : 'text-green-500'
                    }`}>
                      {spinResult}
                    </div>
                    <p className="text-xl font-medium">
                      {getNumberColor(spinResult).toUpperCase()}
                    </p>
                    {winnings > 0 && (
                      <p className="text-2xl font-medium mt-4 text-green-500">
                        You won {winnings.toLocaleString()} credits!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="my-10 text-zinc-400">
                    <div className="text-6xl mb-6">?</div>
                    <p className="text-xl">Place your bets and spin the wheel</p>
                  </div>
                )}
              </div>

              {/* Game History */}
              <div className="mt-6">
                <h3 className="font-medium mb-2">Recent Spins</h3>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {gameHistory.length > 0 ? (
                    gameHistory.map((num, idx) => (
                      <div 
                        key={idx} 
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                          getNumberColor(num) === 'red' 
                            ? 'bg-red-500 text-white' 
                            : getNumberColor(num) === 'black' 
                            ? 'bg-black text-white'
                            : 'bg-green-500 text-white'
                        }`}
                      >
                        {num}
                      </div>
                    ))
                  ) : (
                    <p className="text-zinc-500">No spins yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Betting Board */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle>Betting Board</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {/* Numbers Grid */}
                <div className="col-span-2">
                  <h3 className="font-medium mb-2">Numbers</h3>
                  <div className="grid grid-cols-3 gap-1">
                    <button 
                      onClick={() => addBet({
                        type: 'number',
                        value: 0,
                        multiplier: 36,
                        label: 'Number 0'
                      })}
                      className="h-12 bg-green-600 hover:bg-green-700 font-medium rounded flex items-center justify-center"
                    >
                      0
                    </button>
                    {Array.from({ length: 36 }, (_, i) => i + 1).map(num => (
                      <button
                        key={num}
                        onClick={() => addBet({
                          type: 'number',
                          value: num,
                          multiplier: 36,
                          label: `Number ${num}`
                        })}
                        className={`h-12 ${
                          getNumberColor(num) === 'red' 
                            ? 'bg-red-600 hover:bg-red-700' 
                            : 'bg-black hover:bg-zinc-800'
                        } font-medium rounded flex items-center justify-center`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outside Bets */}
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium mb-2">Columns</h3>
                    <div className="space-y-1">
                      {[1, 2, 3].map(col => (
                        <button
                          key={`col-${col}`}
                          onClick={() => addBet({
                            type: 'column',
                            value: col.toString(),
                            multiplier: 3,
                            label: `Column ${col}`
                          })}
                          className="w-full h-10 bg-purple-600 hover:bg-purple-700 font-medium rounded flex items-center justify-center"
                        >
                          Column {col} (2:1)
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Dozens</h3>
                    <div className="space-y-1">
                      {[1, 2, 3].map(dozen => (
                        <button
                          key={`dozen-${dozen}`}
                          onClick={() => addBet({
                            type: 'dozen',
                            value: dozen.toString(),
                            multiplier: 3,
                            label: `${dozen === 1 ? '1st' : dozen === 2 ? '2nd' : '3rd'} Dozen`
                          })}
                          className="w-full h-10 bg-blue-600 hover:bg-blue-700 font-medium rounded flex items-center justify-center"
                        >
                          {dozen === 1 ? '1-12' : dozen === 2 ? '13-24' : '25-36'} (2:1)
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Colors</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => addBet({
                          type: 'color',
                          value: 'red',
                          multiplier: 2,
                          label: 'Red'
                        })}
                        className="w-full h-10 bg-red-600 hover:bg-red-700 font-medium rounded flex items-center justify-center"
                      >
                        Red (1:1)
                      </button>
                      <button
                        onClick={() => addBet({
                          type: 'color',
                          value: 'black',
                          multiplier: 2,
                          label: 'Black'
                        })}
                        className="w-full h-10 bg-black hover:bg-zinc-800 font-medium rounded flex items-center justify-center"
                      >
                        Black (1:1)
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">Even/Odd</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => addBet({
                          type: 'even-odd',
                          value: 'even',
                          multiplier: 2,
                          label: 'Even'
                        })}
                        className="w-full h-10 bg-zinc-600 hover:bg-zinc-700 font-medium rounded flex items-center justify-center"
                      >
                        Even (1:1)
                      </button>
                      <button
                        onClick={() => addBet({
                          type: 'even-odd',
                          value: 'odd',
                          multiplier: 2,
                          label: 'Odd'
                        })}
                        className="w-full h-10 bg-zinc-600 hover:bg-zinc-700 font-medium rounded flex items-center justify-center"
                      >
                        Odd (1:1)
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">High/Low</h3>
                    <div className="space-y-1">
                      <button
                        onClick={() => addBet({
                          type: 'half',
                          value: '1',
                          multiplier: 2,
                          label: '1-18'
                        })}
                        className="w-full h-10 bg-zinc-600 hover:bg-zinc-700 font-medium rounded flex items-center justify-center"
                      >
                        1-18 (1:1)
                      </button>
                      <button
                        onClick={() => addBet({
                          type: 'half',
                          value: '2',
                          multiplier: 2,
                          label: '19-36'
                        })}
                        className="w-full h-10 bg-zinc-600 hover:bg-zinc-700 font-medium rounded flex items-center justify-center"
                      >
                        19-36 (1:1)
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bet Controls */}
        <Card className="bg-zinc-900 border-zinc-800 h-fit sticky top-24">
          <CardHeader>
            <CardTitle>Your Bets</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  disabled={isSpinning}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  className="border-zinc-700 w-16"
                  onClick={() => setBetAmount((Math.max(parseInt(betAmount) - 100, 1)).toString())}
                  disabled={isSpinning}
                >
                  -100
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700 w-16"
                  onClick={() => setBetAmount((parseInt(betAmount) + 100).toString())}
                  disabled={isSpinning}
                >
                  +100
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700 w-16"
                  onClick={() => setBetAmount((Math.max(parseInt(betAmount) - 1000, 1)).toString())}
                  disabled={isSpinning}
                >
                  -1K
                </Button>
                <Button
                  variant="outline"
                  className="border-zinc-700 w-16"
                  onClick={() => setBetAmount((parseInt(betAmount) + 1000).toString())}
                  disabled={isSpinning}
                >
                  +1K
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium">Current Bets</h3>
              {selectedBets.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {selectedBets.map((bet, idx) => (
                    <div 
                      key={idx} 
                      className="bg-zinc-800 p-2 rounded-md flex justify-between items-center"
                    >
                      <span>{bet.label}</span>
                      <span>{parseFloat(bet.amount as string).toLocaleString()} credits</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-500 text-center py-4">No bets placed yet</p>
              )}
              
              <div className="bg-zinc-800 p-3 rounded-md">
                <div className="flex justify-between font-medium">
                  <span>Total Bet:</span>
                  <span>
                    {selectedBets.reduce((sum, bet) => sum + parseFloat(bet.amount as string), 0).toLocaleString()} credits
                  </span>
                </div>
                {selectedBets.length > 0 && spinResult === null && (
                  <div className="mt-2 text-center text-zinc-400 text-sm">
                    Press "Spin" to start the game
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2">
              <Button
                onClick={spinWheel}
                disabled={isSpinning || selectedBets.length === 0}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isSpinning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Spinning...
                  </>
                ) : (
                  "Spin the Wheel"
                )}
              </Button>
              
              <Button
                onClick={resetGame}
                disabled={isSpinning}
                variant="outline"
                className="border-zinc-700"
              >
                Reset Bets
              </Button>
              
              {lastBets.length > 0 && (
                <Button
                  onClick={repeatLastBets}
                  disabled={isSpinning}
                  variant="outline"
                  className="border-zinc-700"
                >
                  Repeat Last Bets
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-zinc-900 border-zinc-800 mb-6">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4 text-sm text-zinc-400">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-2">
                <strong>How to play:</strong> Place your bets on the outcomes you wish to wager on, then spin the wheel.
              </p>
              <p className="mb-2">
                <strong>Inside Bets:</strong> Single number (35:1) - Higher risk, higher reward.
              </p>
              <p className="mb-2">
                <strong>Outside Bets:</strong> Colors, odd/even, high/low (1:1), dozens, columns (2:1) - Lower risk, lower reward.
              </p>
              <p>
                The house has a small edge due to the green 0 pocket.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RouletteGame;
