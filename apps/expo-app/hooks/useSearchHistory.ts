
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

export const useSearchHistory = () => {
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      const history = await AsyncStorage.getItem(SEARCH_HISTORY_KEY);
      if (history) {
        setSearchHistory(JSON.parse(history));
      }
    } catch (error) {
      console.error('Error loading search history:', error);
    }
  };

  const addToHistory = async (searchTerm: string) => {
    try {
      const trimmed = searchTerm.trim();
      if (!trimmed) return;

      let newHistory = [trimmed, ...searchHistory.filter(item => item !== trimmed)];
      newHistory = newHistory.slice(0, MAX_HISTORY_ITEMS);

      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error saving search history:', error);
    }
  };

  const clearHistory = async () => {
    try {
      setSearchHistory([]);
      await AsyncStorage.removeItem(SEARCH_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing search history:', error);
    }
  };

  const removeFromHistory = async (searchTerm: string) => {
    try {
      const newHistory = searchHistory.filter(item => item !== searchTerm);
      setSearchHistory(newHistory);
      await AsyncStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
    } catch (error) {
      console.error('Error removing from search history:', error);
    }
  };

  return {
    searchHistory,
    addToHistory,
    clearHistory,
    removeFromHistory,
  };
};
