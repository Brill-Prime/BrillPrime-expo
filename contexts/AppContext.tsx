import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';
import { cartService } from '../services/cartService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface AppState {
  user: User | null;
  cartCount: number;
  isOnline: boolean;
  searchHistory: string[];
  recentlyViewed: any[];
}

interface AppContextType extends AppState {
  setUser: (user: User | null) => void;
  updateCartCount: () => Promise<void>;
  setIsOnline: (online: boolean) => void;
  addToSearchHistory: (query: string) => void;
  clearSearchHistory: () => void;
  addToRecentlyViewed: (item: any) => void;
  refreshUserData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    user: null,
    cartCount: 0,
    isOnline: true,
    searchHistory: [],
    recentlyViewed: [],
  });

  // Load persisted data on mount
  useEffect(() => {
    loadPersistedData();
  }, []);

  const loadPersistedData = async () => {
    try {
      const [userData, searchHistory, recentlyViewed] = await Promise.all([
        authService.getStoredUser(),
        AsyncStorage.getItem('searchHistory'),
        AsyncStorage.getItem('recentlyViewed'),
      ]);

      setState(prev => ({
        ...prev,
        user: userData,
        searchHistory: searchHistory ? JSON.parse(searchHistory) : [],
        recentlyViewed: recentlyViewed ? JSON.parse(recentlyViewed) : [],
      }));

      if (userData) {
        await updateCartCount();
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const setUser = useCallback((user: User | null) => {
    setState(prev => ({ ...prev, user }));
  }, []);

  const updateCartCount = useCallback(async () => {
    try {
      const count = await cartService.getCartItemCount();
      setState(prev => ({ ...prev, cartCount: count }));
    } catch (error) {
      console.error('Error updating cart count:', error);
    }
  }, []);

  const setIsOnline = useCallback((isOnline: boolean) => {
    setState(prev => ({ ...prev, isOnline }));
  }, []);

  const addToSearchHistory = useCallback(async (query: string) => {
    if (!query.trim()) return;

    setState(prev => {
      const updated = [query, ...prev.searchHistory.filter(q => q !== query)].slice(0, 10);
      AsyncStorage.setItem('searchHistory', JSON.stringify(updated));
      return { ...prev, searchHistory: updated };
    });
  }, []);

  const clearSearchHistory = useCallback(async () => {
    await AsyncStorage.removeItem('searchHistory');
    setState(prev => ({ ...prev, searchHistory: [] }));
  }, []);

  const addToRecentlyViewed = useCallback(async (item: any) => {
    setState(prev => {
      const updated = [item, ...prev.recentlyViewed.filter(i => i.id !== item.id)].slice(0, 20);
      AsyncStorage.setItem('recentlyViewed', JSON.stringify(updated));
      return { ...prev, recentlyViewed: updated };
    });
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data as User);
      }
    } catch (error) {
      console.error('Error refreshing user data:', error);
    }
  }, [setUser]);

  return (
    <AppContext.Provider
      value={{
        ...state,
        setUser,
        updateCartCount,
        setIsOnline,
        addToSearchHistory,
        clearSearchHistory,
        addToRecentlyViewed,
        refreshUserData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return context;
};

export { AppProvider, useAppContext };
export default AppProvider;