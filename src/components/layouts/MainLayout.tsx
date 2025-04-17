
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { AuthModal } from "../auth/AuthModal";
import { MenuIcon, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useMobile } from "@/hooks/use-mobile";
import ChatBox from "../chat/ChatBox";
import { AdminCommandHandler } from "../admin/AdminCommandHandler";
import { toast } from "sonner";
import { discordService } from "@/services/discord";

interface NavItemProps {
  to: string;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
}

const NavItem = ({ to, label, isActive, onClick }: NavItemProps) => (
  <li className="mb-1">
    <Link
      to={to}
      className={`block w-full py-2.5 px-4 rounded transition-colors ${
        isActive
          ? "bg-purple-900 text-white"
          : "text-gray-300 hover:bg-zinc-800"
      }`}
      onClick={onClick}
    >
      {label}
    </Link>
  </li>
);

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const { isMobile } = useMobile();
  const { user, isAuthenticated, logout, updateBalance } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>("1000");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("1000");
  const [discordBalance, setDiscordBalance] = useState<number | null>(null);

  useEffect(() => {
    // Get Discord balance when the component mounts
    const getBalance = async () => {
      if (isAuthenticated) {
        const balance = await discordService.getDiscordBalance();
        setDiscordBalance(balance);
      }
    };
    
    getBalance();
  }, [isAuthenticated]);

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogin = () => {
    setIsAuthModalOpen(true);
  };

  const handleDeposit = async () => {
    if (!user || !isAuthenticated) {
      toast.error("You need to be logged in to deposit");
      return;
    }

    const amount = parseInt(depositAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > (discordBalance || 0)) {
      toast.error("You don't have enough credits on Discord");
      return;
    }

    const success = await discordService.depositCredits(user.discordId || "", amount);
    if (success) {
      updateBalance((user.balance || 0) + amount);
      setDiscordBalance((discordBalance || 0) - amount);
      toast.success(`Successfully deposited ${amount} credits`);
      setIsDepositModalOpen(false);
    } else {
      toast.error("Failed to deposit credits");
    }
  };

  const handleWithdraw = async () => {
    if (!user || !isAuthenticated) {
      toast.error("You need to be logged in to withdraw");
      return;
    }

    const amount = parseInt(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (amount > (user.balance || 0)) {
      toast.error("You don't have enough credits to withdraw");
      return;
    }

    const success = await discordService.withdrawCredits(user.discordId || "", amount);
    if (success) {
      updateBalance((user.balance || 0) - amount);
      setDiscordBalance((discordBalance || 0) + amount);
      toast.success(`Successfully withdrew ${amount} credits to Discord`);
      setIsWithdrawModalOpen(false);
    } else {
      toast.error("Failed to withdraw credits");
    }
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  const refreshDiscordBalance = async () => {
    const balance = await discordService.getDiscordBalance();
    setDiscordBalance(balance);
    toast.success("Discord balance refreshed");
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden mr-4"
            >
              <MenuIcon />
            </button>
            <Link to="/" className="text-xl font-bold text-white">
              SOLs Casino
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <>
                <div className="hidden md:block">
                  <span className="text-purple-400 mr-2">{user.username}</span>
                  <span className="bg-zinc-800 px-3 py-1 rounded-md">
                    {user.balance?.toLocaleString()} ₡
                  </span>
                </div>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsDepositModalOpen(true)}
                    className="bg-green-600 hover:bg-green-700 border-0 text-white"
                  >
                    Deposit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    className="bg-red-600 hover:bg-red-700 border-0 text-white"
                  >
                    Withdraw
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={logout}
                    className="border-zinc-700 hidden md:inline-flex"
                  >
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  onClick={handleLogin}
                  className="bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.545 2.907a13.227 13.227 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.19 12.19 0 0 0-3.658 0 8.258 8.258 0 0 0-.412-.833.051.051 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.041.041 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032c.001.014.01.028.021.037a13.276 13.276 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019c.308-.42.582-.863.818-1.329a.05.05 0 0 0-.01-.059.051.051 0 0 0-.018-.011 8.875 8.875 0 0 1-1.248-.595.05.05 0 0 1-.02-.066.051.051 0 0 1 .015-.019c.084-.063.168-.129.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.052.052 0 0 1 .053.007c.08.066.164.132.248.195a.051.051 0 0 1-.004.085 8.254 8.254 0 0 1-1.249.594.05.05 0 0 0-.03.03.052.052 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.235 13.235 0 0 0 4.001-2.02.049.049 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.034.034 0 0 0-.02-.019Zm-8.198 7.307c-.789 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612Zm5.316 0c-.788 0-1.438-.724-1.438-1.612 0-.889.637-1.613 1.438-1.613.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612Z"/>
                  </svg>
                  Login with Discord
                </Button>
              </div>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="ml-2"
              onClick={toggleChat}
            >
              Chat
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`bg-zinc-900 border-r border-zinc-800 w-64 fixed lg:static top-0 left-0 h-full z-40 transform transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
          }`}
        >
          <div className="flex justify-between items-center p-4 lg:hidden">
            <h2 className="text-xl font-bold">Menu</h2>
            <button onClick={() => setIsSidebarOpen(false)}>
              <X />
            </button>
          </div>

          <nav className="pt-4 px-2 space-y-6">
            <div>
              <h3 className="px-4 text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-2">
                Main
              </h3>
              <ul>
                <NavItem
                  to="/"
                  label="Home"
                  isActive={pathname === "/"}
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/leaderboard"
                  label="Leaderboard"
                  isActive={pathname === "/leaderboard"}
                  onClick={closeSidebar}
                />
              </ul>
            </div>

            <div>
              <h3 className="px-4 text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-2">
                Games
              </h3>
              <ul>
                <NavItem
                  to="/games/mines"
                  label="Mines"
                  isActive={pathname === "/games/mines"}
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/games/dice"
                  label="Dice"
                  isActive={pathname === "/games/dice"}
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/games/tower"
                  label="Tower"
                  isActive={pathname === "/games/tower"}
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/games/blackjack"
                  label="Blackjack"
                  isActive={pathname === "/games/blackjack"}
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/games/hilo"
                  label="HiLo"
                  isActive={pathname === "/games/hilo"}
                  onClick={closeSidebar}
                />
              </ul>
            </div>

            {isAuthenticated && (
              <div className="pt-4 px-4">
                <Button
                  onClick={logout}
                  className="w-full bg-zinc-800 hover:bg-zinc-700"
                >
                  Logout
                </Button>
              </div>
            )}
          </nav>
        </aside>

        {isChatVisible && (
          <div className="hidden lg:block w-72 border-l border-zinc-800">
            <ChatBox />
          </div>
        )}

        {isMobile && isChatVisible && (
          <div className="fixed inset-0 bg-black/50 z-50">
            <div className="absolute right-0 top-0 h-full w-[90vw] max-w-md">
              <div className="flex h-full">
                <Button
                  variant="ghost"
                  className="absolute top-2 left-2 h-8 w-8 p-0"
                  onClick={toggleChat}
                >
                  <X />
                </Button>
                <div className="flex-1">
                  <ChatBox />
                </div>
              </div>
            </div>
          </div>
        )}

        <main className={`flex-1 overflow-y-auto p-4 md:p-6 ${isChatVisible ? "lg:mr-72" : ""}`}>
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>

      <AuthModal
        open={isAuthModalOpen}
        onOpenChange={setIsAuthModalOpen}
      />

      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Deposit Credits</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Transfer credits from Discord to SOLs Casino.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-zinc-800 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Discord Balance:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{discordBalance?.toLocaleString() || "0"} ₡</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6 rounded-full p-0"
                    onClick={refreshDiscordBalance}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit-amount">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                min="1"
                step="1"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDepositModalOpen(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button onClick={handleDeposit} className="bg-green-600 hover:bg-green-700">
              Deposit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Withdraw Credits</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Transfer credits from SOLs Casino to Discord.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="bg-zinc-800 p-3 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm text-zinc-400">Discord Balance:</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{discordBalance?.toLocaleString() || "0"} ₡</span>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-6 w-6 rounded-full p-0"
                    onClick={refreshDiscordBalance}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" viewBox="0 0 16 16">
                      <path fillRule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
                      <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
                    </svg>
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <Input
                id="withdraw-amount"
                type="number"
                min="1"
                step="1"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                className="bg-zinc-800 border-zinc-700"
              />
              <p className="text-sm">
                Available: <span className="font-medium">{user?.balance?.toLocaleString() || 0} ₡</span>
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsWithdrawModalOpen(false)}
              className="border-zinc-700"
            >
              Cancel
            </Button>
            <Button onClick={handleWithdraw} className="bg-red-600 hover:bg-red-700">
              Withdraw
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AdminCommandHandler />
    </div>
  );
};

export default MainLayout;
