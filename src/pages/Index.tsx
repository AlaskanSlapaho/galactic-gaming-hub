
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
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="relative py-16 px-4 sm:px-6 lg:px-8 rounded-xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20 backdrop-blur-sm" />
        <div className="relative z-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl md:text-6xl">
            Welcome to SOLs Casino
          </h1>
          <p className="mt-6 text-xl text-zinc-300 max-w-2xl mx-auto">
            Experience our provably fair games and compete with players from around the galaxy.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            {!isAuthenticated && (
              <Button 
                size="lg" 
                className="bg-indigo-600 hover:bg-indigo-700 text-lg flex items-center gap-2"
                onClick={(e) => {
                  e.preventDefault();
                  document.querySelector<HTMLButtonElement>('button')?.click();
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                </svg>
                Login with Discord
              </Button>
            )}
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
          <h3 className="text-xl font-bold mb-3">Discord Integration</h3>
          <p className="text-zinc-400">
            Connect your Discord account to deposit and withdraw credits seamlessly between platforms.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
