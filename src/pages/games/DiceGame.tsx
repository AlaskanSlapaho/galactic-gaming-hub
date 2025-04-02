
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, RefreshCw, Dices } from "lucide-react";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateRandomFloat,
} from "@/utils/provablyFair";

const DiceGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState<string>("500");
  const [targetValue, setTargetValue] = useState<number>(50);
  const [betType, setBetType] = useState<"over" | "under">("over");
  const [winChance, setWinChance] = useState<number>(49.5);
  const [multiplier, setMultiplier] = useState<number>(1.9);
  const [rollResult, setRollResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [gameState, setGameState] = useState(createDefaultGameState());
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  
  useEffect(() => {
    let effectiveWinChance;
    
    if (betType === "over") {
      effectiveWinChance = 100 - targetValue;
    } else {
      effectiveWinChance = targetValue;
    }
    
    // Ensure win chance is between 1% and 40% (cap at 40%)
    effectiveWinChance = Math.min(effectiveWinChance, 40);
    effectiveWinChance = Math.max(effectiveWinChance, 1);
    
    // Calculate multiplier with a 5% house edge
    // For a 50% chance, multiplier should be 1.9x (not the mathematically fair 2x)
    const houseEdgeMultiplier = 0.95;
    const calculatedMultiplier = (100 / effectiveWinChance) * houseEdgeMultiplier;
    
    // At 50% chance, force multiplier to be 1.9x
    let finalMultiplier = calculatedMultiplier;
    if (effectiveWinChance >= 49 && effectiveWinChance <= 51) {
      finalMultiplier = 1.9;
    }
    
    setWinChance(effectiveWinChance);
    setMultiplier(parseFloat(finalMultiplier.toFixed(2)));
  }, [targetValue, betType]);
  
  const handleRoll = () => {
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
    
    updateBalance((user?.balance || 0) - betValue);
    
    const newGameState = createDefaultGameState();
    setGameState(newGameState);
    
    setIsRolling(true);
    
    const rollInterval = setInterval(() => {
      setRollResult(Math.random() * 100);
    }, 50);
    
    setTimeout(() => {
      clearInterval(rollInterval);
      
      const fairParams = getProvablyFairParams(newGameState);
      const finalResult = generateRandomFloat(fairParams, 0, 100, 2);
      setRollResult(finalResult);
      
      let isWin = false;
      if (betType === "over" && finalResult > targetValue) {
        isWin = true;
      } else if (betType === "under" && finalResult < targetValue) {
        isWin = true;
      }
      
      setGameResult(isWin ? "win" : "lose");
      
      if (isWin) {
        const winAmount = betValue * multiplier;
        updateBalance((user?.balance || 0) + winAmount);
        
        toast({
          title: "You Won!",
          description: `You rolled ${finalResult.toFixed(2)} and won ${winAmount.toFixed(2)} credits!`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "You Lost",
          description: `You rolled ${finalResult.toFixed(2)} and lost ${betValue} credits.`,
        });
      }
      
      setIsRolling(false);
    }, 1000);
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Dice</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-3">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center space-y-6 py-6">
              <div className="w-32 h-32 rounded-xl flex items-center justify-center bg-zinc-800 border border-zinc-700 text-4xl font-bold">
                {rollResult !== null ? rollResult.toFixed(2) : "?"}
              </div>
              
              <div className="w-full bg-zinc-800 h-10 rounded-md relative overflow-hidden">
                <div 
                  className="absolute inset-0 flex items-center justify-center font-medium"
                  style={{ zIndex: 2 }}
                >
                  {`Target: ${targetValue.toFixed(2)} (${betType === "over" ? ">" : "<"})`}
                </div>
                
                <div 
                  className={`h-full ${betType === "over" ? "bg-red-600/50" : "bg-green-600/50"}`}
                  style={{ 
                    width: `${betType === "over" ? 100 - targetValue : targetValue}%`,
                    float: betType === "over" ? "right" : "left"
                  }}
                ></div>
                
                {rollResult !== null && (
                  <div 
                    className="absolute top-0 bottom-0 w-0.5 bg-white"
                    style={{ left: `${rollResult}%`, zIndex: 1 }}
                  ></div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardContent className="p-4 space-y-4">
            <Tabs defaultValue="manual" className="w-full">
              <TabsList className="grid grid-cols-2 w-full bg-zinc-800">
                <TabsTrigger value="manual" className="data-[state=active]:bg-purple-600">Manual</TabsTrigger>
                <TabsTrigger value="auto" className="data-[state=active]:bg-purple-600">Auto</TabsTrigger>
              </TabsList>
              <TabsContent value="manual" className="space-y-4 mt-4">
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
                      disabled={isRolling}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label>Bet Type</Label>
                      <div className="flex rounded-md overflow-hidden">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setBetType("over")}
                          className={`px-3 py-1 ${
                            betType === "over"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-zinc-800 hover:bg-zinc-700"
                          }`}
                        >
                          Over
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setBetType("under")}
                          className={`px-3 py-1 ${
                            betType === "under"
                              ? "bg-green-600 hover:bg-green-700"
                              : "bg-zinc-800 hover:bg-zinc-700"
                          }`}
                        >
                          Under
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="target-value">Target Value: {targetValue.toFixed(2)}</Label>
                    </div>
                    <Slider
                      id="target-value"
                      defaultValue={[targetValue]}
                      min={1}
                      max={99}
                      step={0.5}
                      onValueChange={(vals) => setTargetValue(vals[0])}
                      disabled={isRolling}
                      className="py-2"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Win Chance</p>
                      <p className="text-xl font-medium">{winChance.toFixed(2)}%</p>
                    </div>
                    
                    <div className="space-y-1">
                      <p className="text-sm text-zinc-400">Multiplier</p>
                      <p className="text-xl font-medium text-green-500">{multiplier.toFixed(2)}x</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm text-zinc-400">Potential Win</p>
                    <p className="text-xl font-medium">
                      {(parseFloat(betAmount) * multiplier || 0).toFixed(2)} Credits
                    </p>
                  </div>
                </div>
                
                <Button
                  onClick={handleRoll}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={isRolling || !isAuthenticated}
                >
                  {isRolling ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Dices className="mr-2 h-4 w-4" />
                  )}
                  {isRolling ? "Rolling..." : "Roll Dice"}
                </Button>
                
                {gameResult && !isRolling && (
                  <div className={`p-3 rounded-md ${
                    gameResult === "win" ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"
                  }`}>
                    <p className="text-center font-medium">
                      {gameResult === "win"
                        ? `You won ${(parseFloat(betAmount) * multiplier).toFixed(2)} credits!`
                        : `You lost ${betAmount} credits.`}
                    </p>
                  </div>
                )}
              </TabsContent>
              <TabsContent value="auto" className="mt-4">
                <div className="h-64 flex items-center justify-center text-zinc-400">
                  Auto betting coming soon!
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4 text-sm text-zinc-400">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-2">
                <strong>How to play:</strong> Choose to bet over or under a target number.
              </p>
              <p>
                The closer your target is to the edge (0 or 100), the higher your potential payout.
                A 5% fee is applied to all winnings.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiceGame;
