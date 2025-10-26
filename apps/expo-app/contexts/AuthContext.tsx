
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  merchantId?: string;
  driverId?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  role: string | null;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const loadUserData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [storedToken, storedRole, userData] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userRole'),
        authService.getStoredUser()
      ]);

      if (storedToken && storedRole) {
        setToken(storedToken);
        setRole(storedRole);
        setIsAuthenticated(true);
        
        if (userData) {
          setUser(userData as User);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setRole(null);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      setRole(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data as User);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authService.signOut();
      setUser(null);
      setToken(null);
      setRole(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        token,
        role,
        setUser,
        signOut,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
