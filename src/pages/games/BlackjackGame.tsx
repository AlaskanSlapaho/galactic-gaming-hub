
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

// Define card types
interface PlayingCard {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  value: number;
  face: string;
}

// Type to track game state
type GameState = 'betting' | 'playing' | 'dealer-turn' | 'game-over';

const BlackjackGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [betAmount, setBetAmount] = useState<string>("500");
  const [gameActive, setGameActive] = useState<boolean>(false);
  const [gameState, setGameState] = useState<GameState>('betting');
  const [fairState, setFairState] = useState(createDefaultGameState());
  const [deck, setDeck] = useState<PlayingCard[]>([]);
  const [playerHand, setPlayerHand] = useState<PlayingCard[]>([]);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [playerScore, setPlayerScore] = useState<number>(0);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [gameResult, setGameResult] = useState<"win" | "lose" | "push" | null>(null);
  const [message, setMessage] = useState<string>("Place your bet to begin");
  
  // Card suits and values
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'] as const;
  const values = [
    { value: 1, face: 'A' },
    { value: 2, face: '2' },
    { value: 3, face: '3' },
    { value: 4, face: '4' },
    { value: 5, face: '5' },
    { value: 6, face: '6' },
    { value: 7, face: '7' },
    { value: 8, face: '8' },
    { value: 9, face: '9' },
    { value: 10, face: '10' },
    { value: 10, face: 'J' },
    { value: 10, face: 'Q' },
    { value: 10, face: 'K' }
  ];
  
  // Initialize deck
  const initializeDeck = (): PlayingCard[] => {
    const newDeck: PlayingCard[] = [];
    
    suits.forEach(suit => {
      values.forEach(({ value, face }) => {
        newDeck.push({ suit, value, face });
      });
    });
    
    return newDeck;
  };
  
  // Shuffle deck using provably fair algorithm
  const shuffleDeck = (deck: PlayingCard[]): PlayingCard[] => {
    const shuffled = [...deck];
    const params = getProvablyFairParams(fairState);
    
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
  
  // Calculate hand score
  const calculateScore = (hand: PlayingCard[]): number => {
    let score = 0;
    let aces = 0;
    
    hand.forEach(card => {
      if (card.face === 'A') {
        aces += 1;
        score += 11; // Count aces as 11 initially
      } else {
        score += card.value;
      }
    });
    
    // Adjust aces if needed to prevent bust
    while (score > 21 && aces > 0) {
      score -= 10;
      aces -= 1;
    }
    
    return score;
  };
  
  // Check for blackjack (21 on first two cards)
  const isBlackjack = (hand: PlayingCard[]): boolean => {
    return hand.length === 2 && calculateScore(hand) === 21;
  };
  
  // Start a new game
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
    setFairState(newGameState);
    
    // Initialize and shuffle deck
    const newDeck = shuffleDeck(initializeDeck());
    setDeck(newDeck);
    
    // Deal initial cards
    const [playerCard1, deck1] = drawCard(newDeck);
    const [dealerCard1, deck2] = drawCard(deck1);
    const [playerCard2, deck3] = drawCard(deck2);
    const [dealerCard2, deck4] = drawCard(deck3);
    
    const newPlayerHand = [playerCard1, playerCard2];
    const newDealerHand = [dealerCard1, dealerCard2];
    
    setPlayerHand(newPlayerHand);
    setDealerHand(newDealerHand);
    setDeck(deck4);
    
    // Calculate initial scores
    const pScore = calculateScore(newPlayerHand);
    const dScore = calculateScore(newDealerHand);
    
    setPlayerScore(pScore);
    setDealerScore(dScore);
    
    setGameActive(true);
    setGameState('playing');
    setGameResult(null);
    setMessage("Your turn: Hit or Stand?");
    
    // Check for blackjacks
    if (isBlackjack(newPlayerHand) && isBlackjack(newDealerHand)) {
      endGame('push', "Both have Blackjack! It's a push!");
    } else if (isBlackjack(newPlayerHand)) {
      endGame('win', "Blackjack! You win 1.5x your bet!");
    } else if (isBlackjack(newDealerHand)) {
      endGame('lose', "Dealer has Blackjack! You lose.");
    }
  };
  
  // Player actions
  const handleHit = () => {
    if (gameState !== 'playing') return;
    
    const [newCard, updatedDeck] = drawCard(deck);
    const updatedHand = [...playerHand, newCard];
    
    setPlayerHand(updatedHand);
    setDeck(updatedDeck);
    
    const newScore = calculateScore(updatedHand);
    setPlayerScore(newScore);
    
    if (newScore > 21) {
      endGame('lose', "Bust! You went over 21.");
    } else if (newScore === 21) {
      handleStand();
    }
  };
  
  const handleStand = () => {
    if (gameState !== 'playing') return;
    
    setGameState('dealer-turn');
    setMessage("Dealer's turn...");
    
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    let currentDealerScore = calculateScore(currentDealerHand);
    
    // Dealer draws until they have at least 17
    const dealerPlay = () => {
      if (currentDealerScore < 17) {
        const [newCard, updatedDeck] = drawCard(currentDeck);
        currentDealerHand = [...currentDealerHand, newCard];
        currentDeck = updatedDeck;
        
        currentDealerScore = calculateScore(currentDealerHand);
        
        setDealerHand(currentDealerHand);
        setDeck(currentDeck);
        setDealerScore(currentDealerScore);
        
        setTimeout(dealerPlay, 500);
      } else {
        // Dealer is done drawing, determine winner
        if (currentDealerScore > 21) {
          endGame('win', "Dealer busts! You win!");
        } else if (currentDealerScore > playerScore) {
          endGame('lose', "Dealer wins!");
        } else if (currentDealerScore < playerScore) {
          endGame('win', "You win!");
        } else {
          endGame('push', "It's a push!");
        }
      }
    };
    
    setTimeout(dealerPlay, 500);
  };
  
  // End game and distribute winnings
  const endGame = (result: "win" | "lose" | "push", resultMessage: string) => {
    setGameActive(false);
    setGameState('game-over');
    setGameResult(result);
    setMessage(resultMessage);
    
    const betValue = parseFloat(betAmount) || 0;
    
    if (result === 'win') {
      const winMultiplier = isBlackjack(playerHand) ? 2.5 : 2.0; // 3:2 payout for blackjack
      const winAmount = betValue * winMultiplier;
      
      updateBalance((user?.balance || 0) + winAmount);
      
      toast({
        title: "You Won!",
        description: `You won ${winAmount.toFixed(2)} credits!`,
      });
    } else if (result === 'push') {
      // Return the original bet
      updateBalance((user?.balance || 0) + betValue);
      
      toast({
        title: "Push!",
        description: "Your bet has been returned.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "You Lost",
        description: `You lost ${betValue} credits.`,
      });
    }
  };
  
  // Render a card
  const renderCard = (card: PlayingCard | null, faceDown: boolean = false) => {
    if (!card) return null;
    
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    
    return (
      <div className={`w-16 h-24 rounded-md flex items-center justify-center ${
        faceDown 
          ? "bg-purple-900 border-purple-700" 
          : "bg-white border-gray-300"
      } border`}>
        {!faceDown && (
          <div className={`text-lg font-bold ${isRed ? "text-red-600" : "text-black"} flex flex-col items-center`}>
            <span>{card.face}</span>
            <span className="text-xs">{getSuitSymbol(card.suit)}</span>
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
  
  // Render the hands
  const renderGameTable = () => {
    if (gameState === 'betting' && !gameActive) {
      // Show card backs for initial display
      return (
        <div className="space-y-8 py-4">
          <div className="space-y-2">
            <p className="text-center text-zinc-400">Dealer</p>
            <div className="flex justify-center space-x-2">
              {[1, 2].map((_, i) => (
                <div key={i} className="w-16 h-24 rounded-md bg-purple-900 border border-purple-700"></div>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-center text-zinc-400">Your Hand</p>
            <div className="flex justify-center space-x-2">
              {[1, 2].map((_, i) => (
                <div key={i} className="w-16 h-24 rounded-md bg-purple-900 border border-purple-700"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-8 py-4">
        <div className="space-y-2">
          <p className="text-center text-zinc-400">
            Dealer {gameState !== 'playing' ? `(${dealerScore})` : ''}
          </p>
          <div className="flex justify-center space-x-2">
            {dealerHand.map((card, index) => (
              <div key={index} className="animate-fade-in">
                {renderCard(card, index === 1 && gameState === 'playing')}
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2">
          <p className="text-center text-zinc-400">Your Hand ({playerScore})</p>
          <div className="flex justify-center space-x-2 flex-wrap">
            {playerHand.map((card, index) => (
              <div key={index} className="animate-fade-in mb-2">
                {renderCard(card)}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Blackjack</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <Card className="bg-zinc-900 border-zinc-800 lg:col-span-2">
          <CardContent className="p-6">
            {renderGameTable()}
            
            <div className="text-center mt-4">
              <p className={`text-lg ${
                gameResult === 'win' 
                  ? "text-green-500" 
                  : gameResult === 'lose' 
                  ? "text-red-500" 
                  : "text-zinc-300"
              }`}>
                {message}
              </p>
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
                <p className="text-sm text-zinc-400">Potential Win</p>
                <p className="text-xl font-medium">
                  {(parseFloat(betAmount) * 2).toFixed(2)} Credits
                </p>
              </div>
              
              <div className="space-y-1">
                <p className="text-sm text-zinc-400">Blackjack Pays</p>
                <p className="text-xl font-medium">
                  {(parseFloat(betAmount) * 2.5).toFixed(2)} Credits
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
              
              {gameState === 'playing' && (
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    onClick={handleHit}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Hit
                  </Button>
                  <Button 
                    onClick={handleStand}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Stand
                  </Button>
                </div>
              )}
            </div>
            
            {gameResult && (
              <div className={`p-3 rounded-md ${
                gameResult === "win" 
                  ? "bg-green-500/20 text-green-500" 
                  : gameResult === "lose" 
                  ? "bg-red-500/20 text-red-500"
                  : "bg-blue-500/20 text-blue-500"
              }`}>
                <p className="text-center font-medium">
                  {gameResult === "win"
                    ? `You won ${(parseFloat(betAmount) * (isBlackjack(playerHand) ? 2.5 : 2)).toFixed(2)} credits!`
                    : gameResult === "lose"
                    ? `You lost ${betAmount} credits.`
                    : "Push! Your bet was returned."}
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
                <strong>How to play:</strong> Get a hand value closer to 21 than the dealer without going over.
              </p>
              <p>
                Blackjack pays 3:2. Dealer stands on all 17s.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlackjackGame;
