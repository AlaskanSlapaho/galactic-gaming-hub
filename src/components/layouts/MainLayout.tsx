
import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AuthModal } from "@/components/auth/AuthModal";
import { useAuth } from "@/hooks/useAuth";
import { Menu, X, LogOut, Settings, ChevronDown } from "lucide-react";
import ChatBox from "@/components/chat/ChatBox";
import { AdminCommandHandler } from "@/components/admin/AdminCommandHandler";

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user, logout, isAuthenticated } = useAuth();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authView, setAuthView] = useState<"login" | "register">("login");

  const games = [
    { name: "Mines", path: "/games/mines" },
    { name: "Dice", path: "/games/dice" },
    { name: "Tower", path: "/games/tower" },
    { name: "Blackjack", path: "/games/blackjack" },
    { name: "HiLo", path: "/games/hilo" },
  ];

  const handleLogin = () => {
    setAuthView("login");
    setAuthModalOpen(true);
  };

  const handleRegister = () => {
    setAuthView("register");
    setAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
    setIsNavOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-900">
        <div className="container flex h-16 items-center px-4 sm:px-6">
          <div className="mr-4 flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                GalacticLedgers
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-6 mx-6">
              <div className="relative group">
                <button className="flex items-center space-x-1 text-zinc-400 hover:text-white">
                  <span>Games</span>
                  <ChevronDown size={16} />
                </button>
                <div className="absolute left-0 top-full w-48 pt-2 hidden group-hover:block">
                  <div className="bg-zinc-800 rounded-md shadow-lg border border-zinc-700">
                    {games.map((game) => (
                      <Link
                        key={game.path}
                        to={game.path}
                        className={`block px-4 py-2 hover:bg-zinc-700 ${
                          location.pathname === game.path ? "text-purple-500" : "text-zinc-300"
                        }`}
                        onClick={() => setIsNavOpen(false)}
                      >
                        {game.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
              <Link
                to="/leaderboard"
                className={`text-sm font-medium ${
                  location.pathname === "/leaderboard" 
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Leaderboard
              </Link>
              <Link
                to="/history"
                className={`text-sm font-medium ${
                  location.pathname === "/history" 
                    ? "text-white"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                History
              </Link>
              <Link
                to="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.open("https://discord.com/invite/efWx9PhE95", "_blank");
                }}
                className="text-sm font-medium text-zinc-400 hover:text-white"
              >
                Deposit/Withdraw
              </Link>
            </nav>
          )}

          <div className="flex-1 flex justify-end">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <div className="hidden md:block">
                  <div className="bg-zinc-800 px-3 py-1 rounded-md font-medium">
                    {user?.balance?.toLocaleString()} Credits
                  </div>
                </div>
                <div className="relative">
                  <div className="flex items-center space-x-2 cursor-pointer group">
                    <Avatar className="h-8 w-8 bg-zinc-700">
                      <span className="text-sm font-medium">
                        {user?.username.charAt(0).toUpperCase()}
                      </span>
                    </Avatar>
                    <span className="hidden md:inline-block">{user?.username}</span>
                    <ChevronDown size={16} className="text-zinc-400 group-hover:text-white" />
                  </div>
                  <div className="absolute right-0 top-full w-48 pt-2 hidden group-hover:block">
                    <div className="bg-zinc-800 rounded-md shadow-lg border border-zinc-700">
                      {user?.isAdmin && (
                        <Link 
                          to="/admin" 
                          className="flex items-center space-x-2 px-4 py-2 hover:bg-zinc-700 text-zinc-300"
                        >
                          <Settings size={16} />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      <button 
                        onClick={handleLogout}
                        className="flex items-center space-x-2 px-4 py-2 w-full text-left hover:bg-zinc-700 text-zinc-300"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  onClick={handleLogin}
                  className="border-zinc-700 hover:bg-zinc-800 hover:text-white"
                >
                  Login
                </Button>
                <Button 
                  onClick={handleRegister}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Register Now
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            {isMobile && (
              <Sheet open={isNavOpen} onOpenChange={setIsNavOpen}>
                <SheetTrigger asChild className="ml-2 md:hidden">
                  <Button size="icon" variant="ghost">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="bg-zinc-900 border-zinc-800">
                  <div className="flex items-center justify-between">
                    <Link to="/" onClick={() => setIsNavOpen(false)} className="flex items-center">
                      <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-blue-500">
                        GalacticLedgers
                      </span>
                    </Link>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setIsNavOpen(false)}
                    >
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  <Separator className="my-4 bg-zinc-800" />
                  <div className="flex flex-col space-y-4 mt-4">
                    {isAuthenticated && (
                      <div className="flex items-center space-x-4 mb-4">
                        <Avatar className="h-8 w-8 bg-zinc-700">
                          <span className="text-sm font-medium">
                            {user?.username.charAt(0).toUpperCase()}
                          </span>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user?.username}</p>
                          <p className="text-sm text-zinc-400">{user?.balance?.toLocaleString()} Credits</p>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-zinc-400 mb-1">Games</p>
                      {games.map((game) => (
                        <Link
                          key={game.path}
                          to={game.path}
                          className={`py-2 ${
                            location.pathname === game.path ? "text-purple-500" : "text-zinc-300"
                          }`}
                          onClick={() => setIsNavOpen(false)}
                        >
                          {game.name}
                        </Link>
                      ))}
                    </div>
                    <Separator className="my-2 bg-zinc-800" />
                    <Link
                      to="/leaderboard"
                      className="py-2 text-zinc-300"
                      onClick={() => setIsNavOpen(false)}
                    >
                      Leaderboard
                    </Link>
                    <Link
                      to="/history"
                      className="py-2 text-zinc-300"
                      onClick={() => setIsNavOpen(false)}
                    >
                      History
                    </Link>
                    <Link
                      to="#"
                      onClick={(e) => {
                        e.preventDefault();
                        window.open("https://discord.com/invite/efWx9PhE95", "_blank");
                        setIsNavOpen(false);
                      }}
                      className="py-2 text-zinc-300"
                    >
                      Deposit/Withdraw
                    </Link>
                    {isAuthenticated ? (
                      <>
                        {user?.isAdmin && (
                          <Link 
                            to="/admin" 
                            className="py-2 text-zinc-300"
                            onClick={() => setIsNavOpen(false)}
                          >
                            Admin Panel
                          </Link>
                        )}
                        <button 
                          onClick={handleLogout}
                          className="py-2 text-left text-zinc-300"
                        >
                          Logout
                        </button>
                      </>
                    ) : (
                      <div className="flex flex-col space-y-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsNavOpen(false);
                            handleLogin();
                          }}
                          className="border-zinc-700 hover:bg-zinc-800 hover:text-white w-full"
                        >
                          Login
                        </Button>
                        <Button 
                          onClick={() => {
                            setIsNavOpen(false);
                            handleRegister();
                          }}
                          className="bg-purple-600 hover:bg-purple-700 w-full"
                        >
                          Register Now
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </header>

      {/* Main content with chat */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto py-6">
          <div className="container px-4">
            {children}
          </div>
        </main>
        
        {/* Chat section */}
        <div className="hidden md:block w-80 border-l border-zinc-800 overflow-hidden">
          <div className="h-full flex flex-col">
            <ChatBox />
          </div>
        </div>
      </div>

      {/* Admin command handler */}
      <AdminCommandHandler />
      
      {/* Auth Modal */}
      <AuthModal 
        open={authModalOpen} 
        onOpenChange={setAuthModalOpen}
        view={authView}
        onSwitchView={setAuthView}
      />
    </div>
  );
}
