
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';
<<<<<<< HEAD
import { isLikelySupabaseAccessToken } from '../utils/authFlow';
=======
import { supabase } from '../config/supabase';
>>>>>>> 47a2137b6643748e86a12f8210e7c3009998f06d

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
<<<<<<< HEAD
      const entries = await AsyncStorage.multiGet(['userToken', 'userRole', 'tokenExpiry']);
      const storedToken = entries[0]?.[1] ?? null;
      const storedRoleFromSession = entries[1]?.[1] ?? null;
      const storedExpiry = entries[2]?.[1] ?? null;
      const storedRole = storedRoleFromSession ?? (await AsyncStorage.getItem('selectedRole')) ?? null;
      let userData = null;
      try {
        userData = await authService.getStoredUser();
      } catch (error) {
        console.warn('Failed to get stored user data:', error);
      }

      const expiryTime = storedExpiry ? Number(storedExpiry) : Number.NaN;
      const hasValidExpiry = Number.isFinite(expiryTime) && expiryTime > Date.now();
      const isSupportedRole = storedRole === 'consumer' || storedRole === 'merchant' || storedRole === 'driver';
      const hasValidSupabaseToken = !!storedToken && isLikelySupabaseAccessToken(storedToken) && hasValidExpiry;

      // Match startup routing: a token without a valid Supabase JWT or supported role
      // must not be treated as an authenticated session.
      if (hasValidSupabaseToken && isSupportedRole) {
        setToken(storedToken);
        setRole(storedRole);
=======
      const result = await authService.restoreSession();
      if (result?.success && result.data) {
        setToken(result.data.token);
        setRole(result.data.user.role);
>>>>>>> 47a2137b6643748e86a12f8210e7c3009998f06d
        setIsAuthenticated(true);
        setUser(result.data.user as User);
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        setRole(null);
        await AsyncStorage.multiRemove(['userToken', 'tokenExpiry']);
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
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        await AsyncStorage.setItem('userEmail', userData.email);
        if (userData.firstName) await AsyncStorage.setItem('userFirstName', userData.firstName);
        if (userData.lastName) await AsyncStorage.setItem('userLastName', userData.lastName);
        if (userData.phone) await AsyncStorage.setItem('userPhone', userData.phone);
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
    if (!isAuthenticated || !user?.id) return;

    const registerPush = async () => {
      try {
        const { supabase } = await import('../config/supabase');
        const { data } = await supabase.from('users').select('id').eq('firebase_uid', user.id).single();
        if (data?.id) {
          const { notificationService } = await import('../services/notificationService');
          await notificationService.registerForPushNotificationsAsync(data.id);
        }
      } catch (err) {
        console.warn('[AuthContext] Push token registration failed:', err);
      }
    };

    registerPush();
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    let isMounted = true;
    let authRefreshTimer: ReturnType<typeof setTimeout> | null = null;

    const syncAuthState = async () => {
      await loadUserData();
    };

    void syncAuthState();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setToken(null);
        setRole(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      // Defer Supabase calls until after its auth callback releases its lock.
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        setIsLoading(true);
        if (authRefreshTimer) clearTimeout(authRefreshTimer);
        authRefreshTimer = setTimeout(() => {
          if (isMounted) void loadUserData();
        }, 0);
      }
    });

    return () => {
      isMounted = false;
      if (authRefreshTimer) clearTimeout(authRefreshTimer);
      authListener.subscription.unsubscribe();
    };
  }, [loadUserData]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, token, role, setUser, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
