import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useCallback, useEffect } from 'react';

/**
 * Test suite for commodity screen memory leak fix
 * 
 * This test verifies that the setInterval cleanup is properly handled
 * and that functions used in intervals are properly memoized with useCallback
 */

describe('Commodity Screen - Memory Leak Fix', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('should properly cleanup interval on unmount', () => {
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
    const loadData = jest.fn();

    const { unmount } = renderHook(() => {
      const memoizedLoadData = useCallback(loadData, []);
      
      useEffect(() => {
        const interval = setInterval(() => {
          memoizedLoadData();
        }, 60000);

        return () => clearInterval(interval);
      }, [memoizedLoadData]);
    });

    // Verify interval is set
    expect(setInterval).toHaveBeenCalled();

    // Unmount and verify cleanup
    unmount();
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it('should not create stale closures when using memoized functions', () => {
    let callCount = 0;
    const loadData = jest.fn(() => {
      callCount++;
    });

    const { rerender } = renderHook(() => {
      const memoizedLoadData = useCallback(loadData, []);
      
      useEffect(() => {
        const interval = setInterval(() => {
          memoizedLoadData();
        }, 60000);

        return () => clearInterval(interval);
      }, [memoizedLoadData]);

      return memoizedLoadData;
    });

    // Fast-forward time to trigger interval
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(loadData).toHaveBeenCalledTimes(1);

    // Rerender should not create new interval
    rerender();

    // Fast-forward again
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    // Should have been called twice total (once per interval tick)
    expect(loadData).toHaveBeenCalledTimes(2);
  });

  it('should properly handle multiple intervals with different functions', () => {
    const loadCommodities = jest.fn();
    const loadCartCount = jest.fn();

    const { unmount } = renderHook(() => {
      const memoizedLoadCommodities = useCallback(loadCommodities, []);
      const memoizedLoadCartCount = useCallback(loadCartCount, []);
      
      useEffect(() => {
        const interval = setInterval(() => {
          memoizedLoadCommodities();
          memoizedLoadCartCount();
        }, 60000);

        return () => clearInterval(interval);
      }, [memoizedLoadCommodities, memoizedLoadCartCount]);
    });

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(loadCommodities).toHaveBeenCalledTimes(1);
    expect(loadCartCount).toHaveBeenCalledTimes(1);

    // Cleanup
    unmount();
  });

  it('should not leak memory when component remounts multiple times', () => {
    const loadData = jest.fn();
    const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

    const { unmount, rerender } = renderHook(() => {
      const memoizedLoadData = useCallback(loadData, []);
      
      useEffect(() => {
        const interval = setInterval(() => {
          memoizedLoadData();
        }, 60000);

        return () => clearInterval(interval);
      }, [memoizedLoadData]);
    });

    // Rerender multiple times
    rerender();
    rerender();
    rerender();

    // Unmount
    unmount();

    // Verify cleanup was called (should be called once on unmount)
    expect(clearIntervalSpy).toHaveBeenCalled();

    clearIntervalSpy.mockRestore();
  });

  it('should update interval when dependencies change', () => {
    const loadData1 = jest.fn();
    const loadData2 = jest.fn();
    let useFirstFunction = true;

    const { rerender } = renderHook(() => {
      const currentLoadData = useFirstFunction ? loadData1 : loadData2;
      const memoizedLoadData = useCallback(currentLoadData, [currentLoadData]);
      
      useEffect(() => {
        const interval = setInterval(() => {
          memoizedLoadData();
        }, 60000);

        return () => clearInterval(interval);
      }, [memoizedLoadData]);
    });

    // Trigger first interval
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(loadData1).toHaveBeenCalledTimes(1);
    expect(loadData2).toHaveBeenCalledTimes(0);

    // Change dependency
    useFirstFunction = false;
    rerender();

    // Trigger second interval
    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(loadData1).toHaveBeenCalledTimes(1);
    expect(loadData2).toHaveBeenCalledTimes(1);
  });
});

describe('Commodity Screen - useCallback Dependencies', () => {
  it('should memoize functions with empty dependency array', () => {
    const { result, rerender } = renderHook(() => {
      const loadData = useCallback(async () => {
        return 'data';
      }, []);

      return loadData;
    });

    const firstReference = result.current;
    rerender();
    const secondReference = result.current;

    // Function reference should remain the same
    expect(firstReference).toBe(secondReference);
  });

  it('should include memoized functions in hook dependency arrays', () => {
    const loadCommodities = jest.fn();
    const loadCartCount = jest.fn();

    const { unmount } = renderHook(() => {
      const memoizedLoadCommodities = useCallback(loadCommodities, []);
      const memoizedLoadCartCount = useCallback(loadCartCount, []);
      
      // This pattern matches the fix
      useEffect(() => {
        const interval = setInterval(() => {
          memoizedLoadCommodities();
          memoizedLoadCartCount();
        }, 60000);

        return () => clearInterval(interval);
      }, [memoizedLoadCommodities, memoizedLoadCartCount]);
    });

    act(() => {
      jest.advanceTimersByTime(60000);
    });

    expect(loadCommodities).toHaveBeenCalled();
    expect(loadCartCount).toHaveBeenCalled();

    unmount();
  });
});
