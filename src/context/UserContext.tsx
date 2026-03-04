'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, demoUsers } from '@/lib/permissions';

interface User {
  name: string;
  initials: string;
  email: string;
  role: UserRole;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  switchUser: (email: string) => void;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('mco-advantage_user_email');
    if (savedEmail && demoUsers[savedEmail]) {
      setUser(demoUsers[savedEmail]);
    } else {
      // Default to admin user
      setUser(demoUsers['chris@dokit.ai']);
    }
    setIsLoading(false);
  }, []);

  // Switch user (for demo/testing purposes)
  const switchUser = (email: string) => {
    const newUser = demoUsers[email];
    if (newUser) {
      setUser(newUser);
      localStorage.setItem('mco-advantage_user_email', email);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, switchUser, isLoading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
