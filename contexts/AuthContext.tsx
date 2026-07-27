
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
  phone?: string;
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
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedRole = await AsyncStorage.getItem('userRole');
      let userData = null;
      try {
        userData = await authService.getStoredUser();
      } catch (error) {
        console.warn('Failed to get stored user data:', error);
      }

      if (storedToken) {
        setToken(storedToken);

        // Only set as authenticated if we have both token and role
        if (storedRole) {
          setRole(storedRole);
          setIsAuthenticated(true);

          if (userData) {
            setUser(userData as User);
          }
        } else {
          // If we have a token but no role, force role selection
          setIsAuthenticated(false);
          setUser(null);
          setRole(null);
          // This will trigger the auth flow to show role selection
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
      const { userService } = await import('../services/userService');
      const response = await userService.getProfile();
      if (response.success && response.data) {
        const userData = response.data as User;
        setUser(userData);

        // Update AsyncStorage
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('userEmail', userData.email);
        if (userData.firstName) {
          await AsyncStorage.setItem('userFirstName', userData.firstName);
        }
        if (userData.lastName) {
          await AsyncStorage.setItem('userLastName', userData.lastName);
        }
        if (userData.phone) {
          await AsyncStorage.setItem('userPhone', userData.phone);
        }
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

  // Register for push notifications once the user is authenticated
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const registerPush = async () => {
      try {
        // Resolve the Supabase internal UUID (users.id) from the Firebase UID
        const { supabase } = await import('../config/supabase');
        const { data } = await supabase
          .from('users')
          .select('id')
          .eq('firebase_uid', user.id)
          .single();

        if (data?.id) {
          const { notificationService } = await import('../services/notificationService');
          await notificationService.registerForPushNotificationsAsync(data.id);
        }
      } catch (err) {
        // Non-fatal — push registration failure must never break the app
        console.warn('[AuthContext] Push token registration failed:', err);
      }
    };

    registerPush();
  }, [isAuthenticated, user?.id]);

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
