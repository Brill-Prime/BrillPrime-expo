
// Performance Hook
// Monitors app performance and provides optimization utilities

import { useEffect, useRef } from 'react';
import { errorService } from '../services/errorService';

export const usePerformance = (componentName: string) => {
  const mountTime = useRef<number>(Date.now());
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderCount.current += 1;
    
    // Log slow renders
    const renderTime = Date.now() - mountTime.current;
    if (renderTime > 100) {
      errorService.logError(
        new Error(`Slow render detected in ${componentName}`),
        { renderTime, renderCount: renderCount.current },
        'medium'
      );
    }
  });

  useEffect(() => {
    return () => {
      const totalTime = Date.now() - mountTime.current;
      if (totalTime > 5000) {
        errorService.logError(
          new Error(`Long-lived component: ${componentName}`),
          { totalTime, renderCount: renderCount.current },
          'low'
        );
      }
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    measureTime: (operation: string, fn: () => void) => {
      const start = Date.now();
      fn();
      const duration = Date.now() - start;
      
      if (duration > 50) {
        console.warn(`Slow operation in ${componentName}: ${operation} took ${duration}ms`);
      }
    }
  };
};
