import type { ChainId } from '@chainhopper/types';
import type { PriceData, PriceProvider, DexScreenerConfig } from './types.js';

// DexScreener chain identifiers
const CHAIN_MAPPING: Partial<Record<ChainId, string>> = {
  ethereum: 'ethereum',
  base: 'base',
  arbitrum: 'arbitrum',
  optimism: 'optimism',
  polygon: 'polygon',
  bsc: 'bsc',
  avalanche: 'avalanche',
  sonic: 'sonic',
  sui: 'sui',
  ton: 'ton',
};

interface DexScreenerPair {
  chainId: string;
  dexId: string;
  url: string;
  pairAddress: string;
  baseToken: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative: string;
  priceUsd: string;
  txns: {
    h24: { buys: number; sells: number };
  };
  volume: {
    h24: number;
  };
  priceChange: {
    h24: number;
  };
  liquidity: {
    usd: number;
  };
  fdv: number;
}

/**
 * DexScreener Price Provider
 * Best for new tokens, memecoins, and low-cap assets
 * Falls back when Chainlink/Pyth don't have feeds
 */
export class DexScreenerProvider implements PriceProvider {
  name = 'dexscreener' as const;
  priority = 3; // Lower priority, used as fallback

  private config: DexScreenerConfig;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(config: DexScreenerConfig) {
    this.config = config;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId in CHAIN_MAPPING;
  }

  async supportsToken(_tokenAddress: string, chainId: ChainId): Promise<boolean> {
    // DexScreener can potentially support any token
    return this.supportsChain(chainId);
  }

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    const minInterval = 60000 / this.config.rateLimit;

    if (elapsed < minInterval) {
      await new Promise(resolve => setTimeout(resolve, minInterval - elapsed));
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  async getPrice(tokenAddress: string, chainId: ChainId): Promise<PriceData | null> {
    const dexChainId = CHAIN_MAPPING[chainId];
    if (!dexChainId) {
      return null;
    }

    await this.rateLimit();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/dex/tokens/${tokenAddress}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      const pairs: DexScreenerPair[] = data.pairs || [];

      // Filter pairs for our chain and sort by liquidity
      const chainPairs = pairs
        .filter(p => p.chainId === dexChainId)
        .sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));

      if (chainPairs.length === 0) {
        return null;
      }

      // Use the most liquid pair
      const bestPair = chainPairs[0];
      const priceUsd = parseFloat(bestPair.priceUsd);

      if (isNaN(priceUsd) || priceUsd <= 0) {
        return null;
      }

      // Calculate confidence based on liquidity and volume
      const liquidity = bestPair.liquidity?.usd || 0;
      const volume = bestPair.volume?.h24 || 0;

      let confidence = 0.5; // Base confidence for DEX data
      if (liquidity > 1_000_000) confidence += 0.2;
      else if (liquidity > 100_000) confidence += 0.1;
      if (volume > 100_000) confidence += 0.1;
      confidence = Math.min(confidence, 0.85);

      return {
        tokenAddress,
        chainId,
        priceUsd,
        confidence,
        source: 'dexscreener',
        timestamp: new Date(),
        metadata: {
          volume24h: volume,
          liquidity,
          priceChange24h: bestPair.priceChange?.h24,
          marketCap: bestPair.fdv,
        },
      };
    } catch (error) {
      console.error(`DexScreener price fetch failed for ${tokenAddress} on ${chainId}:`, error);
      return null;
    }
  }

  async getPrices(tokens: { address: string; chainId: ChainId }[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();

    // DexScreener doesn't have a batch endpoint, so we fetch sequentially with rate limiting
    for (const { address, chainId } of tokens) {
      const price = await this.getPrice(address, chainId);
      if (price) {
        results.set(`${chainId}:${address.toLowerCase()}`, price);
      }
    }

    return results;
  }

  /**
   * Search for token pairs by query
   */
  async searchTokens(query: string): Promise<DexScreenerPair[]> {
    await this.rateLimit();

    try {
      const response = await fetch(
        `${this.config.baseUrl}/dex/search/?q=${encodeURIComponent(query)}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`DexScreener API error: ${response.status}`);
      }

      const data = await response.json();
      return data.pairs || [];
    } catch (error) {
      console.error('DexScreener search failed:', error);
      return [];
    }
  }
}
