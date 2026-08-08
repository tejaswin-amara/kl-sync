import { useState, useEffect, useCallback } from 'react';

export function useNativeQuery<T>(key: string | null | readonly (string | null)[], fetcher: (key: unknown) => Promise<T>) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const url = Array.isArray(key) ? key[0] : key;
  const shouldFetch = key !== null && url !== null && (Array.isArray(key) ? key.every(Boolean) : true);
  
  // stringify key for dependency array
  const keyStr = JSON.stringify(key);

  const mutate = useCallback(async () => {
    if (!shouldFetch || !url) return;
    setIsLoading(true);
    try {
      const result = await fetcher(key);
      setData(result);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyStr, shouldFetch, url, fetcher]);

  useEffect(() => {
    let mounted = true;
    if (mounted && shouldFetch) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      void mutate();
    }
    return () => {
      mounted = false;
    };
  }, [mutate, shouldFetch]);

  return { data, error, isLoading, mutate };
}
