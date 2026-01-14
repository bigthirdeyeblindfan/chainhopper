'use client';

/**
 * useApi Hook - Generic API data fetching hook
 *
 * Provides loading, error, and data states for API calls.
 */

import { useState, useEffect, useCallback } from 'react';
import type { ApiResponse } from '@/lib/api';

export interface UseApiOptions<T> {
  /** Initial data value */
  initialData?: T;
  /** Whether to fetch immediately on mount */
  immediate?: boolean;
  /** Dependencies that trigger refetch */
  deps?: unknown[];
  /** Callback on success */
  onSuccess?: (data: T) => void;
  /** Callback on error */
  onError?: (error: { code: string; message: string }) => void;
}

export interface UseApiResult<T> {
  data: T | undefined;
  error: { code: string; message: string } | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => Promise<void>;
  mutate: (data: T | undefined) => void;
}

export function useApi<T>(
  fetcher: () => Promise<ApiResponse<T>>,
  options: UseApiOptions<T> = {}
): UseApiResult<T> {
  const {
    initialData,
    immediate = true,
    deps = [],
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [isLoading, setIsLoading] = useState(immediate);

  const fetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetcher();

      if (response.success && response.data !== undefined) {
        setData(response.data);
        onSuccess?.(response.data);
      } else if (response.error) {
        setError(response.error);
        onError?.(response.error);
      }
    } catch (err) {
      const error = {
        code: 'FETCH_ERROR',
        message: err instanceof Error ? err.message : 'An error occurred',
      };
      setError(error);
      onError?.(error);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      fetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, ...deps]);

  const mutate = useCallback((newData: T | undefined) => {
    setData(newData);
  }, []);

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    refetch: fetch,
    mutate,
  };
}

export default useApi;
