
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { AlertTriangle, ArrowUp, ArrowDown, Minus, RefreshCw } from "lucide-react";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateRandomNumber,
} from "@/utils/provablyFair";

interface PlayingCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number;
  face: string;
  rank: number;
}

const HiLoGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState<string>("500");
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [firstRound, setFirstRound] = useState<boolean>(true);
  const [round, setRound] = useState<number>(0);
  const [multiplier, setMultiplier] = useState<number>(1.0);
  const [currentCard, setCurrentCard] = useState<PlayingCard | null>(null);
  const [nextCard, setNextCard] = useState<PlayingCard | null>(null);
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [gameState, setGameState] = useState(createDefaultGameState());
  const [gameResult, setGameResult] = useState<"win" | "lose" | null>(null);
  const [message, setMessage] = useState<string>("Place your bet to begin");
  
  // Card suits and values
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const cardValues = [
    { value: 1, face: 'A', rank: 1 },
    { value: 2, face: '2', rank: 2 },
    { value: 3, face: '3', rank: 3 },
    { value: 4, face: '4', rank: 4 },
    { value: 5, face: '5', rank: 5 },
    { value: 6, face: '6', rank: 6 },
    { value: 7, face: '7', rank: 7 },
    { value: 8, face: '8', rank: 8 },
    { value: 9, face: '9', rank: 9 },
    { value: 10, face: '10', rank: 10 },
    { value: 10, face: 'J', rank: 11 },
    { value: 10, face: 'Q', rank: 12 },
    { value: 10, face: 'K', rank: 13 }
  ];
  
  // Initialize deck
  const initializeDeck = (): PlayingCard[] => {
    const newDeck: PlayingCard[] = [];
    
    suits.forEach(suit => {
      cardValues.forEach(({ value, face, rank }) => {
        newDeck.push({ suit, value, face, rank });
      });
    });
    
    return newDeck;
  };
  
  // Shuffle deck using provably fair algorithm
  const shuffleDeck = (deck: PlayingCard[]): PlayingCard[] => {
    const shuffled = [...deck];
    const params = getProvablyFairParams(gameState);
    
    // Fisher-Yates shuffle with provably fair randomness
    for (let i = shuffled.length - 1; i > 0; i--) {
      const modifiedParams = { ...params, cursor: i };
      const j = generateRandomNumber(modifiedParams, 0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  };
  
  // Draw a card from the deck
  const drawCard = (currentDeck: PlayingCard[]): [PlayingCard, PlayingCard[]] => {
    const updatedDeck = [...currentDeck];
    const card = updatedDeck.pop()!;
    return [card, updatedDeck];
  };
  
  // Start new game
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
    
    // Deduct bet amount from balance
    updateBalance((user?.balance || 0) - betValue);
    
    // Create a new game state for provably fair results
    const newGameState = createDefaultGameState();
    setGameState(newGameState);
    
    // Initialize and shuffle deck
    const newDeck = shuffleDeck(initializeDeck());
    
    // Draw first card
    const [card, updatedDeck] = drawCard(newDeck);
    
    setCurrentCard(card);
    setDeck(updatedDeck);
    setGameActive(true);
    setRound(1);
    setFirstRound(true);
    setMultiplier(1.0);
    setGameResult(null);
    setMessage("Higher, Lower, or Same as the next card?");
  };
  
  // Make a guess
  const makeGuess = (guess: 'higher' | 'lower' | 'same') => {
    if (!gameActive || !currentCard) return;
    
    // Draw next card
    const [nextCard, updatedDeck] = drawCard(deck);
    setNextCard(nextCard);
    setDeck(updatedDeck);
    
    // Determine if guess is correct
    let correct = false;
    
    if (guess === 'higher' && nextCard.rank > currentCard.rank) {
      correct = true;
    } else if (guess === 'lower' && nextCard.rank < currentCard.rank) {
      correct = true;
    } else if (guess === 'same' && nextCard.rank === currentCard.rank) {
      correct = true;
    }
    
    // Update multiplier based on the probability of the guess
    let newMultiplier = multiplier;
    if (correct) {
      if (guess === 'higher') {
        // Calculate probability: (52 - currentCard.rank) / 51
        const probability = (13 - currentCard.rank) / 12;
        newMultiplier = multiplier * (1 / probability) * 0.95; // 5% house edge
      } else if (guess === 'lower') {
        // Calculate probability: (currentCard.rank - 1) / 51
        const probability = (currentCard.rank - 1) / 12;
        newMultiplier = multiplier * (1 / probability) * 0.95; // 5% house edge
      } else if (guess === 'same') {
        // Fixed multiplier for "same" - very low probability
        newMultiplier = multiplier * 12; // There are 4 cards of each rank out of 52 cards
      }
      
      // Increment round
      setRound(round + 1);
      
      // Move to next card
      setTimeout(() => {
        setCurrentCard(nextCard);
        setNextCard(null);
        setMessage(`Round ${round + 1}: Higher, Lower, or Same?`);
        setFirstRound(false);
      }, 1500);
    } else {
      // Game over - lost
      setGameActive(false);
      setGameResult('lose');
      setMessage(`Wrong guess! Game over.`);
      
      toast({
        variant: "destructive",
        title: "You Lost",
        description: `Your guess was wrong. You lost ${betAmount} credits.`,
      });
    }
    
    setMultiplier(parseFloat(newMultiplier.toFixed(2)));
  };
  
  // Cashout
  const cashout = () => {
    if (!gameActive || firstRound) return;
    
    setGameActive(false);
    setGameResult('win');
    
    const betValue = parseFloat(betAmount) || 0;
    const winAmount = betValue * multiplier;
    
    // Add winnings to balance
    updateBalance((user?.balance || 0) + winAmount);
    
    toast({
      title: "Cashed Out!",
      description: `You won ${winAmount.toFixed(2)} credits after ${round} rounds!`,
    });
  };
  
  // Render a card
  const renderCard = (card: PlayingCard | null, faceDown: boolean = false) => {
    if (!card) return null;
    
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    
    return (
      <div className={`w-32 h-44 rounded-md flex items-center justify-center ${
        faceDown 
          ? "bg-purple-900 border-purple-700" 
          : "bg-white border-gray-300"
      } border`}>
        {!faceDown && (
          <div className={`text-3xl font-bold ${isRed ? "text-red-600" : "text-black"} flex flex-col items-center`}>
            <span>{card.face}</span>
            <span className="text-xl mt-1">{getSuitSymbol(card.suit)}</span>
          </div>
        )}
      </div>
    );
  };
  
  // Get suit symbol
  const getSuitSymbol = (suit: string): string => {
    switch (suit) {
      case 'hearts': return '♥';
      case 'diamonds': return '♦';
      case 'clubs': return '♣';
      case 'spades': return '♠';
      default: return '';
    }
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">HiLo</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex flex-col items-center space-y-8 py-4">
              <div className="flex justify-center items-center space-x-6">
                {/* Current card */}
                {gameActive || gameResult ? (
                  <div className="animate-fade-in">
                    {renderCard(currentCard)}
                  </div>
                ) : (
                  <div className="w-32 h-44 rounded-md bg-purple-900 border border-purple-700"></div>
                )}
                
                {/* Next card (when revealed) */}
                {nextCard && (
                  <div className="animate-fade-in">
                    {renderCard(nextCard)}
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <p className={`text-lg mb-4 ${
                  gameResult === 'win' 
                    ? "text-green-500" 
                    : gameResult === 'lose' 
                    ? "text-red-500" 
                    : "text-zinc-300"
                }`}>
                  {message}
                </p>
                
                {gameActive && !nextCard && (
                  <div className="flex justify-center space-x-3">
                    <Button
                      onClick={() => makeGuess('higher')}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <ArrowUp className="mr-2 h-4 w-4" />
                      Higher
                    </Button>
                    <Button
                      onClick={() => makeGuess('same')}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Minus className="mr-2 h-4 w-4" />
                      Same
                    </Button>
                    <Button
                      onClick={() => makeGuess('lower')}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <ArrowDown className="mr-2 h-4 w-4" />
                      Lower
                    </Button>
                  </div>
                )}
              </div>
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
              
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Round</p>
                <p className="text-xl font-medium">{gameActive ? round : 0}</p>
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
              {!gameActive && (
                <Button
                  onClick={startNewGame}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={!isAuthenticated}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  {gameResult !== null ? "New Game" : "Start Game"}
                </Button>
              )}
              
              {gameActive && !firstRound && !nextCard && (
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
                    : `You lost ${betAmount} credits.`}
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
                <strong>How to play:</strong> Predict if the next card will be higher, lower, or the same.
              </p>
              <p>
                Each correct prediction increases your multiplier. Cash out anytime after the first round to collect your winnings.
                Higher risk predictions give higher multipliers!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HiLoGame;
