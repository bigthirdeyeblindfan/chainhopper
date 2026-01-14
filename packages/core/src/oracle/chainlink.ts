import type { ChainId } from '@chainhopper/types';
import type { PriceData, PriceProvider, ChainlinkConfig } from './types.js';
import { CHAINLINK_FEEDS } from './types.js';

// Chainlink Aggregator V3 Interface ABI (minimal)
const AGGREGATOR_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

/**
 * Chainlink Price Feed Provider
 * Most reliable for major tokens on established chains
 */
export class ChainlinkProvider implements PriceProvider {
  name = 'chainlink' as const;
  priority = 1; // Highest priority

  private config: ChainlinkConfig;
  private decimalsCache = new Map<string, number>();

  constructor(config: ChainlinkConfig) {
    this.config = config;
  }

  supportsChain(chainId: ChainId): boolean {
    return chainId in CHAINLINK_FEEDS || chainId in (this.config.feedAddresses || {});
  }

  async supportsToken(tokenAddress: string, chainId: ChainId): Promise<boolean> {
    const feeds = {
      ...CHAINLINK_FEEDS[chainId],
      ...this.config.feedAddresses?.[chainId],
    };
    return tokenAddress.toLowerCase() in this.normalizeFeeds(feeds);
  }

  private normalizeFeeds(feeds: Record<string, string> | undefined): Record<string, string> {
    if (!feeds) return {};
    return Object.fromEntries(
      Object.entries(feeds).map(([k, v]) => [k.toLowerCase(), v])
    );
  }

  async getPrice(tokenAddress: string, chainId: ChainId): Promise<PriceData | null> {
    const feeds = {
      ...CHAINLINK_FEEDS[chainId],
      ...this.config.feedAddresses?.[chainId],
    };

    const normalizedFeeds = this.normalizeFeeds(feeds);
    const feedAddress = normalizedFeeds[tokenAddress.toLowerCase()];

    if (!feedAddress) {
      return null;
    }

    const rpcUrl = this.config.rpcUrls[chainId];
    if (!rpcUrl) {
      return null;
    }

    try {
      const [roundData, decimals] = await Promise.all([
        this.callContract(rpcUrl, feedAddress, 'latestRoundData'),
        this.getDecimals(rpcUrl, feedAddress),
      ]);

      const answer = BigInt(roundData.answer);
      const updatedAt = Number(roundData.updatedAt);
      const priceUsd = Number(answer) / Math.pow(10, decimals);

      // Check if price is stale (more than 1 hour old)
      const now = Math.floor(Date.now() / 1000);
      const age = now - updatedAt;
      const isStale = age > 3600;

      return {
        tokenAddress,
        chainId,
        priceUsd,
        confidence: isStale ? 0.5 : 0.95, // High confidence for Chainlink
        source: 'chainlink',
        timestamp: new Date(updatedAt * 1000),
      };
    } catch (error) {
      console.error(`Chainlink price fetch failed for ${tokenAddress} on ${chainId}:`, error);
      return null;
    }
  }

  async getPrices(tokens: { address: string; chainId: ChainId }[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();

    // Group by chain for efficient batching
    const byChain = new Map<ChainId, string[]>();
    for (const { address, chainId } of tokens) {
      const list = byChain.get(chainId) || [];
      list.push(address);
      byChain.set(chainId, list);
    }

    // Fetch prices for each chain
    await Promise.all(
      Array.from(byChain.entries()).map(async ([chainId, addresses]) => {
        await Promise.all(
          addresses.map(async (address) => {
            const price = await this.getPrice(address, chainId);
            if (price) {
              results.set(`${chainId}:${address.toLowerCase()}`, price);
            }
          })
        );
      })
    );

    return results;
  }

  private async getDecimals(rpcUrl: string, feedAddress: string): Promise<number> {
    const cacheKey = `${rpcUrl}:${feedAddress}`;
    if (this.decimalsCache.has(cacheKey)) {
      return this.decimalsCache.get(cacheKey)!;
    }

    const result = await this.callContract(rpcUrl, feedAddress, 'decimals');
    const decimals = Number(result);
    this.decimalsCache.set(cacheKey, decimals);
    return decimals;
  }

  private async callContract(rpcUrl: string, address: string, method: string): Promise<any> {
    // Encode function call
    const methodSignatures: Record<string, string> = {
      latestRoundData: '0xfeaf968c',
      decimals: '0x313ce567',
    };

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          { to: address, data: methodSignatures[method] },
          'latest',
        ],
      }),
    });

    const json = await response.json();
    if (json.error) {
      throw new Error(json.error.message);
    }

    // Decode response
    if (method === 'decimals') {
      return parseInt(json.result, 16);
    }

    if (method === 'latestRoundData') {
      const data = json.result.slice(2);
      return {
        roundId: BigInt('0x' + data.slice(0, 64)),
        answer: BigInt('0x' + data.slice(64, 128)),
        startedAt: BigInt('0x' + data.slice(128, 192)),
        updatedAt: BigInt('0x' + data.slice(192, 256)),
        answeredInRound: BigInt('0x' + data.slice(256, 320)),
      };
    }

    return json.result;
  }
}
