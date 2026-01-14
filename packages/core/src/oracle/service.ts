import type { ChainId } from '@chainhopper/types';
import type { PriceData, PriceProvider, OracleConfig } from './types.js';
import { ChainlinkProvider } from './chainlink.js';
import { PythProvider } from './pyth.js';
import { DexScreenerProvider } from './dexscreener.js';

interface CacheEntry {
  data: PriceData;
  expiresAt: number;
}

/**
 * Unified Price Oracle Service
 *
 * Aggregates multiple price providers with fallback logic:
 * 1. Chainlink (most reliable for majors)
 * 2. Pyth (fast updates)
 * 3. DexScreener (new tokens, memecoins)
 *
 * Features:
 * - Automatic fallback to next provider on failure
 * - Price caching with TTL
 * - Confidence scoring
 * - Staleness detection
 */
export class PriceOracleService {
  private providers: PriceProvider[];
  private cache = new Map<string, CacheEntry>();
  private config: OracleConfig;

  constructor(config: OracleConfig) {
    this.config = config;
    this.providers = [];

    // Initialize providers based on config
    if (config.providers.chainlink) {
      this.providers.push(new ChainlinkProvider(config.providers.chainlink));
    }

    if (config.providers.pyth) {
      this.providers.push(new PythProvider(config.providers.pyth));
    }

    if (config.providers.dexscreener) {
      this.providers.push(new DexScreenerProvider(config.providers.dexscreener));
    }

    // Sort by priority (lower = higher priority)
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get price for a single token
   * Tries providers in priority order until one succeeds
   */
  async getPrice(tokenAddress: string, chainId: ChainId): Promise<PriceData | null> {
    const cacheKey = this.getCacheKey(tokenAddress, chainId);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    // Try providers in priority order
    for (const provider of this.providers) {
      if (!provider.supportsChain(chainId)) {
        continue;
      }

      try {
        const price = await provider.getPrice(tokenAddress, chainId);
        if (price && this.isValidPrice(price)) {
          this.setCache(cacheKey, price);
          return price;
        }
      } catch (error) {
        console.warn(`Provider ${provider.name} failed for ${tokenAddress}:`, error);
        // Continue to next provider
      }
    }

    return null;
  }

  /**
   * Get prices for multiple tokens
   * Uses batch endpoints where available, falls back to individual requests
   */
  async getPrices(tokens: { address: string; chainId: ChainId }[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();
    const uncached: { address: string; chainId: ChainId }[] = [];

    // First check cache
    for (const token of tokens) {
      const cacheKey = this.getCacheKey(token.address, token.chainId);
      const cached = this.cache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        results.set(cacheKey, cached.data);
      } else {
        uncached.push(token);
      }
    }

    if (uncached.length === 0) {
      return results;
    }

    // Try each provider for remaining tokens
    let remaining = [...uncached];

    for (const provider of this.providers) {
      if (remaining.length === 0) break;

      const supportedTokens = remaining.filter(t => provider.supportsChain(t.chainId));
      if (supportedTokens.length === 0) continue;

      try {
        const prices = await provider.getPrices(supportedTokens);

        for (const [key, price] of prices) {
          if (this.isValidPrice(price)) {
            results.set(key, price);
            this.setCache(key, price);
          }
        }

        // Remove tokens we got prices for
        remaining = remaining.filter(t => {
          const key = this.getCacheKey(t.address, t.chainId);
          return !results.has(key);
        });
      } catch (error) {
        console.warn(`Batch price fetch from ${provider.name} failed:`, error);
      }
    }

    return results;
  }

  /**
   * Get price with metadata about the source and confidence
   */
  async getPriceWithMetadata(
    tokenAddress: string,
    chainId: ChainId
  ): Promise<{
    price: PriceData | null;
    sources: { provider: string; available: boolean; error?: string }[];
  }> {
    const sources: { provider: string; available: boolean; error?: string }[] = [];
    let bestPrice: PriceData | null = null;

    for (const provider of this.providers) {
      if (!provider.supportsChain(chainId)) {
        sources.push({ provider: provider.name, available: false, error: 'Chain not supported' });
        continue;
      }

      try {
        const price = await provider.getPrice(tokenAddress, chainId);
        if (price && this.isValidPrice(price)) {
          sources.push({ provider: provider.name, available: true });
          if (!bestPrice || price.confidence > bestPrice.confidence) {
            bestPrice = price;
          }
        } else {
          sources.push({ provider: provider.name, available: false, error: 'No price data' });
        }
      } catch (error) {
        sources.push({
          provider: provider.name,
          available: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    if (bestPrice) {
      const cacheKey = this.getCacheKey(tokenAddress, chainId);
      this.setCache(cacheKey, bestPrice);
    }

    return { price: bestPrice, sources };
  }

  /**
   * Clear the price cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Clear cache for a specific token
   */
  clearCacheForToken(tokenAddress: string, chainId: ChainId): void {
    const cacheKey = this.getCacheKey(tokenAddress, chainId);
    this.cache.delete(cacheKey);
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: { key: string; expiresIn: number }[] } {
    const now = Date.now();
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      expiresIn: Math.max(0, entry.expiresAt - now),
    }));

    return { size: this.cache.size, entries };
  }

  private getCacheKey(tokenAddress: string, chainId: ChainId): string {
    return `${chainId}:${tokenAddress.toLowerCase()}`;
  }

  private setCache(key: string, data: PriceData): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + this.config.cacheTtl,
    });
  }

  private isValidPrice(price: PriceData): boolean {
    // Check price is positive
    if (price.priceUsd <= 0) return false;

    // Check confidence threshold
    if (price.confidence < this.config.minConfidence) return false;

    // Check staleness
    const age = Date.now() - price.timestamp.getTime();
    if (age > this.config.maxPriceAge) return false;

    return true;
  }
}

/**
 * Create a default configured price oracle
 */
export function createPriceOracle(options?: Partial<OracleConfig>): PriceOracleService {
  const defaultConfig: OracleConfig = {
    cacheTtl: 30_000, // 30 seconds
    maxPriceAge: 300_000, // 5 minutes
    minConfidence: 0.3,
    providers: {
      chainlink: {
        rpcUrls: {
          ethereum: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
          base: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
          arbitrum: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
        },
        feedAddresses: {},
      },
      pyth: {
        endpoint: process.env.PYTH_ENDPOINT || 'https://hermes.pyth.network',
        priceIds: {},
      },
      dexscreener: {
        baseUrl: 'https://api.dexscreener.com',
        rateLimit: 30, // 30 requests per minute
      },
    },
  };

  const config = { ...defaultConfig, ...options };
  if (options?.providers) {
    config.providers = { ...defaultConfig.providers, ...options.providers };
  }

  return new PriceOracleService(config);
}
