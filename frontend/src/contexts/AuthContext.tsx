'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/auth';
import { apiService } from '@/services/api';

// AuthContext provides authentication state and methods throughout the React application
// It manages:
// - User authentication state (logged in user data)
// - Loading states during auth operations
// - Authentication status
// - Login/logout/register functionality
// - Automatic auth checking on app load

interface AuthContextType {
  user: User | null;
  isLoading: boolean; 
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, email: string, password: string, confirmPassword: string) => Promise<void>;
}

// Create the context with undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

// AuthProvider component that wraps the app and provides auth context
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Check authentication status when app loads
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { user } = await apiService.getCurrentUser();
        setUser(user);
      } catch (error) {
        // User is not authenticated
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Handle user login
  const login = async (email: string, password: string) => {
    try {
      const response = await apiService.login({ email, password });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  // Handle user logout
  const logout = async () => {
    try {
      await apiService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout fails, clear local state
      setUser(null);
    }
  };

  // Handle user registration
  const register = async (username: string, email: string, password: string, confirmPassword: string) => {
    try {
      const response = await apiService.register({ username, email, password, confirmPassword });
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  // Context value containing all auth state and methods
  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 