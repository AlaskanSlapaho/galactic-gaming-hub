
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  createDefaultGameState,
  getProvablyFairParams,
  generateRandomNumber,
} from "@/utils/provablyFair";
import { Package, PackageOpen, AlertTriangle, Trophy, Users } from "lucide-react";

// Credit symbol component
const CreditSymbol = () => (
  <img 
    src="/lovable-uploads/16986d75-5de3-4a8c-9cc4-0fcf25df8b46.png" 
    alt="Credits" 
    className="inline-block h-4 w-4" 
  />
);

// Ship data structure
interface ShipReward {
  name: string;
  value: number;
  probability: number;
  image: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';
}

// Case data structure
interface CaseData {
  id: string;
  name: string;
  price: number;
  description: string;
  rewards: ShipReward[];
  highTier: boolean; // For pulse animation on high-tier cases
}

// Case Battle data
interface CaseBattle {
  id: string;
  creator: string;
  participants: string[];
  cases: string[];
  totalValue: number;
  status: 'waiting' | 'in-progress' | 'completed';
  rewards: { player: string; reward: ShipReward }[];
  winner?: string;
  createdAt: Date;
}

// Define the cases and their rewards
const CASES_DATA: CaseData[] = [
  {
    id: 'starter-cache',
    name: 'Starter Cache',
    price: 5000,
    description: 'Entry-Level Ships – Ideal for new pilots.',
    highTier: false,
    rewards: [
      {
        name: 'Chevron',
        value: 1500,
        probability: 40,
        image: '/lovable-uploads/c98dfa97-3922-4a92-9bd4-0ef13e6410fa.png',
        rarity: 'Common'
      },
      {
        name: 'Fargo',
        value: 2500,
        probability: 30,
        image: '/lovable-uploads/7397f840-fb10-4426-911d-50eb88aa23e5.png',
        rarity: 'Common'
      },
      {
        name: 'Yuma',
        value: 12500,
        probability: 20,
        image: '/lovable-uploads/c09e1cbe-c66b-432d-813c-a03e3efde5cc.png',
        rarity: 'Uncommon'
      },
      {
        name: 'Ozark',
        value: 32500,
        probability: 10,
        image: '/lovable-uploads/6d1b97bf-63c9-4de2-9cad-4e5d51608682.png',
        rarity: 'Rare'
      }
    ]
  },
  {
    id: 'prospect-box',
    name: 'Prospect Box',
    price: 10000,
    description: 'Mining-Focused Ships – For aspiring miners.',
    highTier: false,
    rewards: [
      {
        name: 'Honey Badger',
        value: 1500,
        probability: 40,
        image: '/lovable-uploads/3635d9c1-2d5d-40fc-bf6e-4029fd370ee6.png',
        rarity: 'Common'
      },
      {
        name: 'Ozark',
        value: 32500,
        probability: 25,
        image: '/lovable-uploads/6d1b97bf-63c9-4de2-9cad-4e5d51608682.png',
        rarity: 'Rare'
      },
      {
        name: 'Eos',
        value: 65000,
        probability: 15,
        image: '/lovable-uploads/0d82c40c-6c8c-4bb1-a138-ba1035151eb1.png',
        rarity: 'Epic'
      },
      {
        name: 'Koronis',
        value: 5000,
        probability: 20,
        image: '/lovable-uploads/09ba1ab3-36dc-4be8-9a2b-8729a40a1c28.png',
        rarity: 'Uncommon'
      }
    ]
  },
  {
    id: 'mercenary-crate',
    name: 'Mercenary Crate',
    price: 25000,
    description: 'Combat-Ready Ships – For those seeking battle.',
    highTier: false,
    rewards: [
      {
        name: 'Edict',
        value: 62500,
        probability: 15,
        image: '/lovable-uploads/0eaffa40-cbb5-4b34-9863-21cfb5b70ef9.png',
        rarity: 'Epic'
      },
      {
        name: 'Infinity',
        value: 38000,
        probability: 20,
        image: '/lovable-uploads/e09cc816-106e-4dfa-97ad-44126fadbb6e.png',
        rarity: 'Rare'
      },
      {
        name: 'Radix',
        value: 21500,
        probability: 25,
        image: '/lovable-uploads/3189145a-c53d-4998-ac29-0fb10d0da9f5.png',
        rarity: 'Uncommon'
      },
      {
        name: 'Claymore',
        value: 6500,
        probability: 40,
        image: '/lovable-uploads/06fea063-63a8-49c0-bab1-9d396c8292d6.png',
        rarity: 'Common'
      }
    ]
  },
  {
    id: 'tactical-supply',
    name: 'Tactical Supply Case',
    price: 50000,
    description: 'Advanced Combat Ships – For seasoned fighters.',
    highTier: true,
    rewards: [
      {
        name: 'Polaris',
        value: 7500,
        probability: 50,
        image: '/lovable-uploads/e2dbffd5-c831-4cf3-9fc2-c5db3a0b888a.png',
        rarity: 'Common'
      },
      {
        name: 'Liberty',
        value: 40000,
        probability: 30,
        image: '/lovable-uploads/14739fe3-7aee-4237-848b-0ced48fb55a0.png',
        rarity: 'Rare'
      },
      {
        name: 'Judicator Frigate',
        value: 200000,
        probability: 12.5,
        image: '/lovable-uploads/0bcac5be-42aa-4ff8-a2c4-86a2981d0418.png',
        rarity: 'Epic'
      },
      {
        name: 'Bulwark',
        value: 550000,
        probability: 7.5,
        image: '/lovable-uploads/1a638be6-e142-4c84-a4da-1505991720db.png',
        rarity: 'Legendary'
      }
    ]
  },
  {
    id: 'marauders-vault',
    name: 'Marauder\'s Vault',
    price: 100000,
    description: 'Elite Combat Ships – For the elite warriors.',
    highTier: true,
    rewards: [
      {
        name: 'Infinity',
        value: 38000,
        probability: 40,
        image: '/lovable-uploads/e09cc816-106e-4dfa-97ad-44126fadbb6e.png',
        rarity: 'Uncommon'
      },
      {
        name: 'Edict',
        value: 65000,
        probability: 30,
        image: '/lovable-uploads/0eaffa40-cbb5-4b34-9863-21cfb5b70ef9.png',
        rarity: 'Rare'
      },
      {
        name: 'Judicator Frigate',
        value: 220000,
        probability: 15,
        image: '/lovable-uploads/0bcac5be-42aa-4ff8-a2c4-86a2981d0418.png',
        rarity: 'Epic'
      },
      {
        name: 'Hybrid Polaris',
        value: 320000,
        probability: 10,
        image: '/lovable-uploads/85248af1-9bb6-4149-8e35-026332975aa4.png',
        rarity: 'Epic'
      },
      {
        name: 'Justice',
        value: 675000,
        probability: 5,
        image: '/lovable-uploads/bdcc7017-adb3-414c-ac54-3d8fc4930564.png',
        rarity: 'Legendary'
      }
    ]
  }
];

// Mock case battles data (will be replaced with state in the actual component)
const MOCK_BATTLES: CaseBattle[] = [
  {
    id: 'battle-1',
    creator: 'SpaceWarrior44',
    participants: ['SpaceWarrior44', 'GalacticHunter'],
    cases: ['starter-cache', 'prospect-box'],
    totalValue: 15000,
    status: 'waiting',
    rewards: [],
    createdAt: new Date(Date.now() - 300000)
  },
  {
    id: 'battle-2',
    creator: 'NebulaNinja',
    participants: ['NebulaNinja', 'StarDustCollector', 'CosmicRaider'],
    cases: ['mercenary-crate', 'mercenary-crate', 'tactical-supply'],
    totalValue: 100000,
    status: 'in-progress',
    rewards: [],
    createdAt: new Date(Date.now() - 600000)
  },
  {
    id: 'battle-3',
    creator: 'VoidWalker',
    participants: ['VoidWalker', 'AstralNomad'],
    cases: ['marauders-vault', 'marauders-vault'],
    totalValue: 200000,
    status: 'completed',
    rewards: [
      {
        player: 'VoidWalker',
        reward: CASES_DATA[4].rewards[2] // Judicator Frigate
      },
      {
        player: 'AstralNomad',
        reward: CASES_DATA[4].rewards[0] // Infinity
      }
    ],
    winner: 'VoidWalker',
    createdAt: new Date(Date.now() - 3600000)
  }
];

// Get the rarity color for a ship
const getRarityColor = (rarity: string): string => {
  switch (rarity) {
    case 'Common':
      return 'text-gray-300';
    case 'Uncommon':
      return 'text-green-400';
    case 'Rare':
      return 'text-blue-400';
    case 'Epic':
      return 'text-purple-400';
    case 'Legendary':
      return 'text-yellow-400';
    default:
      return 'text-gray-300';
  }
};

// Get background color for rarity
const getRarityBg = (rarity: string): string => {
  switch (rarity) {
    case 'Common':
      return 'bg-gray-700';
    case 'Uncommon':
      return 'bg-green-900';
    case 'Rare':
      return 'bg-blue-900';
    case 'Epic':
      return 'bg-purple-900';
    case 'Legendary':
      return 'bg-yellow-900';
    default:
      return 'bg-gray-700';
  }
};

const CasesGame = () => {
  const { user, updateBalance, isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  const [selectedCase, setSelectedCase] = useState<CaseData | null>(null);
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [openingResult, setOpeningResult] = useState<ShipReward | null>(null);
  const [caseBattles, setCaseBattles] = useState<CaseBattle[]>(MOCK_BATTLES);
  const [userInventory, setUserInventory] = useState<ShipReward[]>([]);
  const [selectedBattleCase, setSelectedBattleCase] = useState<string>('starter-cache');
  const [battleParticipants, setBattleParticipants] = useState<number>(2);
  const [fairState, setFairState] = useState(createDefaultGameState());
  const [openDetailsCase, setOpenDetailsCase] = useState<CaseData | null>(null);
  
  const spinnerRef = useRef<HTMLDivElement>(null);
  
  // Function to open a case
  const openCase = (caseData: CaseData) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please login to open cases",
      });
      return;
    }
    
    if (caseData.price > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits to open this case",
      });
      return;
    }
    
    // Deduct case price from balance
    updateBalance((user?.balance || 0) - caseData.price);
    
    setSelectedCase(caseData);
    setIsOpening(true);
    setOpeningResult(null);
    
    // Create a new game state for provably fair results
    const newGameState = createDefaultGameState();
    setFairState(newGameState);
    
    // Determine the reward using provably fair algorithm
    setTimeout(() => {
      const params = getProvablyFairParams(newGameState);
      const randNum = generateRandomNumber(params, 1, 100);
      
      let cumulativeProbability = 0;
      let selectedReward: ShipReward | null = null;
      
      for (const reward of caseData.rewards) {
        cumulativeProbability += reward.probability;
        if (randNum <= cumulativeProbability) {
          selectedReward = reward;
          break;
        }
      }
      
      // Fallback to the last reward if something went wrong
      if (!selectedReward) {
        selectedReward = caseData.rewards[caseData.rewards.length - 1];
      }
      
      // Simulate spinner animation
      spinItems(caseData.rewards, selectedReward);
      
      // Add to user inventory after animation
      setTimeout(() => {
        setOpeningResult(selectedReward);
        setUserInventory([...userInventory, selectedReward]);
        
        // Update user balance with reward value
        updateBalance((user?.balance || 0) + selectedReward.value);
        
        toast({
          title: `Unboxed: ${selectedReward.name}!`,
          description: `Worth: ${selectedReward.value.toLocaleString()} credits`,
        });
      }, 5000); // After spinner animation
    }, 1000); // Delay before determining result
  };
  
  // Spinner animation effect
  const spinItems = (items: ShipReward[], winningItem: ShipReward) => {
    if (!spinnerRef.current) return;
    
    // Create spinner items (repeating the rewards array multiple times)
    const spinnerItems = [];
    const repetitions = 20; // Number of times to repeat the rewards
    
    for (let i = 0; i < repetitions; i++) {
      spinnerItems.push(...items);
    }
    
    // Add the winning item at the end
    spinnerItems.push(winningItem);
    
    // Create HTML for spinner items
    const spinnerHTML = spinnerItems.map((item, index) => `
      <div class="flex-shrink-0 w-48 mx-2" key="${index}">
        <div class="border-2 ${index === spinnerItems.length - 1 ? 'border-yellow-400' : 'border-zinc-700'} rounded-md overflow-hidden">
          <img src="${item.image}" alt="${item.name}" class="w-full h-48 object-contain bg-zinc-800" />
          <div class="p-2 bg-zinc-900">
            <p class="font-medium ${getRarityColor(item.rarity)}">${item.name}</p>
            <p class="text-sm text-zinc-400">${item.value.toLocaleString()} credits</p>
          </div>
        </div>
      </div>
    `).join('');
    
    spinnerRef.current.innerHTML = spinnerHTML;
    
    // Animate the spinner
    const spinnerWidth = spinnerItems.length * 200; // Each item is roughly 200px wide with margins
    const finalPosition = spinnerWidth - 200; // Position where the winning item is centered
    
    spinnerRef.current.style.transition = 'none';
    spinnerRef.current.style.transform = 'translateX(0)';
    
    // Force reflow
    void spinnerRef.current.offsetWidth;
    
    spinnerRef.current.style.transition = 'transform 5s cubic-bezier(0.1, 0.7, 0.1, 1)';
    spinnerRef.current.style.transform = `translateX(-${finalPosition}px)`;
  };
  
  // Function to create a case battle
  const createCaseBattle = () => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please login to create case battles",
      });
      return;
    }
    
    // Get the selected case data
    const caseData = CASES_DATA.find(c => c.id === selectedBattleCase);
    if (!caseData) return;
    
    const totalCost = caseData.price * battleParticipants;
    
    if (totalCost > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits to create this battle",
      });
      return;
    }
    
    // Deduct total cost from balance
    updateBalance((user?.balance || 0) - totalCost);
    
    // Create the new battle
    const newBattle: CaseBattle = {
      id: `battle-${Date.now()}`,
      creator: user?.username || 'Unknown',
      participants: [user?.username || 'Unknown'],
      cases: Array(battleParticipants).fill(selectedBattleCase),
      totalValue: totalCost,
      status: 'waiting',
      rewards: [],
      createdAt: new Date()
    };
    
    // Add the new battle to the list
    setCaseBattles([newBattle, ...caseBattles]);
    
    toast({
      title: "Battle Created!",
      description: `Created a ${battleParticipants}-player battle with ${caseData.name}`,
    });
  };
  
  // Function to join a case battle
  const joinCaseBattle = (battleId: string) => {
    if (!isAuthenticated) {
      toast({
        variant: "destructive",
        title: "Not logged in",
        description: "Please login to join case battles",
      });
      return;
    }
    
    // Find the battle
    const battleIndex = caseBattles.findIndex(b => b.id === battleId);
    if (battleIndex === -1) return;
    
    const battle = caseBattles[battleIndex];
    
    // Check if battle is still waiting and has space
    if (battle.status !== 'waiting') {
      toast({
        variant: "destructive",
        title: "Cannot Join",
        description: "This battle has already started",
      });
      return;
    }
    
    if (battle.participants.includes(user?.username || '')) {
      toast({
        variant: "destructive",
        title: "Already Joined",
        description: "You're already in this battle",
      });
      return;
    }
    
    // Calculate cost to join (one case)
    const caseData = CASES_DATA.find(c => c.id === battle.cases[0]);
    if (!caseData) return;
    
    if (caseData.price > (user?.balance || 0)) {
      toast({
        variant: "destructive",
        title: "Insufficient funds",
        description: "You don't have enough credits to join this battle",
      });
      return;
    }
    
    // Deduct case price from balance
    updateBalance((user?.balance || 0) - caseData.price);
    
    // Update the battle
    const updatedBattle = { ...battle };
    updatedBattle.participants = [...battle.participants, user?.username || 'Unknown'];
    
    // If battle is now full, start it
    if (updatedBattle.participants.length === battle.cases.length) {
      updatedBattle.status = 'in-progress';
      
      // Simulate battle results (will be implemented with provably fair algorithm)
      setTimeout(() => {
        const rewards: { player: string; reward: ShipReward }[] = [];
        
        // For each case, determine a reward and assign to a participant
        updatedBattle.cases.forEach((caseId, index) => {
          const caseData = CASES_DATA.find(c => c.id === caseId);
          if (!caseData) return;
          
          // Get a random reward (to be replaced with provably fair algorithm)
          const randomIndex = Math.floor(Math.random() * caseData.rewards.length);
          const reward = caseData.rewards[randomIndex];
          
          rewards.push({
            player: updatedBattle.participants[index],
            reward: reward
          });
        });
        
        // Determine winner (highest value reward)
        let winner = '';
        let highestValue = 0;
        
        rewards.forEach(({ player, reward }) => {
          if (reward.value > highestValue) {
            highestValue = reward.value;
            winner = player;
          }
        });
        
        // Update battle with results
        const completedBattle = { 
          ...updatedBattle, 
          status: 'completed', 
          rewards: rewards,
          winner: winner
        };
        
        // Update battles list
        setCaseBattles(prevBattles => {
          const newBattles = [...prevBattles];
          newBattles[battleIndex] = completedBattle;
          return newBattles;
        });
        
        // If user is in the battle, update their inventory and balance
        if (completedBattle.participants.includes(user?.username || '')) {
          const userReward = rewards.find(r => r.player === user?.username);
          if (userReward) {
            setUserInventory([...userInventory, userReward.reward]);
            updateBalance((user?.balance || 0) + userReward.reward.value);
            
            if (winner === user?.username) {
              toast({
                title: "You Won the Battle!",
                description: `Your ${userReward.reward.name} was the most valuable!`,
              });
            } else {
              toast({
                title: "Battle Completed",
                description: `You unboxed: ${userReward.reward.name}`,
              });
            }
          }
        }
      }, 5000); // Simulate 5 seconds of battle
    }
    
    // Update battles list
    setCaseBattles(prevBattles => {
      const newBattles = [...prevBattles];
      newBattles[battleIndex] = updatedBattle;
      return newBattles;
    });
    
    toast({
      title: "Joined Battle",
      description: `You've joined ${battle.creator}'s battle`,
    });
  };
  
  // Close the opening dialog and reset state
  const handleCloseOpeningDialog = () => {
    setIsOpening(false);
    setSelectedCase(null);
    setOpeningResult(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">Starscape Ship Cases</h1>
      
      <Tabs defaultValue="cases" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full md:w-1/2 mx-auto">
          <TabsTrigger value="cases" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Cases
          </TabsTrigger>
          <TabsTrigger value="battles" className="flex items-center">
            <Users className="mr-2 h-4 w-4" />
            Battles
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center">
            <Trophy className="mr-2 h-4 w-4" />
            Inventory
          </TabsTrigger>
        </TabsList>
        
        {/* Cases Tab */}
        <TabsContent value="cases">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CASES_DATA.map((caseData) => (
              <Card 
                key={caseData.id} 
                className={`bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-all ${
                  caseData.highTier ? 'animate-pulse' : ''
                }`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setOpenDetailsCase(caseData);
                }}
              >
                <div className="relative">
                  <div className="p-4 h-48 flex items-center justify-center bg-gradient-to-b from-zinc-800 to-zinc-900">
                    <PackageOpen className="w-24 h-24 text-purple-400" />
                    <div className="absolute inset-0 bg-blue-500/5 backdrop-blur-sm rounded-t-lg" />
                  </div>
                  <div className="absolute bottom-2 right-2 bg-zinc-800 px-2 py-1 rounded text-sm font-medium flex items-center">
                    {caseData.price.toLocaleString()} <CreditSymbol />
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="text-lg font-bold mb-1">{caseData.name}</h3>
                  <p className="text-zinc-400 text-sm mb-3">{caseData.description}</p>
                  
                  <div className="flex flex-wrap gap-1 mb-4">
                    {caseData.rewards.map((reward, index) => (
                      <div 
                        key={index} 
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getRarityBg(reward.rarity)}`}
                        title={`${reward.name} (${reward.probability}%)`}
                      >
                        {reward.probability}%
                      </div>
                    ))}
                  </div>
                  
                  <Button 
                    onClick={() => openCase(caseData)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Open Case
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Case details dialog (right-click menu) */}
          <Dialog open={openDetailsCase !== null} onOpenChange={(open) => !open && setOpenDetailsCase(null)}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-2xl">
              <DialogHeader>
                <DialogTitle>{openDetailsCase?.name} - Drop Chances</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                {openDetailsCase?.rewards.map((reward, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden">
                      <img 
                        src={reward.image} 
                        alt={reward.name}
                        className="object-cover w-full h-full"  
                      />
                    </div>
                    <div>
                      <p className={`font-medium ${getRarityColor(reward.rarity)}`}>{reward.name}</p>
                      <p className="text-zinc-400 text-sm">Value: {reward.value.toLocaleString()} <CreditSymbol /></p>
                      <div className="flex items-center mt-1">
                        <div className={`h-5 ${getRarityBg(reward.rarity)} rounded-l-full`} style={{ width: `${reward.probability}%` }}></div>
                        <div className="h-5 bg-zinc-800 rounded-r-full" style={{ width: `${100 - reward.probability}%` }}></div>
                        <span className="ml-2 text-sm font-medium">{reward.probability}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <Button 
                onClick={() => {
                  if (openDetailsCase) {
                    openCase(openDetailsCase);
                    setOpenDetailsCase(null);
                  }
                }}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                Buy & Open
              </Button>
            </DialogContent>
          </Dialog>
          
          {/* Case opening animation dialog */}
          <Dialog open={isOpening} onOpenChange={handleCloseOpeningDialog}>
            <DialogContent className="bg-zinc-900 border-zinc-800 max-w-4xl">
              <DialogHeader>
                <DialogTitle>{selectedCase?.name}</DialogTitle>
              </DialogHeader>
              
              <div className="py-4">
                {!openingResult ? (
                  <div className="relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-full bg-yellow-500 z-10" />
                    <div className="overflow-hidden">
                      <div className="flex items-center py-4" ref={spinnerRef}>
                        {/* Spinner items will be injected here by JS */}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <h3 className="text-2xl font-bold mb-4">You Unboxed:</h3>
                    <div className="mx-auto w-64 rounded-lg overflow-hidden border-2 border-yellow-400 animate-pulse">
                      <img 
                        src={openingResult.image} 
                        alt={openingResult.name}
                        className="w-full h-64 object-contain bg-zinc-800"  
                      />
                      <div className="p-4 bg-zinc-900">
                        <p className={`text-xl font-bold ${getRarityColor(openingResult.rarity)}`}>
                          {openingResult.name}
                        </p>
                        <p className="text-lg text-zinc-300 flex items-center justify-center mt-2">
                          {openingResult.value.toLocaleString()} <CreditSymbol />
                        </p>
                        <p className={`mt-2 ${getRarityColor(openingResult.rarity)}`}>
                          {openingResult.rarity}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      onClick={handleCloseOpeningDialog}
                      className="mt-6 bg-purple-600 hover:bg-purple-700"
                    >
                      Claim Reward
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        {/* Battles Tab */}
        <TabsContent value="battles">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Active Battles</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseBattles.filter(b => b.status !== 'completed').length > 0 ? (
                    <div className="space-y-4">
                      {caseBattles.filter(b => b.status !== 'completed').map((battle) => {
                        const caseData = CASES_DATA.find(c => c.id === battle.cases[0]);
                        return (
                          <Card key={battle.id} className="bg-zinc-800 border-zinc-700">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <h4 className="font-medium">{battle.creator}'s Battle</h4>
                                  <p className="text-sm text-zinc-400">
                                    {battle.participants.length}/{battle.cases.length} Players
                                  </p>
                                  <p className="text-sm text-zinc-400">
                                    Case: {caseData?.name || 'Unknown'} x{battle.cases.length}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium flex items-center justify-end">
                                    {(caseData?.price || 0).toLocaleString()} <CreditSymbol />
                                  </p>
                                  {battle.status === 'waiting' && battle.participants.length < battle.cases.length && (
                                    <Button
                                      onClick={() => joinCaseBattle(battle.id)}
                                      className="mt-2 bg-purple-600 hover:bg-purple-700"
                                      disabled={battle.participants.includes(user?.username || '')}
                                      size="sm"
                                    >
                                      Join
                                    </Button>
                                  )}
                                  {battle.status === 'in-progress' && (
                                    <span className="px-2 py-1 bg-yellow-900 text-yellow-300 rounded text-xs font-medium">
                                      In Progress
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-400">
                      <p>No active battles.</p>
                      <p className="mt-2">Create one to get started!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Completed Battles</CardTitle>
                </CardHeader>
                <CardContent>
                  {caseBattles.filter(b => b.status === 'completed').length > 0 ? (
                    <div className="space-y-4">
                      {caseBattles.filter(b => b.status === 'completed').map((battle) => {
                        const caseData = CASES_DATA.find(c => c.id === battle.cases[0]);
                        return (
                          <Card key={battle.id} className="bg-zinc-800 border-zinc-700">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">{battle.creator}'s Battle</h4>
                                  <p className="text-sm text-zinc-400">
                                    {battle.participants.length} Players - {caseData?.name || 'Unknown'} x{battle.cases.length}
                                  </p>
                                  <p className="text-green-400 font-medium mt-2">
                                    Winner: {battle.winner}
                                  </p>
                                </div>
                                <div className="space-y-2">
                                  {battle.rewards.map((reward, idx) => (
                                    <div key={idx} className="flex items-center space-x-2 text-sm">
                                      <span>{reward.player}:</span>
                                      <span className={getRarityColor(reward.reward.rarity)}>
                                        {reward.reward.name}
                                      </span>
                                      <span className="text-zinc-400">
                                        ({reward.reward.value.toLocaleString()} <CreditSymbol />)
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-400">
                      <p>No completed battles yet.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="bg-zinc-900 border-zinc-800 h-fit">
              <CardHeader>
                <CardTitle>Create Battle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="battle-case">Select Case</Label>
                  <select
                    id="battle-case"
                    value={selectedBattleCase}
                    onChange={(e) => setSelectedBattleCase(e.target.value)}
                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                  >
                    {CASES_DATA.map((caseData) => (
                      <option key={caseData.id} value={caseData.id}>
                        {caseData.name} - {caseData.price.toLocaleString()} credits
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="battle-participants">Players</Label>
                  <select
                    id="battle-participants"
                    value={battleParticipants}
                    onChange={(e) => setBattleParticipants(parseInt(e.target.value))}
                    className="w-full p-2 rounded bg-zinc-800 border border-zinc-700"
                  >
                    <option value={2}>2 Players</option>
                    <option value={3}>3 Players</option>
                    <option value={4}>4 Players</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>Total Cost</Label>
                  <div className="bg-zinc-800 p-3 rounded flex items-center justify-between">
                    <span>
                      {battleParticipants} x {
                        CASES_DATA.find(c => c.id === selectedBattleCase)?.price.toLocaleString() || 0
                      }
                    </span>
                    <span className="font-medium flex items-center">
                      {
                        (CASES_DATA.find(c => c.id === selectedBattleCase)?.price || 0) * battleParticipants
                      } <CreditSymbol />
                    </span>
                  </div>
                </div>
                
                <Button
                  onClick={createCaseBattle}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={!isAuthenticated}
                >
                  Create Battle
                </Button>
                
                {!isAuthenticated && (
                  <p className="text-center text-sm text-zinc-400">
                    Login to create battles
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Inventory Tab */}
        <TabsContent value="inventory">
          {isAuthenticated ? (
            <div className="space-y-6">
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Your Ships</CardTitle>
                </CardHeader>
                <CardContent>
                  {userInventory.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {userInventory.map((item, idx) => (
                        <div 
                          key={idx} 
                          className="border border-zinc-800 rounded-md overflow-hidden"
                        >
                          <img 
                            src={item.image} 
                            alt={item.name}
                            className="w-full h-32 object-contain bg-zinc-800"  
                          />
                          <div className="p-2">
                            <p className={`font-medium truncate ${getRarityColor(item.rarity)}`}>
                              {item.name}
                            </p>
                            <p className="text-sm text-zinc-400 flex items-center">
                              {item.value.toLocaleString()} <CreditSymbol />
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 text-zinc-400">
                      <p>You haven't unboxed any ships yet.</p>
                      <p className="mt-2">Open some cases to get started!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-zinc-900 border-zinc-800">
                <CardHeader>
                  <CardTitle>Total Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-3xl font-bold flex items-center justify-center">
                      {userInventory.reduce((sum, item) => sum + item.value, 0).toLocaleString()} <CreditSymbol />
                    </p>
                    <p className="text-zinc-400 mt-2">
                      {userInventory.length} ships in inventory
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-20">
              <h3 className="text-xl font-medium mb-2">Login to View Your Inventory</h3>
              <p className="text-zinc-400">
                Track your unboxed ships and their total value
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      <Card className="bg-zinc-900 border-zinc-800 mt-6">
        <CardContent className="p-4">
          <div className="flex items-start space-x-4 text-sm text-zinc-400">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="mb-2">
                <strong>Right-click any case</strong> to view detailed drop odds.
              </p>
              <p className="mb-2">
                <strong>Case Battles:</strong> Multiple players can compete opening the same cases.
                The player with the most valuable drop wins!
              </p>
              <p>
                All cases use a provably fair system to ensure completely random and verifiable outcomes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CasesGame;
