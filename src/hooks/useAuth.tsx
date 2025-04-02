
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  balance: number;
  isAdmin: boolean;
}

interface AuthContextProps {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => void;
  updateBalance: (newBalance: number) => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextProps>({
  user: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateBalance: () => {},
  isAuthenticated: false,
  isAdmin: false,
});

const USER_STORAGE_KEY = "galactic_ledgers_user";
const REGISTERED_USERS_KEY = "galactic_ledgers_users";

// Mock admin credentials - in a real app this would be server-side
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "admin123";

const DEFAULT_ADMIN_USER = {
  id: "admin-id",
  username: ADMIN_USERNAME,
  balance: 1000000,
  isAdmin: true,
};

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<Record<string, {password: string, user: User}>>({});

  useEffect(() => {
    // Load user from localStorage
    const storedUser = localStorage.getItem(USER_STORAGE_KEY);
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Load registered users from localStorage
    const storedUsers = localStorage.getItem(REGISTERED_USERS_KEY);
    if (storedUsers) {
      setRegisteredUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with admin account if no users exist
      const initialUsers = {
        [ADMIN_USERNAME]: {
          password: ADMIN_PASSWORD,
          user: DEFAULT_ADMIN_USER,
        }
      };
      setRegisteredUsers(initialUsers);
      localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(initialUsers));
    }
  }, []);

  const saveUsers = (users: Record<string, {password: string, user: User}>) => {
    setRegisteredUsers(users);
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(users));
  };

  const login = async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const userRecord = registeredUsers[username];
        
        if (userRecord && userRecord.password === password) {
          setUser(userRecord.user);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userRecord.user));
          resolve();
        } else {
          reject(new Error("Invalid credentials"));
        }
      }, 500); // Simulate network delay
    });
  };

  const register = async (username: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (registeredUsers[username]) {
          reject(new Error("Username already taken"));
          return;
        }

        const newUser: User = {
          id: `user-${Date.now()}`,
          username,
          balance: 10000, // Starting balance
          isAdmin: false,
        };

        const updatedUsers = {
          ...registeredUsers,
          [username]: {
            password,
            user: newUser,
          },
        };

        saveUsers(updatedUsers);
        setUser(newUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
        
        resolve();
      }, 500); // Simulate network delay
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_STORAGE_KEY);
  };

  const updateBalance = (newBalance: number) => {
    if (!user) return;
    
    const updatedUser = { ...user, balance: newBalance };
    setUser(updatedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));

    // Also update in the registered users
    if (registeredUsers[user.username]) {
      const updatedUsers = {
        ...registeredUsers,
        [user.username]: {
          ...registeredUsers[user.username],
          user: updatedUser,
        },
      };
      saveUsers(updatedUsers);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        updateBalance,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
