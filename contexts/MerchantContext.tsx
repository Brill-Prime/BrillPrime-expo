import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../services/authService';
import { useAuth } from './AuthContext';

interface MerchantContextType {
  merchantId: string | null;
  isLoading: boolean;
  setMerchantId: (id: string | null) => Promise<void>;
  loadMerchantId: () => Promise<void>;
}

const MerchantContext = createContext<MerchantContextType | undefined>(undefined);

export const MerchantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [merchantId, setMerchantIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firebaseUid = user?.firebaseUid || user?.uid || user?.id;

  const loadMerchantId = useCallback(async () => {
    if (authLoading) {
      return;
    }

    setIsLoading(true);
    try {
      if (!isAuthenticated || user?.role !== 'merchant' || !firebaseUid) {
        setMerchantIdState(null);
        await AsyncStorage.multiRemove(['merchantId', 'merchantIdUserUid']);
        return;
      }

      const [[, storedId], [, storedUserUid]] = await AsyncStorage.multiGet([
        'merchantId',
        'merchantIdUserUid',
      ]);

      const normalizedMerchantId =
        user.merchantId ||
        (storedUserUid === firebaseUid ? storedId : null) ||
        await authService.resolveMerchantIdFromSupabase(firebaseUid);

      if (normalizedMerchantId) {
        setMerchantIdState(normalizedMerchantId);
        await AsyncStorage.multiSet([
          ['merchantId', normalizedMerchantId],
          ['merchantIdUserUid', firebaseUid],
        ]);
        return;
      }

      setMerchantIdState(null);
      await AsyncStorage.multiRemove(['merchantId', 'merchantIdUserUid']);
    } catch (error) {
      console.error('Error loading merchant ID:', error);
      setMerchantIdState(null);
    } finally {
      setIsLoading(false);
    }
  }, [authLoading, firebaseUid, isAuthenticated, user?.merchantId, user?.role]);

  const setMerchantId = useCallback(async (id: string | null) => {
    setMerchantIdState(id);
    if (id && firebaseUid) {
      await AsyncStorage.multiSet([
        ['merchantId', id],
        ['merchantIdUserUid', firebaseUid],
      ]);
    } else {
      await AsyncStorage.multiRemove(['merchantId', 'merchantIdUserUid']);
    }
  }, [firebaseUid]);

  useEffect(() => {
    void loadMerchantId();
  }, [loadMerchantId]);

  return (
    <MerchantContext.Provider value={{ merchantId, isLoading, setMerchantId, loadMerchantId }}>
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
