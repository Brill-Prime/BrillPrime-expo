
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache for storing frequently accessed data
const memoryCache = new Map();

export class PerformanceOptimizer {
  // Debounce function calls to prevent excessive executions
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Throttle function calls
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Batch AsyncStorage operations
  static async batchAsyncStorage(operations: Array<{
    type: 'get' | 'set' | 'remove';
    key: string;
    value?: string;
  }>) {
    const getOps = operations.filter(op => op.type === 'get').map(op => op.key);
    const setOps = operations.filter(op => op.type === 'set').map(op => [op.key, op.value!]);
    const removeOps = operations.filter(op => op.type === 'remove').map(op => op.key);

    const results = await Promise.all([
      getOps.length > 0 ? AsyncStorage.multiGet(getOps) : Promise.resolve([]),
      setOps.length > 0 ? AsyncStorage.multiSet(setOps as [string, string][]) : Promise.resolve(),
      removeOps.length > 0 ? AsyncStorage.multiRemove(removeOps) : Promise.resolve()
    ]);

    return results[0]; // Return get results
  }

  // Memory cache with TTL
  static setCache(key: string, value: any, ttlMs: number = 300000) { // 5 min default
    const expiry = Date.now() + ttlMs;
    memoryCache.set(key, { value, expiry });
  }

  static getCache(key: string) {
    const cached = memoryCache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      memoryCache.delete(key);
      return null;
    }
    
    return cached.value;
  }

  // Preload critical data
  static async preloadCriticalData() {
    try {
      const criticalKeys = [
        'userToken', 'userEmail', 'userRole', 
        'tokenExpiry', 'hasSeenOnboarding'
      ];
      
      const data = await AsyncStorage.multiGet(criticalKeys);
      
      // Cache in memory for instant access
      data.forEach(([key, value]) => {
        if (value) {
          this.setCache(key, value, 600000); // 10 minute cache
        }
      });
      
      return Object.fromEntries(data);
    } catch (error) {
      console.error('Error preloading critical data:', error);
      return {};
    }
  }

  // Image lazy loading helper
  static createImagePreloader(sources: string[]) {
    return Promise.all(
      sources.map(src => 
        new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = src;
        })
      )
    );
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = React.useState({
    renderCount: 0,
    lastRenderTime: Date.now()
  });

  React.useEffect(() => {
    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: Date.now()
    }));
  });

  return metrics;
};
