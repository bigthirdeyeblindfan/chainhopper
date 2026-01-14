import type { ChainId } from './chains.js';

export interface Token {
  address: string;
  chainId: ChainId;
  symbol: string;
  name: string;
  decimals: number;
  logoUri?: string;
  isNative: boolean;
  isVerified: boolean;
}

export interface TokenBalance {
  token: Token;
  balance: bigint;
  balanceFormatted: string;
  valueUsd?: number;
}

export interface TokenPrice {
  token: Token;
  priceUsd: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  source: PriceSource;
  updatedAt: Date;
}

export type PriceSource =
  | 'coingecko'
  | 'coinmarketcap'
  | 'dexscreener'
  | 'chainlink'
  | 'pyth'
  | 'dex';

export interface TokenMetadata {
  token: Token;
  description?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  totalSupply?: bigint;
  circulatingSupply?: bigint;
  holders?: number;
  isRugPull: boolean;
  rugScore?: number; // 0-100, higher = more suspicious
  createdAt?: Date;
}
