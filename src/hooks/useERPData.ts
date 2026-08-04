'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseERPDataOptions<T> {
  /** localStorage key for instant cache hydration */
  cacheKey?: string;
  /** Fetch function that returns data */
  fetcher: () => Promise<T>;
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean;
  /** Transform data before setting state */
  transform?: (raw: T) => T;
}

interface UseERPDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useERPData<T>({
  cacheKey,
  fetcher,
  autoFetch = true,
  transform,
}: UseERPDataOptions<T>): UseERPDataResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchingRef = useRef(false);

  // Hydrate from cache instantly
  useEffect(() => {
    if (cacheKey) {
      queueMicrotask(() => {
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const parsed = JSON.parse(cached);
            setData(transform ? transform(parsed) : parsed);
          }
        } catch {}
      });
    }
  }, [cacheKey, transform]);

  const refresh = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetcher();
      const transformed = transform ? transform(result) : result;
      setData(transformed);

      if (cacheKey) {
        try {
          localStorage.setItem(cacheKey, JSON.stringify(transformed));
        } catch {}
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(msg);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [fetcher, cacheKey, transform]);

  /* eslint-disable react-hooks/set-state-in-effect -- data-fetching pattern, setState is in async callback */
  useEffect(() => {
    if (autoFetch) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [autoFetch, refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return { data, loading, error, refresh };
}
