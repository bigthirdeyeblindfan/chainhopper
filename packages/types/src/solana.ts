/**
 * Solana-specific types and configurations
 *
 * Solana is a high-performance blockchain using Proof of Stake
 * with Proof of History. SOL is the native token with 9 decimals.
 */

import type { ChainConfig } from './chains.js';

/**
 * Solana chain identifier (mainnet-beta)
 */
export type SolanaChainId = 'solana';

/**
 * Solana cluster types
 */
export type SolanaCluster = 'mainnet-beta' | 'testnet' | 'devnet';

/**
 * Solana token standard
 */
export type SolanaTokenStandard = 'spl' | 'token-2022';

/**
 * Solana token metadata
 */
export interface SolanaToken {
  /** Token mint address (base58) */
  address: string;
  /** Token symbol (e.g., SOL, USDC) */
  symbol: string;
  /** Token name */
  name: string;
  /** Number of decimals (SOL = 9, most SPL = 6) */
  decimals: number;
  /** Logo URI */
  logoURI?: string;
  /** Token standard */
  standard: SolanaTokenStandard;
  /** Coingecko ID for price lookups */
  coingeckoId?: string;
  /** Whether token is verified on Jupiter */
  isVerified: boolean;
  /** Token tags (e.g., stablecoin, wrapped, meme) */
  tags?: string[];
}

/**
 * Solana chain configuration
 */
export interface SolanaConfig extends ChainConfig {
  /** Solana cluster */
  cluster: SolanaCluster;
  /** WebSocket RPC URLs for subscriptions */
  wsUrls: string[];
  /** Priority fee configuration */
  priorityFee: {
    /** Default priority fee in microlamports per compute unit */
    default: number;
    /** Maximum priority fee */
    max: number;
    /** Whether to use dynamic priority fees */
    dynamic: boolean;
  };
  /** Compute budget configuration */
  computeBudget: {
    /** Default compute units */
    defaultUnits: number;
    /** Maximum compute units */
    maxUnits: number;
  };
  /** Jito MEV configuration */
  jito?: {
    /** Jito block engine URL */
    blockEngineUrl: string;
    /** Default tip in lamports */
    defaultTip: number;
  };
}

/**
 * Solana Associated Token Account (ATA)
 */
export interface SolanaATA {
  /** ATA address */
  address: string;
  /** Token mint address */
  mint: string;
  /** Owner wallet address */
  owner: string;
  /** Token balance */
  balance: bigint;
  /** Whether ATA exists on-chain */
  exists: boolean;
}

/**
 * Solana transaction configuration
 */
export interface SolanaTransactionConfig {
  /** Recent blockhash */
  recentBlockhash: string;
  /** Fee payer address */
  feePayer: string;
  /** Priority fee in microlamports per compute unit */
  priorityFee?: number;
  /** Compute unit limit */
  computeUnits?: number;
  /** Whether to use versioned transactions */
  versioned: boolean;
  /** Address lookup tables for versioned tx */
  addressLookupTables?: string[];
  /** Jito tip in lamports */
  jitoTip?: number;
}

/**
 * Solana swap route hop
 */
export interface SolanaSwapHop {
  /** DEX/AMM name */
  dex: SolanaDex;
  /** Pool address */
  poolAddress: string;
  /** Input token mint */
  inputMint: string;
  /** Output token mint */
  outputMint: string;
  /** Input amount */
  inAmount: bigint;
  /** Output amount */
  outAmount: bigint;
  /** Fee amount */
  feeAmount: bigint;
  /** Fee mint */
  feeMint: string;
}

/**
 * Supported Solana DEXes
 */
export type SolanaDex =
  | 'jupiter'
  | 'raydium'
  | 'raydium-clmm'
  | 'orca'
  | 'orca-whirlpool'
  | 'meteora'
  | 'meteora-dlmm'
  | 'phoenix'
  | 'lifinity'
  | 'openbook'
  | 'openbook-v2'
  | 'aldrin'
  | 'saber'
  | 'marinade'
  | 'goosefx'
  | 'fluxbeam';

/**
 * Solana swap quote
 */
export interface SolanaSwapQuote {
  /** Input token mint */
  inputMint: string;
  /** Output token mint */
  outputMint: string;
  /** Input amount in smallest unit */
  inAmount: bigint;
  /** Output amount in smallest unit */
  outAmount: bigint;
  /** Minimum output amount after slippage */
  otherAmountThreshold: bigint;
  /** Slippage in basis points */
  slippageBps: number;
  /** Price impact percentage */
  priceImpactPct: number;
  /** Swap route */
  route: SolanaSwapHop[];
  /** Estimated fees in lamports */
  fees: {
    /** Network fee */
    networkFee: bigint;
    /** Platform fee */
    platformFee: bigint;
    /** Priority fee */
    priorityFee: bigint;
  };
  /** Quote expiry timestamp */
  expiresAt: number;
  /** Quote source */
  source: 'jupiter' | 'raydium' | 'orca' | 'native';
}

/**
 * Solana RPC provider configuration
 */
export interface SolanaRpcConfig {
  /** RPC endpoint URL */
  url: string;
  /** WebSocket endpoint URL */
  wsUrl?: string;
  /** API key for authenticated endpoints */
  apiKey?: string;
  /** Provider name */
  provider: 'helius' | 'quicknode' | 'triton' | 'alchemy' | 'ankr' | 'public';
  /** Rate limit (requests per second) */
  rateLimit?: number;
  /** Timeout in milliseconds */
  timeout?: number;
}

/**
 * Popular Solana token addresses
 */
export const SOLANA_TOKENS = {
  // Native
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL

  // Stablecoins
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  PYUSD: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
  USDe: 'DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT',

  // Major tokens
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  RENDER: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  HNT: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',

  // Liquid staking
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  jitoSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  bSOL: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
  stSOL: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',

  // Memecoins
  SAMO: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  MYRO: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4',
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  MEW: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',
  BOME: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82',
} as const;

/**
 * Solana program IDs
 */
export const SOLANA_PROGRAMS = {
  // System
  SYSTEM: '11111111111111111111111111111111',
  TOKEN: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
  TOKEN_2022: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb',
  ASSOCIATED_TOKEN: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
  COMPUTE_BUDGET: 'ComputeBudget111111111111111111111111111111',
  MEMO: 'MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr',

  // DEXes
  JUPITER_V6: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  RAYDIUM_AMM: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  RAYDIUM_CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  ORCA_WHIRLPOOL: 'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc',
  METEORA_DLMM: 'LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo',
  PHOENIX: 'PhoeNiXZ8ByJGLkxNfZRnkUfjvmuYqLR89jjFHGqdXY',
  OPENBOOK_V2: 'opnb2LAfJYbRMAHHvqjCwQxanZn7ReEHp1k81EohpZb',
} as const;

/**
 * Default Solana configuration
 */
export const DEFAULT_SOLANA_CONFIG: Partial<SolanaConfig> = {
  id: 'solana',
  name: 'Solana',
  type: 'svm',
  cluster: 'mainnet-beta',
  nativeCurrency: {
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
  },
  rpcUrls: [
    'https://api.mainnet-beta.solana.com',
  ],
  wsUrls: [
    'wss://api.mainnet-beta.solana.com',
  ],
  blockExplorerUrls: [
    'https://solscan.io',
    'https://explorer.solana.com',
  ],
  priorityFee: {
    default: 1000, // 1000 microlamports per CU
    max: 1000000,  // 1M microlamports per CU
    dynamic: true,
  },
  computeBudget: {
    defaultUnits: 200000,
    maxUnits: 1400000,
  },
  isTestnet: false,
  isEnabled: true,
};
