
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
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminPanel from "./pages/AdminPanel";
import { DiscordAuthCallback } from "./components/auth/DiscordAuthCallback";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth/callback" element={<DiscordAuthCallback />} />
            <Route path="/" element={
              <MainLayout>
                <HomePage />
              </MainLayout>
            } />
            <Route path="/games/mines" element={
              <MainLayout>
                <MinesGame />
              </MainLayout>
            } />
            <Route path="/games/dice" element={
              <MainLayout>
                <DiceGame />
              </MainLayout>
            } />
            <Route path="/games/tower" element={
              <MainLayout>
                <TowerGame />
              </MainLayout>
            } />
            <Route path="/games/blackjack" element={
              <MainLayout>
                <BlackjackGame />
              </MainLayout>
            } />
            <Route path="/games/hilo" element={
              <MainLayout>
                <HiLoGame />
              </MainLayout>
            } />
            <Route path="/leaderboard" element={
              <MainLayout>
                <LeaderboardPage />
              </MainLayout>
            } />
            <Route path="/admin" element={
              <MainLayout>
                <AdminPanel />
              </MainLayout>
            } />
            <Route path="*" element={
              <MainLayout>
                <NotFound />
              </MainLayout>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
