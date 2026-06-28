
import { useState, useCallback } from 'react';

interface UsePaginationOptions<T> {
  initialData?: T[];
  pageSize?: number;
  fetchFunction: (offset: number, limit: number) => Promise<T[]>;
}

export const usePagination = <T,>({
  initialData = [],
  pageSize = 20,
  fetchFunction,
}: UsePaginationOptions<T>) => {
  const [data, setData] = useState<T[]>(initialData);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const newData = await fetchFunction(page * pageSize, pageSize);
      
      if (newData.length < pageSize) {
        setHasMore(false);
      }

      setData(prev => [...prev, ...newData]);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more data:', error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, hasMore, fetchFunction]);

  const refresh = useCallback(async () => {
    setPage(0);
    setHasMore(true);
    setLoading(true);
    
    try {
      const newData = await fetchFunction(0, pageSize);
      setData(newData);
      
      if (newData.length < pageSize) {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setLoading(false);
    }
  }, [pageSize, fetchFunction]);

  return {
    data,
    loading,
    hasMore,
    loadMore,
    refresh,
  };
};
