'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type User = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
} | null;

type AuthContextType = {
  user: User;
  setUser: (user: User) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    // Check if user is logged in on mount
    const token = localStorage.getItem('token');
    if (token) {
      // Fetch user data
      fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.user) {
            console.log('Setting user from token:', data.user);
            setUser(data.user);
          }
        })
        .catch((error) => {
          console.error('Error fetching user:', error);
          localStorage.removeItem('token');
        });
    }
  }, []);

  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    setUser(null);
  };

  console.log('Current user state:', user);

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 