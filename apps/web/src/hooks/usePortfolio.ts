'use client';

/**
 * Portfolio Hooks
 *
 * React hooks for portfolio data fetching and management.
 */

import { useCallback } from 'react';
import { useApi, type UseApiOptions } from './useApi';
import { portfolio } from '@/lib/api';
import type { Portfolio, PortfolioByChain } from '@/lib/api';

/**
 * Hook for fetching user's full portfolio
 */
export function usePortfolio(options?: UseApiOptions<Portfolio>) {
  return useApi(() => portfolio.get(), options);
}

/**
 * Hook for fetching portfolio by chain
 */
export function usePortfolioByChain(
  chainId: string,
  options?: UseApiOptions<PortfolioByChain>
) {
  return useApi(
    () => portfolio.getByChain(chainId),
    { ...options, deps: [chainId, ...(options?.deps ?? [])] }
  );
}

/**
 * Hook for fetching all chains with holdings
 */
export function usePortfolioChains(options?: UseApiOptions<PortfolioByChain[]>) {
  return useApi(() => portfolio.getChains(), options);
}

/**
 * Hook for portfolio sync functionality
 */
export function usePortfolioSync() {
  const { data, isLoading, error, refetch, mutate } = useApi<Portfolio>(
    () => Promise.resolve({ success: true, data: undefined as unknown as Portfolio, timestamp: '' }),
    { immediate: false }
  );

  const sync = useCallback(async (chainId?: string) => {
    const response = await portfolio.sync(chainId);
    if (response.success && response.data) {
      mutate(response.data);
    }
    return response;
  }, [mutate]);

  return {
    portfolio: data,
    isLoading,
    error,
    sync,
    refetch,
  };
}

export default usePortfolio;
