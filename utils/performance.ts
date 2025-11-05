
interface CacheItem {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class PerformanceOptimizerClass {
  private cache = new Map<string, CacheItem>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Cache management
  setCache(key: string, data: any, ttl: number = this.DEFAULT_TTL): void {
    try {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl
      });
    } catch (error) {
      console.warn('Failed to set cache:', error);
    }
  }

  getCache(key: string): any {
    try {
      const item = this.cache.get(key);
      if (!item) return null;

      const isExpired = Date.now() - item.timestamp > item.ttl;
      if (isExpired) {
        this.cache.delete(key);
        return null;
      }

      return item.data;
    } catch (error) {
      console.warn('Failed to get cache:', error);
      return null;
    }
  }

  clearCache(key?: string): void {
    try {
      if (key) {
        this.cache.delete(key);
      } else {
        this.cache.clear();
      }
    } catch (error) {
      console.warn('Failed to clear cache:', error);
    }
  }

  // Cleanup expired cache entries
  cleanupCache(): void {
    try {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now - item.timestamp > item.ttl) {
          this.cache.delete(key);
        }
      }
    } catch (error) {
      console.warn('Failed to cleanup cache:', error);
    }
  }

  // Memory management
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  // Preload critical data from AsyncStorage
  async preloadCriticalData(): Promise<{
    userToken: string | null;
    userRole: string | null;
    userEmail: string | null;
    tokenExpiry: string | null;
  }> {
    try {
      const cachedData = this.getCache('criticalUserData');
      if (cachedData) {
        return cachedData;
      }

      // Import AsyncStorage statically at the top of the file instead
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      
      const [userToken, userRole, userEmail, tokenExpiry] = await Promise.all([
        AsyncStorage.getItem('userToken'),
        AsyncStorage.getItem('userRole'),
        AsyncStorage.getItem('userEmail'),
        AsyncStorage.getItem('tokenExpiry')
      ]);

      const data = {
        userToken,
        userRole,
        userEmail,
        tokenExpiry
      };

      // Cache for 1 minute
      this.setCache('criticalUserData', data, 60 * 1000);
      
      return data;
    } catch (error) {
      console.error('Failed to preload critical data:', error);
      return {
        userToken: null,
        userRole: null,
        userEmail: null,
        tokenExpiry: null
      };
    }
  }

  // Batch API calls
  async batchApiCalls<T>(
    calls: Array<() => Promise<T>>
  ): Promise<Array<T | Error>> {
    try {
      const results = await Promise.allSettled(calls.map(call => call()));
      return results.map(result => 
        result.status === 'fulfilled' ? result.value : new Error('API call failed')
      );
    } catch (error) {
      console.error('Batch API calls failed:', error);
      return calls.map(() => new Error('Batch operation failed'));
    }
  }

  // Image loading optimization
  preloadImages(imageUrls: string[]): Promise<void[]> {
    return Promise.all(
      imageUrls.map(url => {
        return new Promise<void>((resolve, reject) => {
          if (typeof window !== 'undefined') {
            const img = new Image();
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
            img.src = url;
          } else {
            // For React Native, images are handled differently
            resolve();
          }
        });
      })
    );
  }

  // Component memoization helper
  createMemoizedComponent<P extends object>(
    Component: React.ComponentType<P>
  ): React.ComponentType<P> {
    return React.memo(Component, (prevProps, nextProps) => {
      return JSON.stringify(prevProps) === JSON.stringify(nextProps);
    });
  }

  // Performance monitoring
  measurePerformance<T>(
    operation: () => T,
    operationName: string
  ): T {
    const startTime = performance.now();
    try {
      const result = operation();
      const endTime = performance.now();
      console.log(`${operationName} took ${endTime - startTime} milliseconds`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`${operationName} failed after ${endTime - startTime} milliseconds:`, error);
      throw error;
    }
  }

  // Async performance monitoring
  async measureAsyncPerformance<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      console.log(`${operationName} took ${endTime - startTime} milliseconds`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      console.error(`${operationName} failed after ${endTime - startTime} milliseconds:`, error);
      throw error;
    }
  }

  // Initialize performance optimizer
  initialize(): void {
    try {
      // Cleanup cache every 10 minutes
      setInterval(() => {
        this.cleanupCache();
      }, 10 * 60 * 1000);

      console.log('PerformanceOptimizer initialized');
    } catch (error) {
      console.error('Failed to initialize PerformanceOptimizer:', error);
    }
  }
}

export const PerformanceOptimizer = new PerformanceOptimizerClass();

// Initialize on module load
PerformanceOptimizer.initialize();

// React import for memoization
import React from 'react';
