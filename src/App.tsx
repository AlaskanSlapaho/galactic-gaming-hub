
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import MainLayout from "@/components/layouts/MainLayout";
import HomePage from "./pages/Index";
import NotFound from "./pages/NotFound";
import MinesGame from "./pages/games/MinesGame";
import DiceGame from "./pages/games/DiceGame";
import TowerGame from "./pages/games/TowerGame";
import BlackjackGame from "./pages/games/BlackjackGame";
import HiLoGame from "./pages/games/HiLoGame";
import RouletteGame from "./pages/games/RouletteGame";
import LeaderboardPage from "./pages/LeaderboardPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPanel from "./pages/AdminPanel";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/games/mines" element={<MinesGame />} />
              <Route path="/games/dice" element={<DiceGame />} />
              <Route path="/games/tower" element={<TowerGame />} />
              <Route path="/games/blackjack" element={<BlackjackGame />} />
              <Route path="/games/hilo" element={<HiLoGame />} />
              <Route path="/games/roulette" element={<RouletteGame />} />
              <Route path="/leaderboard" element={<LeaderboardPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
