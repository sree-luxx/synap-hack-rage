import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: User['role']) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First, hydrate from localStorage for fast UI, then try to sync with server session (NextAuth)
    const savedUser = localStorage.getItem('hackverse_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser({
          ...parsedUser,
          createdAt: new Date(parsedUser.createdAt)
        });
      } catch (error) {
        localStorage.removeItem('hackverse_user');
      }
    }

    // Attempt to read user from server session cookies
    (async () => {
      await refreshSession();
      setIsLoading(false);
    })();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const resp = await apiFetch<{ token: string; user: { id: string; email: string; name?: string; role: string } }>(
        '/api/auth/login',
        { method: 'POST', body: { email, password } }
      );
      localStorage.setItem('hackhub_token', resp.token);
      const normalized: User = {
        id: resp.user.id,
        email: resp.user.email,
        name: resp.user.name || email.split('@')[0],
        role: (resp.user.role?.toLowerCase?.() as any) || 'participant',
        createdAt: new Date(),
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        socialLinks: {}
      };
      setUser(normalized);
      localStorage.setItem('hackverse_user', JSON.stringify(normalized));
    } finally {
      setIsLoading(false);
    }
  };

  const refreshSession = async (): Promise<boolean> => {
    try {
      const sessionUser = await apiFetch<{ id: string; email: string; name?: string; role?: string }>(
        '/api/users/me',
        { method: 'GET' }
      );
      if (sessionUser?.id) {
        const normalized: User = {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name || sessionUser.email.split('@')[0],
          role: (sessionUser.role?.toLowerCase?.() as any) || 'participant',
          createdAt: new Date(),
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionUser.email}`,
          socialLinks: {}
        };
        setUser(normalized);
        localStorage.setItem('hackverse_user', JSON.stringify(normalized));
        return true;
      }
    } catch (_e) {
      // Not logged in via session; ignore
    }
    return false;
  };

  const register = async (email: string, password: string, name: string, role: User['role']) => {
    setIsLoading(true);
    try {
      await apiFetch('/api/auth/register', { method: 'POST', body: { email, password, name, role: role.toUpperCase() } });
      await login(email, password);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem('hackverse_user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hackverse_user');
    localStorage.removeItem('hackhub_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading, updateProfile, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};