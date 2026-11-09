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
      const storedId = await AsyncStorage.getItem('merchantId');
      if (storedId) {
        setMerchantIdState(storedId);
        return;
      }

      const userData = await authService.getStoredUser();
      if (!userData) {
        setMerchantIdState(null);
        return;
      }

      const normalizedMerchantId =
        userData.merchantId ||
        (userData.role === 'merchant' ? await authService.resolveMerchantIdFromSupabase(userData.firebaseUid || userData.uid || userData.id) : null);

      if (normalizedMerchantId) {
        setMerchantIdState(normalizedMerchantId);
        await AsyncStorage.setItem('merchantId', normalizedMerchantId);
        return;
      }

      setMerchantIdState(null);
    } catch (error) {
      console.error('Error loading merchant ID:', error);
      setMerchantIdState(null);
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
