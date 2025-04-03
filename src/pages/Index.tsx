
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const HomePage = () => {
  const { isAuthenticated } = useAuth();

  const games = [
    {
      id: "mines",
      name: "Mines",
      description: "Find treasures without triggering mines.",
      path: "/games/mines",
    },
    {
      id: "dice",
      name: "Dice",
      description: "Bet on the outcome of a dice roll.",
      path: "/games/dice",
    },
    {
      id: "tower",
      name: "Tower",
      description: "Climb the tower without hitting a mine.",
      path: "/games/tower",
    },
    {
      id: "blackjack",
      name: "Blackjack",
      description: "Beat the dealer without going over 21.",
      path: "/games/blackjack",
    },
    {
      id: "hilo",
      name: "HiLo",
      description: "Predict if the next card is higher or lower.",
      path: "/games/hilo",
    },
    {
      id: "roulette",
      name: "Roulette",
      description: "Bet on where the ball will land on the wheel.",
      path: "/games/roulette",
    },
    {
      id: "cases",
      name: "Ship Cases",
      description: "Open cases to win valuable starships.",
      path: "/games/cases",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative py-16 px-4 sm:px-6 lg:px-8 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Welcome to GalacticLedgers
          </h1>
          <p className="mt-6 text-xl text-zinc-300 max-w-2xl mx-auto">
            Experience our provably fair games and compete with players from around the galaxy.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            {!isAuthenticated && (
              <Button 
                asChild
                size="lg" 
                className="bg-purple-600 hover:bg-purple-700 text-lg"
              >
                <Link to="#" onClick={(e) => {
                  e.preventDefault();
                  document.querySelector<HTMLButtonElement>('[data-auth-trigger="register"]')?.click();
                }}>
                  Register Now
                </Link>
              </Button>
            )}
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-zinc-700 hover:bg-zinc-800 text-lg"
            >
              <Link to="#" onClick={(e) => {
                e.preventDefault();
                window.open("https://discord.com/invite/efWx9PhE95", "_blank");
              }}>
                Join Discord to Deposit/Withdraw
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Games Section */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-center">Featured Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map(game => (
            <Card key={game.id} className="bg-zinc-900 border-zinc-800 overflow-hidden">
              <div className="relative aspect-video bg-gradient-to-br from-purple-900/30 via-blue-900/30 to-teal-900/30">
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-3xl font-bold">{game.name}</h3>
                </div>
              </div>
              <CardContent className="p-6">
                <p className="text-zinc-400 mb-4">{game.description}</p>
                <div className="flex justify-end items-center">
                  <Button asChild className="bg-purple-600 hover:bg-purple-700">
                    <Link to={game.path}>Play Now</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Feature Section */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-bold mb-3">Provably Fair</h3>
          <p className="text-zinc-400">
            All games use a provably fair system to ensure completely random and verifiable outcomes.
          </p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-bold mb-3">Instant Games</h3>
          <p className="text-zinc-400">
            No waiting or loading - our games run instantly with smooth animations and responsive design.
          </p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-lg border border-zinc-800">
          <h3 className="text-xl font-bold mb-3">Live Community</h3>
          <p className="text-zinc-400">
            Chat with other players, celebrate wins, and become part of our growing community.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
