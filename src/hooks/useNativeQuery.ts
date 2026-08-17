import { useState, useEffect, useCallback, useRef } from 'react';

const inFlightDedupeMap = new Map<string, Promise<unknown>>();

function fetchWithDedupe<T>(keyStr: string, fetcherFn: () => Promise<T>): Promise<T> {
  const existing = inFlightDedupeMap.get(keyStr);
  if (existing) return existing as Promise<T>;

  const promise = fetcherFn().finally(() => {
    inFlightDedupeMap.delete(keyStr);
  });
  inFlightDedupeMap.set(keyStr, promise);
  return promise;
}

export function useNativeQuery<T>(
  key: string | null | readonly (string | null)[],
  fetcher: (key: unknown) => Promise<T>
) {
  const [data, setData] = useState<T | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const url = Array.isArray(key) ? key[0] : key;
  const shouldFetch =
    key !== null && url !== null && (Array.isArray(key) ? key.every(Boolean) : true);

  const keyStr = JSON.stringify(key);
  const mountedRef = useRef(true);
  const keyRef = useRef(key);

  useEffect(() => {
    keyRef.current = key;
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mutate = useCallback(async () => {
    if (!shouldFetch || !url) return;
    if (mountedRef.current) setIsLoading(true);

    try {
      const result = await fetchWithDedupe(keyStr, () => fetcher(keyRef.current));
      if (mountedRef.current) {
        setData(result);
        setError(null);
      }
    } catch (err: unknown) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [keyStr, shouldFetch, url, fetcher]);

  useEffect(() => {
    if (shouldFetch) {
      void mutate();
    }
  }, [mutate, shouldFetch]);

  return { data, error, isLoading, mutate };
}
