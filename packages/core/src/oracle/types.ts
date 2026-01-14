import type { ChainId } from '@chainhopper/types';

export type PriceSource = 'chainlink' | 'pyth' | 'dexscreener' | 'coingecko' | 'dex';

export interface PriceData {
  tokenAddress: string;
  chainId: ChainId;
  priceUsd: number;
  confidence: number; // 0-1, higher = more reliable
  source: PriceSource;
  timestamp: Date;
  metadata?: {
    volume24h?: number;
    liquidity?: number;
    priceChange24h?: number;
    marketCap?: number;
  };
}

export interface PriceProvider {
  name: PriceSource;
  priority: number; // lower = higher priority

  /**
   * Get price for a single token
   */
  getPrice(tokenAddress: string, chainId: ChainId): Promise<PriceData | null>;

  /**
   * Get prices for multiple tokens (batch)
   */
  getPrices(tokens: { address: string; chainId: ChainId }[]): Promise<Map<string, PriceData>>;

  /**
   * Check if this provider supports the given chain
   */
  supportsChain(chainId: ChainId): boolean;

  /**
   * Check if this provider supports the given token
   */
  supportsToken(tokenAddress: string, chainId: ChainId): Promise<boolean>;
}

export interface OracleConfig {
  /** Cache TTL in milliseconds */
  cacheTtl: number;
  /** Maximum age of price data before considered stale (ms) */
  maxPriceAge: number;
  /** Minimum confidence threshold (0-1) */
  minConfidence: number;
  /** Provider-specific configs */
  providers: {
    chainlink?: ChainlinkConfig;
    pyth?: PythConfig;
    dexscreener?: DexScreenerConfig;
    coingecko?: CoingeckoConfig;
  };
}

export interface ChainlinkConfig {
  rpcUrls: Partial<Record<ChainId, string>>;
  feedAddresses: Partial<Record<ChainId, Record<string, string>>>; // chainId -> tokenAddress -> feedAddress
}

export interface PythConfig {
  endpoint: string;
  priceIds: Record<string, string>; // symbol -> priceId
}

export interface DexScreenerConfig {
  baseUrl: string;
  rateLimit: number; // requests per minute
}

export interface CoingeckoConfig {
  apiKey?: string;
  baseUrl: string;
}

// Well-known token addresses for price lookups
export const NATIVE_TOKENS: Partial<Record<ChainId, string>> = {
  ethereum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  base: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  arbitrum: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  optimism: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  polygon: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  bsc: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  avalanche: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  sonic: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  kaia: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
  berachain: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE',
};

// Chainlink feed addresses for major tokens
export const CHAINLINK_FEEDS: Partial<Record<ChainId, Record<string, string>>> = {
  ethereum: {
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD
    '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6', // USDC/USD
    '0xdAC17F958D2ee523a2206206994597C13D831ec7': '0x3E7d1eAB13ad0104d2750B8863b489D65364e32D', // USDT/USD
    '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599': '0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c', // WBTC/USD
  },
  base: {
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', // ETH/USD
  },
  arbitrum: {
    '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE': '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', // ETH/USD
  },
};
