
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
  const [playerHands, setPlayerHands] = useState<PlayingCard[][]>([]);
  const [currentHandIndex, setCurrentHandIndex] = useState<number>(0);
  const [dealerHand, setDealerHand] = useState<PlayingCard[]>([]);
  const [playerScores, setPlayerScores] = useState<number[]>([]);
  const [dealerScore, setDealerScore] = useState<number>(0);
  const [gameResult, setGameResult] = useState<"win" | "lose" | "push" | null>(null);
  const [message, setMessage] = useState<string>("Place your bet to begin");
  const [canDoubleDown, setCanDoubleDown] = useState<boolean>(false);
  const [canSplit, setCanSplit] = useState<boolean>(false);
  const [doubledHands, setDoubledHands] = useState<boolean[]>([]);
  const [handResults, setHandResults] = useState<("win" | "lose" | "push")[]>([]);

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
  
  // Check if hand can be split (first two cards have same face value)
  const checkCanSplit = (hand: PlayingCard[]): boolean => {
    if (hand.length === 2) {
      return hand[0].face === hand[1].face;
    }
    return false;
  };
  
  // Check if player can double down (first two cards only, total 9, 10, or 11)
  const checkCanDoubleDown = (hand: PlayingCard[]): boolean => {
    if (hand.length === 2) {
      const score = calculateScore(hand);
      return score >= 9 && score <= 11;
    }
    return false;
  };
  
  // Update scores for all hands
  const updateScores = () => {
    const newPlayerScores = playerHands.map(hand => calculateScore(hand));
    setPlayerScores(newPlayerScores);
    setDealerScore(calculateScore(dealerHand));
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
    
    // Initialize a single player hand
    setPlayerHands([newPlayerHand]);
    setDealerHand(newDealerHand);
    setDeck(deck4);
    setCurrentHandIndex(0);
    
    // Calculate initial scores
    const pScore = calculateScore(newPlayerHand);
    const dScore = calculateScore(newDealerHand);
    
    setPlayerScores([pScore]);
    setDealerScore(dScore);
    
    // Check if player can split or double down
    setCanSplit(checkCanSplit(newPlayerHand));
    setCanDoubleDown(checkCanDoubleDown(newPlayerHand));
    
    // Initialize doubled hands tracking
    setDoubledHands([false]);
    setHandResults([]);
    
    setGameActive(true);
    setGameState('playing');
    setGameResult(null);
    setMessage("Your turn: Hit, Stand, Double Down, or Split?");
    
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
    
    const currentHand = playerHands[currentHandIndex];
    const [newCard, updatedDeck] = drawCard(deck);
    const updatedHand = [...currentHand, newCard];
    
    // Update the current hand in playerHands
    const updatedHands = [...playerHands];
    updatedHands[currentHandIndex] = updatedHand;
    
    setPlayerHands(updatedHands);
    setDeck(updatedDeck);
    
    // Update scores
    const newScore = calculateScore(updatedHand);
    const newScores = [...playerScores];
    newScores[currentHandIndex] = newScore;
    setPlayerScores(newScores);
    
    // Can't double down or split after hitting
    setCanDoubleDown(false);
    setCanSplit(false);
    
    if (newScore > 21) {
      // Current hand busts
      const newResults = [...handResults];
      newResults[currentHandIndex] = 'lose';
      setHandResults(newResults);
      
      // Move to the next hand or dealer's turn
      if (currentHandIndex < playerHands.length - 1) {
        moveToNextHand();
      } else {
        finishPlayerTurn();
      }
    } else if (newScore === 21) {
      // Automatically stand on 21
      handleStand();
    }
  };
  
  const handleStand = () => {
    if (gameState !== 'playing') return;
    
    // Can't double down or split after standing
    setCanDoubleDown(false);
    setCanSplit(false);
    
    // Move to the next hand or dealer's turn
    if (currentHandIndex < playerHands.length - 1) {
      moveToNextHand();
    } else {
      finishPlayerTurn();
    }
  };
  
  const handleDoubleDown = () => {
    if (gameState !== 'playing' || !canDoubleDown) return;
    
    const betValue = parseFloat(betAmount);
    
    // Check if player has enough balance to double down
    if (betValue > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits to double down",
      });
      return;
    }
    
    // Deduct additional bet amount
    updateBalance((user?.balance || 0) - betValue);
    
    // Mark this hand as doubled
    const newDoubledHands = [...doubledHands];
    newDoubledHands[currentHandIndex] = true;
    setDoubledHands(newDoubledHands);
    
    // Draw one more card and then stand
    const currentHand = playerHands[currentHandIndex];
    const [newCard, updatedDeck] = drawCard(deck);
    const updatedHand = [...currentHand, newCard];
    
    // Update the current hand in playerHands
    const updatedHands = [...playerHands];
    updatedHands[currentHandIndex] = updatedHand;
    
    setPlayerHands(updatedHands);
    setDeck(updatedDeck);
    
    // Update scores
    const newScore = calculateScore(updatedHand);
    const newScores = [...playerScores];
    newScores[currentHandIndex] = newScore;
    setPlayerScores(newScores);
    
    // Check if hand busts
    if (newScore > 21) {
      // Current hand busts
      const newResults = [...handResults];
      newResults[currentHandIndex] = 'lose';
      setHandResults(newResults);
    }
    
    // Move to the next hand or dealer's turn after doubling
    if (currentHandIndex < playerHands.length - 1) {
      moveToNextHand();
    } else {
      finishPlayerTurn();
    }
  };
  
  const handleSplit = () => {
    if (gameState !== 'playing' || !canSplit) return;
    
    const betValue = parseFloat(betAmount);
    
    // Check if player has enough balance for the additional bet
    if (betValue > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits to split",
      });
      return;
    }
    
    // Deduct additional bet amount
    updateBalance((user?.balance || 0) - betValue);
    
    const currentHand = playerHands[currentHandIndex];
    
    // Create two new hands, each with one of the original cards
    const firstHand = [currentHand[0]];
    const secondHand = [currentHand[1]];
    
    // Draw one card for each new hand
    const [firstNewCard, deck1] = drawCard(deck);
    const [secondNewCard, deck2] = drawCard(deck1);
    
    firstHand.push(firstNewCard);
    secondHand.push(secondNewCard);
    
    // Create updated player hands array
    const handsBeforeCurrent = playerHands.slice(0, currentHandIndex);
    const handsAfterCurrent = playerHands.slice(currentHandIndex + 1);
    const updatedHands = [...handsBeforeCurrent, firstHand, secondHand, ...handsAfterCurrent];
    
    // Update doubled hands tracking
    const doubledBeforeCurrent = doubledHands.slice(0, currentHandIndex);
    const doubledAfterCurrent = doubledHands.slice(currentHandIndex + 1);
    const updatedDoubledHands = [...doubledBeforeCurrent, false, false, ...doubledAfterCurrent];
    
    // Update hands and deck
    setPlayerHands(updatedHands);
    setDeck(deck2);
    setDoubledHands(updatedDoubledHands);
    
    // Update scores
    const firstScore = calculateScore(firstHand);
    const secondScore = calculateScore(secondHand);
    
    const scoresBeforeCurrent = playerScores.slice(0, currentHandIndex);
    const scoresAfterCurrent = playerScores.slice(currentHandIndex + 1);
    const updatedScores = [...scoresBeforeCurrent, firstScore, secondScore, ...scoresAfterCurrent];
    
    setPlayerScores(updatedScores);
    
    // Reset split and double down options for the current hand
    setCanSplit(checkCanSplit(firstHand));
    setCanDoubleDown(checkCanDoubleDown(firstHand));
    
    // Update message
    setMessage(`Split successful! Playing hand ${currentHandIndex + 1} of ${updatedHands.length}`);
    
    // Check for blackjacks after split
    if (isBlackjack(firstHand)) {
      toast({
        title: "Blackjack!",
        description: `You got a blackjack on your first split hand!`,
      });
    }
    
    if (isBlackjack(secondHand)) {
      toast({
        title: "Blackjack!",
        description: `You got a blackjack on your second split hand!`,
      });
    }
  };
  
  // Move to the next hand after current hand is done
  const moveToNextHand = () => {
    const nextHandIndex = currentHandIndex + 1;
    setCurrentHandIndex(nextHandIndex);
    
    // Check if player can split or double down on the next hand
    const nextHand = playerHands[nextHandIndex];
    setCanSplit(checkCanSplit(nextHand));
    setCanDoubleDown(checkCanDoubleDown(nextHand));
    
    setMessage(`Playing hand ${nextHandIndex + 1} of ${playerHands.length}`);
  };
  
  // All player hands are done, move to dealer's turn
  const finishPlayerTurn = () => {
    // Check if all player hands have busted
    const allBusted = playerScores.every(score => score > 21);
    
    if (allBusted) {
      // All hands busted, game over
      setGameState('game-over');
      setGameActive(false);
      setMessage("All hands busted! Dealer wins.");
      
      // Set all hands as lost
      setHandResults(playerHands.map(() => 'lose'));
      
      toast({
        variant: "destructive",
        title: "You Lost",
        description: `All hands busted. You lost all bets.`,
      });
    } else {
      // Move to dealer's turn
      setGameState('dealer-turn');
      setMessage("Dealer's turn...");
      
      // Dealer plays their hand
      dealerPlay();
    }
  };
  
  // Dealer draws until they have at least 17
  const dealerPlay = () => {
    let currentDealerHand = [...dealerHand];
    let currentDeck = [...deck];
    let currentDealerScore = calculateScore(currentDealerHand);
    
    const dealerDraw = () => {
      if (currentDealerScore < 17) {
        const [newCard, updatedDeck] = drawCard(currentDeck);
        currentDealerHand = [...currentDealerHand, newCard];
        currentDeck = updatedDeck;
        
        currentDealerScore = calculateScore(currentDealerHand);
        
        setDealerHand(currentDealerHand);
        setDeck(currentDeck);
        setDealerScore(currentDealerScore);
        
        setTimeout(dealerDraw, 500);
      } else {
        // Dealer is done drawing, determine winners for each hand
        determineResults(currentDealerScore);
      }
    };
    
    setTimeout(dealerDraw, 500);
  };
  
  // Determine results for each hand
  const determineResults = (finalDealerScore) => {
    const results: ("win" | "lose" | "push")[] = [];
    let totalWin = 0;
    let totalBet = parseFloat(betAmount) * playerHands.length;
    const betValue = parseFloat(betAmount);
    
    playerHands.forEach((hand, index) => {
      const handScore = playerScores[index];
      const isDoubled = doubledHands[index];
      const handBet = isDoubled ? betValue * 2 : betValue;
      
      let result: "win" | "lose" | "push";
      
      // If player busted, they lose
      if (handScore > 21) {
        result = 'lose';
      }
      // If dealer busted and player didn't, player wins
      else if (finalDealerScore > 21) {
        result = 'win';
        const winAmount = isBlackjack(hand) ? handBet * 1.5 : handBet;
        totalWin += winAmount;
      }
      // Compare scores
      else if (handScore > finalDealerScore) {
        result = 'win';
        const winAmount = isBlackjack(hand) ? handBet * 1.5 : handBet;
        totalWin += winAmount;
      }
      else if (handScore < finalDealerScore) {
        result = 'lose';
      }
      else {
        // Push - same score
        result = 'push';
        totalWin += handBet; // Return original bet
      }
      
      results.push(result);
    });
    
    setHandResults(results);
    
    // Calculate final message and overall result
    let finalMessage = "";
    let overallResult: "win" | "lose" | "push" | null = null;
    
    const wins = results.filter(r => r === 'win').length;
    const losses = results.filter(r => r === 'lose').length;
    const pushes = results.filter(r => r === 'push').length;
    
    if (wins > 0 && losses === 0) {
      overallResult = 'win';
      finalMessage = pushes > 0 
        ? `You won ${wins} hand${wins > 1 ? 's' : ''} and pushed ${pushes}!` 
        : `You won all ${wins} hand${wins > 1 ? 's' : ''}!`;
    } else if (losses > 0 && wins === 0) {
      overallResult = 'lose';
      finalMessage = pushes > 0 
        ? `You lost ${losses} hand${losses > 1 ? 's' : ''} and pushed ${pushes}.` 
        : `You lost all ${losses} hand${losses > 1 ? 's' : ''}.`;
    } else if (wins > 0 && losses > 0) {
      if (totalWin > totalBet) {
        overallResult = 'win';
        finalMessage = `Mixed results: ${wins} win${wins > 1 ? 's' : ''}, ${losses} loss${losses > 1 ? 'es' : ''}, ${pushes} push${pushes > 1 ? 'es' : ''}.`;
      } else if (totalWin < totalBet) {
        overallResult = 'lose';
        finalMessage = `Mixed results: ${wins} win${wins > 1 ? 's' : ''}, ${losses} loss${losses > 1 ? 'es' : ''}, ${pushes} push${pushes > 1 ? 'es' : ''}.`;
      } else {
        overallResult = 'push';
        finalMessage = `Mixed results: ${wins} win${wins > 1 ? 's' : ''}, ${losses} loss${losses > 1 ? 'es' : ''}, ${pushes} push${pushes > 1 ? 'es' : ''}.`;
      }
    } else if (pushes === results.length) {
      overallResult = 'push';
      finalMessage = `All ${pushes} hand${pushes > 1 ? 's' : ''} pushed.`;
    }
    
    // Update balance with winnings
    updateBalance((user?.balance || 0) + totalWin);
    
    // End the game
    endGame(overallResult, finalMessage);
  };
  
  // End game and display results
  const endGame = (result: "win" | "lose" | "push" | null, resultMessage: string) => {
    setGameActive(false);
    setGameState('game-over');
    setGameResult(result);
    setMessage(resultMessage);
    
    if (result === 'win') {
      toast({
        title: "You Won!",
        description: resultMessage,
      });
    } else if (result === 'push') {
      toast({
        title: "Push!",
        description: resultMessage,
      });
    } else if (result === 'lose') {
      toast({
        variant: "destructive",
        title: "You Lost",
        description: resultMessage,
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
        
        <div className="space-y-4">
          {playerHands.map((hand, handIndex) => (
            <div key={handIndex} className={`space-y-2 p-2 ${
              handIndex === currentHandIndex && gameState === 'playing' 
                ? "border border-purple-500 rounded-md"
                : ""
            }`}>
              <p className="text-center text-zinc-400">
                Hand {handIndex + 1} ({playerScores[handIndex] || 0})
                {doubledHands[handIndex] && " (Doubled)"}
                {handResults[handIndex] && ` - ${
                  handResults[handIndex] === 'win' 
                    ? "Win!" 
                    : handResults[handIndex] === 'lose' 
                    ? "Lose" 
                    : "Push"
                }`}
              </p>
              <div className="flex justify-center space-x-2 flex-wrap">
                {hand.map((card, cardIndex) => (
                  <div key={cardIndex} className="animate-fade-in mb-2">
                    {renderCard(card)}
                  </div>
                ))}
              </div>
            </div>
          ))}
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
                <p className="text-sm text-zinc-400">Standard Payout</p>
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
              
              {gameState === 'playing' && currentHandIndex < playerHands.length && (
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
                  
                  {canDoubleDown && (
                    <Button 
                      onClick={handleDoubleDown}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Double Down
                    </Button>
                  )}
                  
                  {canSplit && (
                    <Button 
                      onClick={handleSplit}
                      className="bg-yellow-600 hover:bg-yellow-700"
                    >
                      Split
                    </Button>
                  )}
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
                  {message}
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
              <p className="mb-2">
                <strong>Double Down:</strong> Double your bet and receive exactly one more card.
              </p>
              <p>
                <strong>Split:</strong> Split a pair into two separate hands, each with its own bet.
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
