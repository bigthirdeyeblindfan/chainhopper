/**
 * Solana Token Definitions and Utilities
 *
 * Popular token addresses and token list integration for Solana mainnet.
 */

import type { SolanaToken, SolanaTokenStandard } from '@chainhopper/types';

/**
 * Popular Solana token addresses (mainnet-beta)
 */
export const SOLANA_TOKEN_ADDRESSES = {
  // Native
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL

  // Stablecoins
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  PYUSD: '2b1kV6DkPAnxd5ixfnxCpjxmKwqjjaYmCZfHsFu24GXo',
  USDe: 'DEkqHyPN7GMRJ5cArtQFAWefqbZb33Hyf6s5iCwjEonT',
  USDY: 'A1KLoBrKBde8Ty9qtNQUtq3C2ortoC3u7twggz7sEto6',
  DAI: 'EjmyN6qEC1Tf1JxiG1ae7UTJhUxSwk1TCCNABnKaYZiK',

  // Major tokens
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
  RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
  ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE',
  PYTH: 'HZ1JovNiVvGrGNiiYvEozEVgZ58xaU3RKwX8eACQBCt3',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
  RENDER: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
  HNT: 'hntyVP6YFm1Hg25TN9WGLqM12b8TQmcknKrdu1oxWux',
  MOBILE: 'mb1eu7TzEc71KxDpsmsKoucSSuuoGLv1drys1oP2jh6',
  IOT: 'iotEVVZLEywoTn1QdwNPddxPWszn3zFhEot3MfL9fns',
  W: '85VBFQZC9TZkfaptBWjvUw7YbZjy52A6mjtPGjstQAmQ',

  // Liquid staking
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  jitoSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  bSOL: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
  stSOL: '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj',
  LST: 'LSTxxxnJzKDFSLr4dUkPcmCf5VyryEqzPLz5j4bpxFp',
  INF: '5oVNBeEEQvYi1cX3ir8Dx5n1P7pdxydbGF2X4TxVusJm',

  // Memecoins
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  WIF: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
  POPCAT: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr',
  MEW: 'MEW1gQWJ3nEXg2qgERiKu7FAFj79PHvQVREQUzScPP5',
  BOME: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82',
  SAMO: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
  MYRO: 'HhJpBhRRn4g56VsyLuT8DL5Bv31HkXqsrahTTUCZeZg4',
  SLERF: '7BgBvyjrZX1YKz4oh9mjb8ZScatkkwb8DzFx7LoiVkM3',
  PONKE: '5z3EqYQo9HiCEs3R84RCDMu2n7anpDMxRhdK8PSWmrRC',
  GIGA: 'GigaswapEpiVV9UPBTYTwgG3V86vQVLfHwcPfLqPVFmp',

  // Wrapped assets
  WBTC: '3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh', // Wormhole
  WETH: '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // Wormhole

  // DeFi tokens
  MNGO: 'MangoCzJ36AjZyKwVj3VnYU4GTonjfVEnJmvvWaxLac',
  SRM: 'SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt',
  STEP: 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',
  COPE: '8HGyAAB1yoM1ttS7pXjHMa3dukTFGQggnFFH3hJZgzQh',
  FIDA: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
  ATLAS: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx',
  POLIS: 'poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk',
} as const;

/**
 * Token metadata for popular Solana tokens
 */
export const SOLANA_TOKEN_LIST: SolanaToken[] = [
  {
    address: SOLANA_TOKEN_ADDRESSES.SOL,
    symbol: 'SOL',
    name: 'Wrapped SOL',
    decimals: 9,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'solana',
    tags: ['native'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.USDC,
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'usd-coin',
    tags: ['stablecoin'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.USDT,
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'tether',
    tags: ['stablecoin'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.JUP,
    symbol: 'JUP',
    name: 'Jupiter',
    decimals: 6,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'jupiter-exchange-solana',
    tags: ['governance', 'defi'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.RAY,
    symbol: 'RAY',
    name: 'Raydium',
    decimals: 6,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'raydium',
    tags: ['defi', 'dex'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.ORCA,
    symbol: 'ORCA',
    name: 'Orca',
    decimals: 6,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'orca',
    tags: ['defi', 'dex'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.BONK,
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'bonk',
    tags: ['meme'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.WIF,
    symbol: 'WIF',
    name: 'dogwifhat',
    decimals: 6,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'dogwifcoin',
    tags: ['meme'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.mSOL,
    symbol: 'mSOL',
    name: 'Marinade staked SOL',
    decimals: 9,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'msol',
    tags: ['liquid-staking'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.jitoSOL,
    symbol: 'jitoSOL',
    name: 'Jito Staked SOL',
    decimals: 9,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'jito-staked-sol',
    tags: ['liquid-staking'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.JTO,
    symbol: 'JTO',
    name: 'Jito',
    decimals: 9,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'jito-governance-token',
    tags: ['governance', 'mev'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.PYTH,
    symbol: 'PYTH',
    name: 'Pyth Network',
    decimals: 6,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'pyth-network',
    tags: ['oracle', 'defi'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.RENDER,
    symbol: 'RENDER',
    name: 'Render Token',
    decimals: 8,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'render-token',
    tags: ['gpu', 'compute'],
  },
  {
    address: SOLANA_TOKEN_ADDRESSES.HNT,
    symbol: 'HNT',
    name: 'Helium',
    decimals: 8,
    standard: 'spl',
    isVerified: true,
    coingeckoId: 'helium',
    tags: ['depin', 'iot'],
  },
];

/**
 * Jupiter API endpoints
 */
export const JUPITER_API = {
  quote: 'https://quote-api.jup.ag/v6/quote',
  swap: 'https://quote-api.jup.ag/v6/swap',
  swapInstructions: 'https://quote-api.jup.ag/v6/swap-instructions',
  tokens: 'https://token.jup.ag/all',
  price: 'https://price.jup.ag/v6/price',
  strictTokens: 'https://token.jup.ag/strict',
} as const;

/**
 * Fetch token list from Jupiter API
 */
export async function fetchJupiterTokenList(): Promise<SolanaToken[]> {
  try {
    const response = await fetch(JUPITER_API.strictTokens);
    if (!response.ok) return SOLANA_TOKEN_LIST;

    const data = await response.json() as any[];

    return data.map((token: any) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      logoURI: token.logoURI,
      standard: 'spl' as SolanaTokenStandard,
      isVerified: true,
      coingeckoId: token.extensions?.coingeckoId,
      tags: token.tags || [],
    }));
  } catch {
    return SOLANA_TOKEN_LIST;
  }
}

/**
 * Get token by address from cached list
 */
export function getTokenByAddress(address: string): SolanaToken | undefined {
  return SOLANA_TOKEN_LIST.find((t) => t.address === address);
}

/**
 * Get token by symbol from cached list
 */
export function getTokenBySymbol(symbol: string): SolanaToken | undefined {
  return SOLANA_TOKEN_LIST.find(
    (t) => t.symbol.toLowerCase() === symbol.toLowerCase()
  );
}

/**
 * Check if address is wrapped SOL
 */
export function isWrappedSol(address: string): boolean {
  return address === SOLANA_TOKEN_ADDRESSES.SOL;
}

/**
 * Check if address is a stablecoin
 */
export function isStablecoin(address: string): boolean {
  const stablecoins = [
    SOLANA_TOKEN_ADDRESSES.USDC,
    SOLANA_TOKEN_ADDRESSES.USDT,
    SOLANA_TOKEN_ADDRESSES.PYUSD,
    SOLANA_TOKEN_ADDRESSES.USDe,
    SOLANA_TOKEN_ADDRESSES.USDY,
    SOLANA_TOKEN_ADDRESSES.DAI,
  ];
  return stablecoins.includes(address as any);
}

/**
 * Get popular trading pairs
 */
export function getPopularPairs(): Array<{ inputMint: string; outputMint: string; name: string }> {
  return [
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.USDC, name: 'SOL/USDC' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.USDT, name: 'SOL/USDT' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.JUP, name: 'SOL/JUP' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.BONK, name: 'SOL/BONK' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.WIF, name: 'SOL/WIF' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.RAY, name: 'SOL/RAY' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.mSOL, name: 'SOL/mSOL' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.SOL, outputMint: SOLANA_TOKEN_ADDRESSES.jitoSOL, name: 'SOL/jitoSOL' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.USDC, outputMint: SOLANA_TOKEN_ADDRESSES.USDT, name: 'USDC/USDT' },
    { inputMint: SOLANA_TOKEN_ADDRESSES.JUP, outputMint: SOLANA_TOKEN_ADDRESSES.USDC, name: 'JUP/USDC' },
  ];
}
