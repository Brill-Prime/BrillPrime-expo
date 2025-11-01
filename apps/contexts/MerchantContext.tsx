
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';

interface MerchantContextType {
  merchantId: string | null;
  setMerchantId: (id: string | null) => void;
  loadMerchantId: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [merchantId, setMerchantIdState] = useState<string | null>(null);

  const loadMerchantId = useCallback(async () => {
    try {
      // Try to get from stored user data
      const userData = await authService.getStoredUser();
      if (userData && userData.role === 'merchant') {
        setMerchantIdState(userData.id);
        return;
      }

      // Fallback to AsyncStorage
      const storedId = await AsyncStorage.getItem('merchantId');
      if (storedId) {
        setMerchantIdState(storedId);
      }
    } catch (error) {
      console.error('Error loading merchant ID:', error);
    }
  }, []);

  const setMerchantId = useCallback(async (id: string | null) => {
    setMerchantIdState(id);
    if (id) {
      await AsyncStorage.setItem('merchantId', id);
    } else {
      await AsyncStorage.removeItem('merchantId');
    }
  }, []);

  useEffect(() => {
    loadMerchantId();
  }, [loadMerchantId]);

  return (
    <MerchantContext.Provider value={{ merchantId, setMerchantId, loadMerchantId }}>
      {children}
    </MerchantContext.Provider>
  );
};

export const useMerchant = () => {
  const context = useContext(MerchantContext);
  if (!context) {
    throw new Error('useMerchant must be used within MerchantProvider');
  }
  return context;
};
