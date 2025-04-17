import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle } from "lucide-react";

// Define ship reward types
interface ShipReward {
  name: string;
  value: number;
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
}

// Define case types
interface Case {
  id: string;
  name: string;
  price: number;
  rewards: ShipReward[];
}

interface CaseBattle {
  id: string;
  name: string;
  cases: string[];
  participants: string[];
  status: "waiting" | "in-progress" | "completed";
  rewards?: { player: string; reward: ShipReward }[];
  winner?: string;
}

// Mock ship rewards data
const shipRewards: ShipReward[] = [
  { name: "Shuttle", value: 500, rarity: "common" },
  { name: "Fighter", value: 1000, rarity: "common" },
  { name: "Corvette", value: 2500, rarity: "uncommon" },
  { name: "Frigate", value: 5000, rarity: "uncommon" },
  { name: "Destroyer", value: 10000, rarity: "rare" },
  { name: "Cruiser", value: 25000, rarity: "rare" },
  { name: "Battleship", value: 50000, rarity: "epic" },
  { name: "Dreadnought", value: 100000, rarity: "epic" },
  { name: "Supercarrier", value: 250000, rarity: "legendary" },
  { name: "Star Dreadnought", value: 500000, rarity: "legendary" },
];

// Mock cases data
const cases: Case[] = [
  {
    id: "case-1",
    name: "Common Ships",
    price: 1000,
    rewards: shipRewards.filter(ship => ship.rarity === "common"),
  },
  {
    id: "case-2",
    name: "Uncommon Ships",
    price: 5000,
    rewards: shipRewards.filter(ship => ship.rarity === "uncommon"),
  },
  {
    id: "case-3",
    name: "Rare Ships",
    price: 25000,
    rewards: shipRewards.filter(ship => ship.rarity === "rare"),
  },
  {
    id: "case-4",
    name: "Epic Ships",
    price: 100000,
    rewards: shipRewards.filter(ship => ship.rarity === "epic"),
  },
  {
    id: "case-5",
    name: "Legendary Ships",
    price: 500000,
    rewards: shipRewards.filter(ship => ship.rarity === "legendary"),
  },
];

const CasesGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [caseBattles, setCaseBattles] = useState<CaseBattle[]>([]);
  const [battleName, setBattleName] = useState<string>("");
  const [selectedCases, setSelectedCases] = useState<string[]>([]);
  
  // Roll a case to get a reward
  const rollCase = (caseItem: Case): ShipReward => {
    const randomNumber = Math.random();
    let cumulativeProbability = 0;
    
    // Calculate cumulative probabilities for each reward
    for (const reward of caseItem.rewards) {
      const probability = 1 / caseItem.rewards.length;
      cumulativeProbability += probability;
      
      if (randomNumber < cumulativeProbability) {
        return reward;
      }
    }
    
    // Fallback to the last reward if something goes wrong
    return caseItem.rewards[caseItem.rewards.length - 1];
  };
  
  // Open a case
  const openCase = (caseItem: Case) => {
    if (!isAuthenticated) {
      toast({
        title: "Not logged in",
        description: "Please login to open cases",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) return;
    
    if (user.balance < caseItem.price) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough credits to open this case",
        variant: "destructive",
      });
      return;
    }
    
    // Deduct case price from balance
    updateBalance(user.balance - caseItem.price);
    
    // Award credits directly instead of adding to inventory
    const reward = rollCase(caseItem);
    
    // Update user's balance with the ship value
    updateBalance((user?.balance || 0) + reward.value);
    
    // Show toast with reward
    toast({
      title: `You won ${reward.name}!`,
      description: `${reward.value} credits have been added to your balance.`,
    });
  };
  
  // Toggle case selection for battle creation
  const toggleCaseSelection = (caseId: string) => {
    setSelectedCases(prev => {
      if (prev.includes(caseId)) {
        return prev.filter(id => id !== caseId);
      } else {
        return [...prev, caseId];
      }
    });
  };
  
  // Calculate battle cost
  const calculateBattleCost = () => {
    return selectedCases.reduce((sum, caseId) => {
      const caseItem = cases.find(c => c.id === caseId);
      return sum + (caseItem?.price || 0);
    }, 0);
  };
  
  // Create a new case battle
  const createBattle = () => {
    if (!isAuthenticated) {
      toast({
        title: "Not logged in",
        description: "Please login to create battles",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) return;
    
    const battleCost = calculateBattleCost();
    
    if (user.balance < battleCost) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough credits to create this battle",
        variant: "destructive",
      });
      return;
    }
    
    // Deduct battle cost from balance
    updateBalance(user.balance - battleCost);
    
    const newBattle: CaseBattle = {
      id: `battle-${Date.now()}`,
      name: battleName,
      cases: selectedCases,
      participants: [user.username],
      status: "waiting",
    };
    
    setCaseBattles(prev => [...prev, newBattle]);
    setBattleName("");
    setSelectedCases([]);
    
    toast({
      title: "Battle created!",
      description: `Your battle "${battleName}" has been created.`,
    });
  };
  
  // Join an existing case battle
  const joinBattle = (battleId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Not logged in",
        description: "Please login to join battles",
        variant: "destructive",
      });
      return;
    }
    
    if (!user) return;
    
    const battle = caseBattles.find(b => b.id === battleId);
    if (!battle) return;
    
    const battleCost = battle.cases.reduce((sum, caseId) => {
      const caseItem = cases.find(c => c.id === caseId);
      return sum + (caseItem?.price || 0);
    }, 0);
    
    if (user.balance < battleCost) {
      toast({
        title: "Insufficient funds",
        description: "You don't have enough credits to join this battle",
        variant: "destructive",
      });
      return;
    }
    
    // Deduct battle cost from balance
    updateBalance(user.balance - battleCost);
    
    const updatedBattle: CaseBattle = {
      ...battle,
      participants: [...battle.participants, user.username],
      status: "in-progress",
    };
    
    setCaseBattles(prev => 
      prev.map(b => b.id === battleId ? updatedBattle : b)
    );
    
    toast({
      title: "Battle joined!",
      description: `You have joined the battle "${battle.name}".`,
    });
  };
  
  // Complete a battle
  const completeBattle = (battleId: string) => {
    const battle = caseBattles.find(b => b.id === battleId);
    if (!battle || battle.status !== "in-progress") return;
    
    // Generate rewards for each participant
    const battleCases = battle.cases.map(caseId => 
      cases.find(c => c.id === caseId)!
    );
    
    const rewards: { player: string; reward: ShipReward }[] = [];
    let maxValue = 0;
    let winner = "";
    
    // Roll rewards for each participant
    battle.participants.forEach(player => {
      let playerTotal = 0;
      
      // For each case, roll a reward
      battleCases.forEach(caseItem => {
        const reward = rollCase(caseItem);
        rewards.push({ player, reward });
        playerTotal += reward.value;
      });
      
      // Track the highest winner
      if (playerTotal > maxValue) {
        maxValue = playerTotal;
        winner = player;
      }
    });
    
    // Update battle with results
    const updatedBattle = { ...battle };
    const completedBattle = { 
      ...updatedBattle, 
      status: "completed" as "waiting" | "in-progress" | "completed",
      rewards: rewards,
      winner: winner
    };
    
    setCaseBattles(prev => 
      prev.map(b => b.id === battleId ? completedBattle : b)
    );
    
    // Award the winner
    if (winner === user?.username) {
      updateBalance((user?.balance || 0) + maxValue);
      
      toast({
        title: "Battle Won!",
        description: `You won ${maxValue} credits from the case battle!`,
      });
    }
  };
  
  // Render a case card
  const renderCaseCard = (caseItem: Case) => (
    <Card key={caseItem.id} className="bg-zinc-900 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-xl">{caseItem.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-zinc-400">Price: ₡{caseItem.price.toLocaleString()}</p>
        <Button 
          onClick={() => openCase(caseItem)}
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={!isAuthenticated}
        >
          Open Case
        </Button>
      </CardContent>
    </Card>
  );
  
  // Render a battle card
  const renderBattleCard = (battle: CaseBattle) => {
    const battleCost = battle.cases.reduce((sum, caseId) => {
      const caseItem = cases.find(c => c.id === caseId);
      return sum + (caseItem?.price || 0);
    }, 0);
    
    return (
      <Card key={battle.id} className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl">{battle.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400">
            Participants: {battle.participants.join(", ")}
          </p>
          <p className="text-zinc-400">
            Cost per participant: ₡{battleCost.toLocaleString()}
          </p>
          
          {battle.participants.includes(user?.username || "") ? (
            battle.status === "in-progress" ? (
              <Button 
                onClick={() => completeBattle(battle.id)}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Complete Battle
              </Button>
            ) : (
              <p className="text-green-500 text-center">
                Waiting for other players to join...
              </p>
            )
          ) : (
            <Button 
              onClick={() => joinBattle(battle.id)}
              className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={battle.participants.length >= 5 || !isAuthenticated}
            >
              Join Battle
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };
  
  // Render a completed battle card
  const renderCompletedBattleCard = (battle: CaseBattle) => {
    return (
      <Card key={battle.id} className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-xl">{battle.name} - Completed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-zinc-400">
            Participants: {battle.participants.join(", ")}
          </p>
          <p className="text-zinc-400">
            Winner: {battle.winner}
          </p>
          
          {battle.rewards && (
            <div className="space-y-2">
              <h4 className="text-lg font-medium">Rewards</h4>
              {battle.rewards.map((reward, index) => (
                <p key={index} className="text-zinc-400">
                  {reward.player}: {reward.reward.name} (₡{reward.reward.value.toLocaleString()})
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  
  const renderCasesUI = () => {
    return (
      <Tabs defaultValue="cases" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="battles">Battles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cases" className="space-y-4">
          {/* Case grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cases.map((caseItem) => renderCaseCard(caseItem))}
          </div>
        </TabsContent>
        
        <TabsContent value="battles" className="space-y-6">
          {/* Create battle form */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-xl">Create Case Battle</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="battle-name">Battle Name</Label>
                <Input 
                  id="battle-name"
                  value={battleName}
                  onChange={(e) => setBattleName(e.target.value)}
                  placeholder="My Epic Battle"
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Select Cases</Label>
                <div className="flex flex-wrap gap-2">
                  {cases.map((caseItem) => (
                    <Badge
                      key={caseItem.id}
                      variant={selectedCases.includes(caseItem.id) ? "default" : "outline"}
                      className={`cursor-pointer ${
                        selectedCases.includes(caseItem.id) 
                          ? "bg-purple-600 hover:bg-purple-700" 
                          : "hover:bg-zinc-800"
                      }`}
                      onClick={() => toggleCaseSelection(caseItem.id)}
                    >
                      {caseItem.name} (₡{caseItem.price.toLocaleString()})
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="pt-2">
                <Button 
                  onClick={createBattle}
                  disabled={selectedCases.length === 0 || !battleName.trim() || !isAuthenticated}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  Create Battle (₡{calculateBattleCost().toLocaleString()})
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Active battles */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Active Battles</h3>
            
            {caseBattles.filter(battle => battle.status !== "completed").length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 text-center text-zinc-400">
                  No active battles right now.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {caseBattles
                  .filter(battle => battle.status !== "completed")
                  .map(battle => renderBattleCard(battle))
                }
              </div>
            )}
          </div>
          
          {/* Completed battles */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold">Completed Battles</h3>
            
            {caseBattles.filter(battle => battle.status === "completed").length === 0 ? (
              <Card className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-6 text-center text-zinc-400">
                  No completed battles yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {caseBattles
                  .filter(battle => battle.status === "completed")
                  .map(battle => renderCompletedBattleCard(battle))
                }
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    );
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Ship Cases</h1>
      
      {renderCasesUI()}
      
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4 text-sm text-zinc-400">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-2">
                <strong>How to play:</strong> Open cases to win valuable starships and credits.
              </p>
              <p>
                Participate in battles with other players to win even bigger rewards!
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CasesGame;
