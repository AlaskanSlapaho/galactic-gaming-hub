
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import AuthModal from "../auth/AuthModal";
import { AuthTabs } from "../auth/AuthModal";
import { MenuIcon, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useMobile } from "@/hooks/use-mobile";
import ChatBox from "../chat/ChatBox";
import AdminCommandHandler from "../admin/AdminCommandHandler";
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
  const [activeAuthTab, setActiveAuthTab] = useState<AuthTabs>("login");
  const [isChatVisible, setIsChatVisible] = useState<boolean>(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState<boolean>(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState<boolean>(false);
  const [depositAmount, setDepositAmount] = useState<string>("1000");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("1000");
  const [discordId, setDiscordId] = useState<string>("");

  const closeSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleLogin = () => {
    setActiveAuthTab("login");
    setIsAuthModalOpen(true);
  };

  const handleRegister = () => {
    setActiveAuthTab("register");
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

    // Check if user has Discord ID linked
    let userDiscordId = discordService.getLinkedDiscordId(user.username);
    
    if (!userDiscordId && !discordId) {
      toast.error("Please enter your Discord user ID to link your account");
      return;
    }

    if (discordId && !userDiscordId) {
      // Link the Discord account
      const linked = await discordService.linkDiscordAccount(discordId, user.username);
      if (!linked) {
        toast.error("Failed to link Discord account");
        return;
      }
      userDiscordId = discordId;
    }

    // Check if user has enough credits on Discord
    const discordCredits = await discordService.checkUserCredits(userDiscordId || "");
    if (!discordCredits || discordCredits < amount) {
      toast.error("You don't have enough credits on Discord");
      return;
    }

    // Process the deposit
    const success = await discordService.depositCredits(userDiscordId!, amount);
    if (success) {
      // Update user balance
      updateBalance((user.balance || 0) + amount);
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

    // Check if user has Discord ID linked
    let userDiscordId = discordService.getLinkedDiscordId(user.username);
    
    if (!userDiscordId && !discordId) {
      toast.error("Please enter your Discord user ID to link your account");
      return;
    }

    if (discordId && !userDiscordId) {
      // Link the Discord account
      const linked = await discordService.linkDiscordAccount(discordId, user.username);
      if (!linked) {
        toast.error("Failed to link Discord account");
        return;
      }
      userDiscordId = discordId;
    }

    // Process the withdrawal
    const success = await discordService.withdrawCredits(userDiscordId!, amount);
    if (success) {
      // Update user balance
      updateBalance((user.balance || 0) - amount);
      toast.success(`Successfully withdrew ${amount} credits to Discord`);
      setIsWithdrawModalOpen(false);
    } else {
      toast.error("Failed to withdraw credits");
    }
  };

  const toggleChat = () => {
    setIsChatVisible(!isChatVisible);
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white">
      {/* Top navigation bar */}
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
                  variant="outline"
                  onClick={handleLogin}
                  data-auth-trigger="login"
                  className="border-zinc-700"
                >
                  Login
                </Button>
                <Button
                  size="sm"
                  onClick={handleRegister}
                  data-auth-trigger="register"
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Register
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
        {/* Sidebar */}
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
            {/* Main Navigation */}
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
                  to="/transactions"
                  label="Transactions"
                  isActive={pathname === "/transactions"}
                  onClick={closeSidebar}
                />
                <NavItem
                  to="/history"
                  label="History"
                  isActive={pathname === "/history"}
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
            
            {/* Case Section */}
            <div>
              <h3 className="px-4 text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-2">
                Ship Cases
              </h3>
              <ul>
                <NavItem
                  to="/cases"
                  label="Ship Cases"
                  isActive={pathname === "/cases"}
                  onClick={closeSidebar}
                />
              </ul>
            </div>

            {/* Games Section */}
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
                <NavItem
                  to="/games/roulette"
                  label="Roulette"
                  isActive={pathname === "/games/roulette"}
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

        {/* Chat panel */}
        {isChatVisible && (
          <div className="hidden lg:block w-72 border-l border-zinc-800">
            <ChatBox />
          </div>
        )}

        {/* Mobile chat overlay */}
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

        {/* Main content */}
        <main className={`flex-1 overflow-y-auto p-4 md:p-6 ${isChatVisible ? "lg:mr-72" : ""}`}>
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        activeTab={activeAuthTab}
        setActiveTab={setActiveAuthTab}
      />

      {/* Deposit Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Deposit Credits</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Transfer credits from Discord to SOLs Casino.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {!discordService.getLinkedDiscordId(user?.username || "") && (
              <div className="space-y-2">
                <Label htmlFor="discord-id">Discord User ID</Label>
                <Input
                  id="discord-id"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="Enter your Discord user ID"
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-sm text-zinc-400">
                  You need to link your Discord account once.
                </p>
              </div>
            )}
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

      {/* Withdraw Modal */}
      <Dialog open={isWithdrawModalOpen} onOpenChange={setIsWithdrawModalOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <DialogHeader>
            <DialogTitle>Withdraw Credits</DialogTitle>
            <DialogDescription className="text-zinc-400">
              Transfer credits from SOLs Casino to Discord.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {!discordService.getLinkedDiscordId(user?.username || "") && (
              <div className="space-y-2">
                <Label htmlFor="discord-id-withdraw">Discord User ID</Label>
                <Input
                  id="discord-id-withdraw"
                  value={discordId}
                  onChange={(e) => setDiscordId(e.target.value)}
                  placeholder="Enter your Discord user ID"
                  className="bg-zinc-800 border-zinc-700"
                />
                <p className="text-sm text-zinc-400">
                  You need to link your Discord account once.
                </p>
              </div>
            )}
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

      {/* Admin command handler */}
      <AdminCommandHandler />
    </div>
  );
};

export default MainLayout;
