// @ts-nocheck
import type { ChainId } from '@chainhopper/types';
import type { PriceData, PriceProvider, PythConfig } from './types.js';

// Pyth price IDs for major tokens
// Full list: https://pyth.network/developers/price-feed-ids
const PYTH_PRICE_IDS: Record<string, string> = {
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'BTC': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'SOL': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'AVAX': '0x93da3352f9f1d105fdfe4971cfa80e9dd777bfc5d0f683ebb6e1294b92137bb7',
  'MATIC': '0x5de33440f6c3a7d63e82e3b6e37e4e7f6a0c1a4a6e9e0e7e7e7e7e7e7e7e7e7e',
  'ARB': '0x3fa4252848f9f0a1480be62745a4629d9eb1322aebab8a791e344b3b9c1adcf5',
  'OP': '0x385f64d993f7b77d8182ed5003d97c60aa3361f3cecfe711544d2d59165e9bdf',
  'SUI': '0x23d7315113f5b1d3ba7a83604c44b94d79f4fd69af77f804fc7f920a6dc65744',
  'TON': '0x8963217838ab4cf5cadc172203c1f0b763fbaa45f346d8ee50ba994bbcac3026',
};

/**
 * Pyth Network Price Feed Provider
 * Fast updates, good for real-time pricing
 */
export class PythProvider implements PriceProvider {
  name = 'pyth' as const;
  priority = 2; // Second priority after Chainlink

  private config: PythConfig;
  private priceIds: Record<string, string>;

  constructor(config: PythConfig) {
    this.config = config;
    this.priceIds = { ...PYTH_PRICE_IDS, ...config.priceIds };
  }

  supportsChain(_chainId: ChainId): boolean {
    // Pyth supports most chains through their API
    return true;
  }

  async supportsToken(tokenAddress: string, _chainId: ChainId): Promise<boolean> {
    // We support tokens by symbol, need to map address to symbol
    // For now, support known tokens
    const symbol = this.addressToSymbol(tokenAddress);
    return symbol !== null && symbol in this.priceIds;
  }

  private addressToSymbol(address: string): string | null {
    // Map common token addresses to symbols
    const addressMap: Record<string, string> = {
      '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee': 'ETH',
      '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': 'USDC', // Ethereum USDC
      '0xdac17f958d2ee523a2206206994597c13d831ec7': 'USDT', // Ethereum USDT
      '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': 'BTC',  // WBTC
    };
    return addressMap[address.toLowerCase()] || null;
  }

  async getPrice(tokenAddress: string, chainId: ChainId): Promise<PriceData | null> {
    const symbol = this.addressToSymbol(tokenAddress);
    if (!symbol) {
      return null;
    }

    const priceId = this.priceIds[symbol];
    if (!priceId) {
      return null;
    }

    try {
      const response = await fetch(
        `${this.config.endpoint}/api/latest_price_feeds?ids[]=${priceId}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`Pyth API error: ${response.status}`);
      }

      const data = await response.json();
      const priceFeed = data[0];

      if (!priceFeed || !priceFeed.price) {
        return null;
      }

      const price = priceFeed.price;
      const priceUsd = Number(price.price) * Math.pow(10, price.expo);
      const confidence = Number(price.conf) * Math.pow(10, price.expo);

      // Calculate confidence as ratio of confidence interval to price
      const confidenceRatio = 1 - Math.min(confidence / priceUsd, 0.5);

      return {
        tokenAddress,
        chainId,
        priceUsd,
        confidence: confidenceRatio,
        source: 'pyth',
        timestamp: new Date(price.publish_time * 1000),
      };
    } catch (error) {
      console.error(`Pyth price fetch failed for ${tokenAddress}:`, error);
      return null;
    }
  }

  async getPrices(tokens: { address: string; chainId: ChainId }[]): Promise<Map<string, PriceData>> {
    const results = new Map<string, PriceData>();

    // Collect all price IDs we need
    const priceIdToToken = new Map<string, { address: string; chainId: ChainId }>();
    const priceIds: string[] = [];

    for (const token of tokens) {
      const symbol = this.addressToSymbol(token.address);
      if (symbol && this.priceIds[symbol]) {
        const priceId = this.priceIds[symbol];
        priceIds.push(priceId);
        priceIdToToken.set(priceId, token);
      }
    }

    if (priceIds.length === 0) {
      return results;
    }

    try {
      const queryString = priceIds.map(id => `ids[]=${id}`).join('&');
      const response = await fetch(
        `${this.config.endpoint}/api/latest_price_feeds?${queryString}`,
        { headers: { 'Accept': 'application/json' } }
      );

      if (!response.ok) {
        throw new Error(`Pyth API error: ${response.status}`);
      }

      const data = await response.json();

      for (const priceFeed of data) {
        const token = priceIdToToken.get(priceFeed.id);
        if (!token || !priceFeed.price) continue;

        const price = priceFeed.price;
        const priceUsd = Number(price.price) * Math.pow(10, price.expo);
        const confidence = Number(price.conf) * Math.pow(10, price.expo);
        const confidenceRatio = 1 - Math.min(confidence / priceUsd, 0.5);

        results.set(`${token.chainId}:${token.address.toLowerCase()}`, {
          tokenAddress: token.address,
          chainId: token.chainId,
          priceUsd,
          confidence: confidenceRatio,
          source: 'pyth',
          timestamp: new Date(price.publish_time * 1000),
        });
      }
    } catch (error) {
      console.error('Pyth batch price fetch failed:', error);
    }

    return results;
  }
}
