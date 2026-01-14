'use client';

/**
 * Trading Hooks
 *
 * React hooks for trading operations.
 */

import { useState, useCallback } from 'react';
import { useApi, type UseApiOptions } from './useApi';
import { trading } from '@/lib/api';
import type { Quote, SwapRequest, SwapResponse, Trade } from '@/lib/api';

/**
 * Hook for fetching swap quotes
 */
export function useQuote() {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const getQuote = useCallback(async (request: SwapRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await trading.getQuote(request);

      if (response.success && response.data) {
        setQuote(response.data);
        return response.data;
      } else if (response.error) {
        setError(response.error);
        return null;
      }
    } catch (err) {
      setError({
        code: 'QUOTE_ERROR',
        message: err instanceof Error ? err.message : 'Failed to get quote',
      });
    } finally {
      setIsLoading(false);
    }

    return null;
  }, []);

  const clearQuote = useCallback(() => {
    setQuote(null);
    setError(null);
  }, []);

  return {
    quote,
    isLoading,
    error,
    getQuote,
    clearQuote,
  };
}

/**
 * Hook for executing swaps
 */
export function useSwap() {
  const [swap, setSwap] = useState<SwapResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const executeSwap = useCallback(
    async (request: SwapRequest & { walletAddress: string }) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await trading.swap(request);

        if (response.success && response.data) {
          setSwap(response.data);
          return response.data;
        } else if (response.error) {
          setError(response.error);
          return null;
        }
      } catch (err) {
        setError({
          code: 'SWAP_ERROR',
          message: err instanceof Error ? err.message : 'Failed to execute swap',
        });
      } finally {
        setIsLoading(false);
      }

      return null;
    },
    []
  );

  const reset = useCallback(() => {
    setSwap(null);
    setError(null);
  }, []);

  return {
    swap,
    isLoading,
    error,
    executeSwap,
    reset,
  };
}

/**
 * Hook for fetching trade history
 */
export function useTradeHistory(params?: {
  chainId?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  return useApi<{ trades: Trade[]; total: number }>(
    () => trading.getHistory(params),
    { deps: [params?.chainId, params?.status, params?.limit, params?.offset] }
  );
}

/**
 * Hook for fetching a single trade
 */
export function useTrade(
  tradeId: string,
  options?: UseApiOptions<Trade>
) {
  return useApi(
    () => trading.getTrade(tradeId),
    { ...options, deps: [tradeId, ...(options?.deps ?? [])] }
  );
}

export default useQuote;
