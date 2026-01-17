/**
 * Raydium DEX Integration
 *
 * Raydium is a leading AMM and liquidity provider on Solana.
 * Supports both traditional AMM pools and CLMM (concentrated liquidity).
 *
 * Documentation: https://docs.raydium.io/
 */

import type { SolanaSwapQuote, SolanaSwapHop, SolanaDex } from '@chainhopper/types';

/**
 * Raydium API endpoints
 */
export const RAYDIUM_API = {
  // V3 API (latest)
  v3: {
    poolList: 'https://api-v3.raydium.io/pools/info/list',
    poolById: 'https://api-v3.raydium.io/pools/info/ids',
    poolByMint: 'https://api-v3.raydium.io/pools/info/mint',
    poolKeys: 'https://api-v3.raydium.io/pools/key/ids',
    clmmPools: 'https://api-v3.raydium.io/pools/info/list?poolType=concentrated',
    ammPools: 'https://api-v3.raydium.io/pools/info/list?poolType=standard',
    farmPools: 'https://api-v3.raydium.io/farms/info/list',
    tokenList: 'https://api-v3.raydium.io/mint/list',
    price: 'https://api-v3.raydium.io/mint/price',
    computeSwap: 'https://api-v3.raydium.io/compute/swap-base-in',
  },
  // Legacy V2 API
  v2: {
    pairs: 'https://api.raydium.io/v2/main/pairs',
    price: 'https://api.raydium.io/v2/main/price',
    ammPools: 'https://api.raydium.io/v2/ammV3/ammPools',
  },
} as const;

/**
 * Raydium program IDs
 */
export const RAYDIUM_PROGRAMS = {
  // AMM V4
  AMM_V4: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
  // CLMM
  CLMM: 'CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK',
  // Stable swap
  STABLE: '5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h',
  // CPMM (new constant product)
  CPMM: 'CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C',
  // Authority
  AUTHORITY: '5Q544fKrFoe6tsEbD7S8EmxGTJYAKtTVhAW5Q5pge4j1',
  // OpenBook market
  OPENBOOK: 'srmqPvymJeFKQ4zGQed1GFppgkRHL9kaELCbyksJtPX',
} as const;

/**
 * Pool types supported by Raydium
 */
export type RaydiumPoolType = 'Standard' | 'Concentrated' | 'Stable' | 'CPMM';

/**
 * Raydium AMM pool info (V4)
 */
export interface RaydiumAmmPool {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  version: number;
  programId: string;
  authority: string;
  openOrders: string;
  targetOrders: string;
  baseVault: string;
  quoteVault: string;
  withdrawQueue: string;
  lpVault: string;
  marketVersion: number;
  marketProgramId: string;
  marketId: string;
  marketAuthority: string;
  marketBaseVault: string;
  marketQuoteVault: string;
  marketBids: string;
  marketAsks: string;
  marketEventQueue: string;
  lookupTableAccount?: string;
}

/**
 * Raydium CLMM pool info
 */
export interface RaydiumClmmPool {
  id: string;
  mintA: string;
  mintB: string;
  mintDecimalsA: number;
  mintDecimalsB: number;
  ammConfig: string;
  creator: string;
  programId: string;
  auth: string;
  mintVaultA: string;
  mintVaultB: string;
  observationId: string;
  tickSpacing: number;
  liquidity: string;
  sqrtPriceX64: string;
  currentPrice: number;
  tickCurrent: number;
  feeRate: number;
  protocolFeeRate: number;
  fundFeeRate: number;
  tvl: number;
  day: {
    volume: number;
    volumeFee: number;
    feeApr: number;
    rewardApr: { A: number; B: number; C: number };
    apr: number;
  };
  week: {
    volume: number;
    volumeFee: number;
    feeApr: number;
    rewardApr: { A: number; B: number; C: number };
    apr: number;
  };
  month: {
    volume: number;
    volumeFee: number;
    feeApr: number;
    rewardApr: { A: number; B: number; C: number };
    apr: number;
  };
  lookupTableAccount?: string;
}

/**
 * Raydium pool info (unified)
 */
export interface RaydiumPoolInfo {
  type: RaydiumPoolType;
  id: string;
  mintA: {
    address: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  };
  mintB: {
    address: string;
    symbol: string;
    decimals: number;
    logoURI?: string;
  };
  price: number;
  tvl: number;
  feeRate: number;
  apr: {
    fee: number;
    reward: number;
    total: number;
  };
  volume24h: number;
  programId: string;
}

/**
 * Raydium swap compute request
 */
export interface RaydiumSwapRequest {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps: number;
  txVersion: 'V0' | 'LEGACY';
}

/**
 * Raydium swap compute response
 */
export interface RaydiumSwapResponse {
  id: string;
  success: boolean;
  data?: {
    swapType: 'BaseIn' | 'BaseOut';
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
    otherAmountThreshold: string;
    slippageBps: number;
    priceImpactPct: number;
    routePlan: RaydiumRoutePlan[];
  };
  msg?: string;
}

/**
 * Raydium route plan
 */
export interface RaydiumRoutePlan {
  poolId: string;
  inputMint: string;
  outputMint: string;
  feeMint: string;
  feeRate: number;
  feeAmount: string;
  remainingAccounts: string[];
  lastPoolPriceX64?: string;
}

/**
 * Raydium token info
 */
export interface RaydiumTokenInfo {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
  };
}

/**
 * Raydium client for API interactions
 */
export class RaydiumClient {
  private baseUrl: string;

  constructor(options?: { baseUrl?: string }) {
    this.baseUrl = options?.baseUrl || 'https://api-v3.raydium.io';
  }

  /**
   * Get all pools with pagination
   */
  async getPools(params?: {
    poolType?: RaydiumPoolType;
    poolSortField?: 'liquidity' | 'volume24h' | 'fee24h' | 'apr24h';
    sortType?: 'asc' | 'desc';
    pageSize?: number;
    page?: number;
  }): Promise<{ count: number; data: RaydiumPoolInfo[] }> {
    const searchParams = new URLSearchParams();

    if (params?.poolType) {
      const typeMap: Record<RaydiumPoolType, string> = {
        Standard: 'standard',
        Concentrated: 'concentrated',
        Stable: 'stable',
        CPMM: 'cpmm',
      };
      searchParams.set('poolType', typeMap[params.poolType]);
    }
    if (params?.poolSortField) {
      searchParams.set('poolSortField', params.poolSortField);
    }
    if (params?.sortType) {
      searchParams.set('sortType', params.sortType);
    }
    if (params?.pageSize) {
      searchParams.set('pageSize', params.pageSize.toString());
    }
    if (params?.page) {
      searchParams.set('page', params.page.toString());
    }

    const response = await fetch(`${this.baseUrl}/pools/info/list?${searchParams}`);

    if (!response.ok) {
      throw new RaydiumError(`Failed to fetch pools: ${await response.text()}`, 'POOLS_ERROR');
    }

    const result = await response.json();
    return result.data;
  }

  /**
   * Get pool by ID
   */
  async getPoolById(poolId: string): Promise<RaydiumPoolInfo | null> {
    const response = await fetch(`${this.baseUrl}/pools/info/ids?ids=${poolId}`);

    if (!response.ok) {
      throw new RaydiumError(`Failed to fetch pool: ${await response.text()}`, 'POOL_ERROR');
    }

    const result = await response.json();
    return result.data?.[0] || null;
  }

  /**
   * Get pools by token mints
   */
  async getPoolsByMints(
    mint1: string,
    mint2?: string,
    poolType?: RaydiumPoolType
  ): Promise<RaydiumPoolInfo[]> {
    const searchParams = new URLSearchParams();
    searchParams.set('mint1', mint1);
    if (mint2) searchParams.set('mint2', mint2);
    if (poolType) {
      const typeMap: Record<RaydiumPoolType, string> = {
        Standard: 'standard',
        Concentrated: 'concentrated',
        Stable: 'stable',
        CPMM: 'cpmm',
      };
      searchParams.set('poolType', typeMap[poolType]);
    }

    const response = await fetch(`${this.baseUrl}/pools/info/mint?${searchParams}`);

    if (!response.ok) {
      throw new RaydiumError(`Failed to fetch pools by mint: ${await response.text()}`, 'POOLS_MINT_ERROR');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Compute swap quote
   */
  async computeSwap(params: RaydiumSwapRequest): Promise<RaydiumSwapResponse> {
    const searchParams = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
      slippageBps: params.slippageBps.toString(),
      txVersion: params.txVersion,
    });

    const response = await fetch(`${this.baseUrl}/compute/swap-base-in?${searchParams}`);

    if (!response.ok) {
      throw new RaydiumError(`Swap compute failed: ${await response.text()}`, 'SWAP_COMPUTE_ERROR');
    }

    return response.json();
  }

  /**
   * Get token prices
   */
  async getTokenPrices(mints: string[]): Promise<Record<string, number>> {
    const response = await fetch(`${this.baseUrl}/mint/price?mints=${mints.join(',')}`);

    if (!response.ok) {
      throw new RaydiumError(`Price fetch failed: ${await response.text()}`, 'PRICE_ERROR');
    }

    const result = await response.json();
    return result.data || {};
  }

  /**
   * Get token list
   */
  async getTokenList(): Promise<RaydiumTokenInfo[]> {
    const response = await fetch(`${this.baseUrl}/mint/list`);

    if (!response.ok) {
      throw new RaydiumError(`Token list failed: ${await response.text()}`, 'TOKEN_LIST_ERROR');
    }

    const result = await response.json();
    return result.data || [];
  }

  /**
   * Get CLMM pools
   */
  async getClmmPools(params?: {
    pageSize?: number;
    page?: number;
  }): Promise<RaydiumClmmPool[]> {
    const searchParams = new URLSearchParams({
      poolType: 'concentrated',
    });
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.page) searchParams.set('page', params.page.toString());

    const response = await fetch(`${this.baseUrl}/pools/info/list?${searchParams}`);

    if (!response.ok) {
      throw new RaydiumError(`CLMM pools fetch failed: ${await response.text()}`, 'CLMM_POOLS_ERROR');
    }

    const result = await response.json();
    return result.data?.data || [];
  }

  /**
   * Get AMM pools (standard)
   */
  async getAmmPools(params?: {
    pageSize?: number;
    page?: number;
  }): Promise<RaydiumAmmPool[]> {
    const searchParams = new URLSearchParams({
      poolType: 'standard',
    });
    if (params?.pageSize) searchParams.set('pageSize', params.pageSize.toString());
    if (params?.page) searchParams.set('page', params.page.toString());

    const response = await fetch(`${this.baseUrl}/pools/info/list?${searchParams}`);

    if (!response.ok) {
      throw new RaydiumError(`AMM pools fetch failed: ${await response.text()}`, 'AMM_POOLS_ERROR');
    }

    const result = await response.json();
    return result.data?.data || [];
  }

  /**
   * Get pool keys for transaction building
   */
  async getPoolKeys(poolIds: string[]): Promise<Record<string, any>> {
    const response = await fetch(`${this.baseUrl}/pools/key/ids?ids=${poolIds.join(',')}`);

    if (!response.ok) {
      throw new RaydiumError(`Pool keys fetch failed: ${await response.text()}`, 'POOL_KEYS_ERROR');
    }

    const result = await response.json();
    return result.data || {};
  }
}

/**
 * Raydium-specific error class
 */
export class RaydiumError extends Error {
  code: string;

  constructor(message: string, code: string) {
    super(message);
    this.name = 'RaydiumError';
    this.code = code;
  }
}

/**
 * Convert Raydium swap response to SolanaSwapQuote
 */
export function convertRaydiumQuote(
  response: RaydiumSwapResponse,
  inputMint: string,
  outputMint: string
): SolanaSwapQuote | null {
  if (!response.success || !response.data) {
    return null;
  }

  const data = response.data;

  const route: SolanaSwapHop[] = data.routePlan.map((step) => ({
    dex: step.poolId.includes('CLMM') ? 'raydium-clmm' : 'raydium',
    poolAddress: step.poolId,
    inputMint: step.inputMint,
    outputMint: step.outputMint,
    inAmount: BigInt(data.inputAmount),
    outAmount: BigInt(data.outputAmount),
    feeAmount: BigInt(step.feeAmount),
    feeMint: step.feeMint,
  }));

  return {
    inputMint: data.inputMint,
    outputMint: data.outputMint,
    inAmount: BigInt(data.inputAmount),
    outAmount: BigInt(data.outputAmount),
    otherAmountThreshold: BigInt(data.otherAmountThreshold),
    slippageBps: data.slippageBps,
    priceImpactPct: data.priceImpactPct,
    route,
    fees: {
      networkFee: 5000n,
      platformFee: 0n,
      priorityFee: 0n,
    },
    expiresAt: Date.now() + 60000,
    source: 'raydium',
  };
}

/**
 * Get Raydium quote
 */
export async function getRaydiumQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<SolanaSwapQuote | null> {
  try {
    const client = new RaydiumClient();
    const response = await client.computeSwap({
      inputMint,
      outputMint,
      amount,
      slippageBps,
      txVersion: 'V0',
    });

    return convertRaydiumQuote(response, inputMint, outputMint);
  } catch (error) {
    console.error('Raydium quote failed:', error);
    return null;
  }
}

/**
 * Find best Raydium pool for a token pair
 */
export async function findBestRaydiumPool(
  mintA: string,
  mintB: string
): Promise<RaydiumPoolInfo | null> {
  try {
    const client = new RaydiumClient();
    const pools = await client.getPoolsByMints(mintA, mintB);

    if (pools.length === 0) return null;

    // Sort by TVL (highest liquidity = best execution)
    pools.sort((a, b) => b.tvl - a.tvl);
    return pools[0];
  } catch (error) {
    console.error('Find Raydium pool failed:', error);
    return null;
  }
}

/**
 * Popular Raydium pool IDs
 */
export const RAYDIUM_POPULAR_POOLS = {
  // SOL pairs
  SOL_USDC: '58oQChx4yWmvKdwLLZzBi4ChoCc2fqCUWBkwMihLYQo2',
  SOL_USDT: '7XawhbbxtsRcQA8KTkHT9f9nc6d69UwqCDh6U5EEbEmX',
  SOL_RAY: 'AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA',

  // Stablecoin pairs
  USDC_USDT: '77quYg4MGneUdjgXCunt9GgM1usmrxKY31twEy3WHwcS',

  // RAY pairs
  RAY_USDC: '6UmmUiYoBjSrhakAobJw8BvkmJtDVxaeBtbt7rxWo1mg',
  RAY_USDT: 'DVa7Qmb5ct9RCpaU7UTpSaf3GVMYz17vNVU67XpdCRut',
  RAY_SOL: 'AVs9TA4nWDzfPJE9gGVNJMVhcQy3V9PGazuz33BfG2RA',

  // Popular meme pairs (CLMM)
  BONK_SOL: '5raVPNQGnLR6BbBk6q4D1FQ8MR7RcZh8Ap6YrDPDAjkH',
  WIF_SOL: '7CkQsKKw3DPHi3q7w2RQp8dRDe8MJsRLRLLR4Mv4Mv4d',
} as const;

/**
 * CLMM fee tiers
 */
export const RAYDIUM_CLMM_FEE_TIERS = {
  LOWEST: 100,    // 0.01%
  LOW: 500,       // 0.05%
  MEDIUM: 2500,   // 0.25%
  HIGH: 10000,    // 1%
} as const;

/**
 * AMM fee rate (standard)
 */
export const RAYDIUM_AMM_FEE_RATE = 2500; // 0.25%

/**
 * Create Raydium client instance
 */
export function createRaydiumClient(options?: { baseUrl?: string }): RaydiumClient {
  return new RaydiumClient(options);
}

/**
 * Check if pool is CLMM
 */
export function isClmmPool(pool: RaydiumPoolInfo): boolean {
  return pool.type === 'Concentrated';
}

/**
 * Check if pool is standard AMM
 */
export function isAmmPool(pool: RaydiumPoolInfo): boolean {
  return pool.type === 'Standard';
}

/**
 * Calculate price impact for AMM swap
 * @param amountIn Input amount
 * @param reserveIn Reserve of input token
 * @param reserveOut Reserve of output token
 * @param feeRate Fee rate in basis points
 */
export function calculateAmmPriceImpact(
  amountIn: bigint,
  reserveIn: bigint,
  reserveOut: bigint,
  feeRate: number = RAYDIUM_AMM_FEE_RATE
): { amountOut: bigint; priceImpact: number } {
  // Apply fee
  const amountInWithFee = amountIn * BigInt(10000 - feeRate) / 10000n;

  // Constant product formula: x * y = k
  // amountOut = reserveOut - (reserveIn * reserveOut) / (reserveIn + amountInWithFee)
  const numerator = reserveIn * reserveOut;
  const denominator = reserveIn + amountInWithFee;
  const newReserveOut = numerator / denominator;
  const amountOut = reserveOut - newReserveOut;

  // Price impact = 1 - (effective price / spot price)
  const spotPrice = Number(reserveOut) / Number(reserveIn);
  const effectivePrice = Number(amountOut) / Number(amountIn);
  const priceImpact = (1 - effectivePrice / spotPrice) * 100;

  return { amountOut, priceImpact };
}

/**
 * Get optimal CLMM tick range for liquidity provision
 */
export function getOptimalClmmTickRange(
  currentTick: number,
  tickSpacing: number,
  rangeWidthPercent: number = 10
): { tickLower: number; tickUpper: number } {
  // Calculate price range based on percentage
  const ticksForRange = Math.floor(
    (Math.log(1 + rangeWidthPercent / 100) / Math.log(1.0001)) / tickSpacing
  ) * tickSpacing;

  const tickLower = Math.floor((currentTick - ticksForRange) / tickSpacing) * tickSpacing;
  const tickUpper = Math.floor((currentTick + ticksForRange) / tickSpacing) * tickSpacing;

  return { tickLower, tickUpper };
}

/**
 * Convert tick to price
 */
export function tickToPrice(tick: number, decimalsA: number, decimalsB: number): number {
  const price = Math.pow(1.0001, tick);
  return price * Math.pow(10, decimalsA - decimalsB);
}

/**
 * Convert price to tick
 */
export function priceToTick(price: number, decimalsA: number, decimalsB: number): number {
  const adjustedPrice = price / Math.pow(10, decimalsA - decimalsB);
  return Math.floor(Math.log(adjustedPrice) / Math.log(1.0001));
}
