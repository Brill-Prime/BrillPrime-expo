
import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppContext } from '../contexts/AppContext';

export const useOfflineMode = () => {
  const { setIsOnline } = useAppContext();
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const online = state.isConnected ?? false;
      setIsOnline(online);

      if (online) {
        processOfflineQueue();
      }
    });

    loadOfflineQueue();

    return () => unsubscribe();
  }, [setIsOnline]);

  const loadOfflineQueue = async () => {
    try {
      const queue = await AsyncStorage.getItem('offlineQueue');
      if (queue) {
        setOfflineQueue(JSON.parse(queue));
      }
    } catch (error) {
      console.error('Error loading offline queue:', error);
    }
  };

  const addToOfflineQueue = async (action: any) => {
    const updated = [...offlineQueue, { ...action, timestamp: Date.now() }];
    setOfflineQueue(updated);
    await AsyncStorage.setItem('offlineQueue', JSON.stringify(updated));
  };

  const processOfflineQueue = async () => {
    if (offlineQueue.length === 0) return;

    const processed: any[] = [];
    
    for (const action of offlineQueue) {
      try {
        // Process based on action type
        // This would call appropriate service methods
        processed.push(action);
      } catch (error) {
        console.error('Error processing offline action:', error);
      }
    }

    const remaining = offlineQueue.filter(a => !processed.includes(a));
    setOfflineQueue(remaining);
    await AsyncStorage.setItem('offlineQueue', JSON.stringify(remaining));
  };

  return { addToOfflineQueue };
};
