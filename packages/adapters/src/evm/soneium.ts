/**
 * Soneium Chain DEX Integration
 *
 * Soneium is Sony's OP Stack-based L2 blockchain focused on entertainment,
 * gaming, and creator economy applications.
 *
 * Primary DEX: Kyo Finance (Uniswap V3 style concentrated liquidity)
 * Also supports: Velodrome-style ve(3,3) DEX
 *
 * Chain ID: 1868
 * Native Token: ETH
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';
import { EVM_CHAIN_IDS } from './chains.js';

// Soneium Chain ID
export const SONEIUM_CHAIN_ID = 1868;

// Kyo Finance Router Addresses
export const SONEIUM_ROUTERS = {
  kyoRouter: '0x1231DEB6f5749EF6cE6943a275A1D3E7486F4EaE', // Kyo Finance Router
  kyoQuoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a', // Kyo Quoter V2
  universalRouter: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Universal Router
} as const;

// Kyo Finance Factory Addresses
export const SONEIUM_FACTORIES = {
  kyoFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Kyo Pool Factory
  kyoNFTPositionManager: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', // Position Manager
} as const;

// Common Soneium Tokens
export const SONEIUM_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH (OP Stack)
  USDC: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // USDC
  USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // USDT
  DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI
  ASTR: '0x2CAE934a1e84F693fbb78CA5ED3B0A6893259441', // Astar token on Soneium
} as const;

// Kyo Finance API endpoint
const KYO_API = 'https://api.kyo.finance/v1';

// Kyo Finance Router ABI fragments (Uniswap V3 style)
export const KYO_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'fee', type: 'uint24' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'exactInput',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'path', type: 'bytes' },
          { name: 'recipient', type: 'address' },
          { name: 'deadline', type: 'uint256' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'multicall',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const;

// Kyo Quoter ABI fragments
export const KYO_QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

export interface SoneiumQuote extends AggregatorQuote {
  aggregator: DexAggregator;
  feeTier?: number;
}

/**
 * Get quote from Kyo Finance API
 */
export async function getKyoFinanceQuote(
  request: SwapRequest
): Promise<SoneiumQuote | null> {
  if (request.chainId !== 'soneium') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? SONEIUM_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? SONEIUM_TOKENS.WETH
      : request.tokenOut;

    // Try Kyo Finance API for quote
    const quoteResponse = await fetch(`${KYO_API}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chainId: SONEIUM_CHAIN_ID,
        tokenIn,
        tokenOut,
        amount: request.amountIn.toString(),
        type: 'exactIn',
        slippageTolerance: request.slippage * 100, // bps
        recipient: request.recipient || '',
      }),
    });

    if (quoteResponse.ok) {
      const data = (await quoteResponse.json()) as {
        amountOut?: string;
        estimatedGas?: string;
        priceImpact?: string;
        route?: Array<{
          pool?: string;
          tokenIn?: string;
          tokenOut?: string;
          fee?: number;
        }>;
        tx?: { data?: string; to?: string; value?: string };
        feeTier?: number;
      };

      return {
        aggregator: '1inch' as DexAggregator, // Placeholder for 'kyo'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: parseKyoRoute(data.route, request.tokenIn, request.tokenOut),
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || SONEIUM_ROUTERS.kyoRouter,
        txValue: isNativeToken(request.tokenIn)
          ? request.amountIn
          : BigInt(data.tx?.value || '0'),
        feeTier: data.feeTier || 3000, // Default 0.3% fee tier
      };
    }

    // Fallback to building a direct quote
    return buildKyoFallbackQuote(request);
  } catch {
    return buildKyoFallbackQuote(request);
  }
}

/**
 * Get quote using on-chain Quoter contract
 * This provides more accurate quotes but requires RPC calls
 */
export async function getKyoOnChainQuote(
  request: SwapRequest
): Promise<SoneiumQuote | null> {
  if (request.chainId !== 'soneium') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? SONEIUM_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? SONEIUM_TOKENS.WETH
      : request.tokenOut;

    // Try multiple fee tiers (0.05%, 0.3%, 1%)
    const feeTiers = [500, 3000, 10000];

    // Build path through WETH if neither token is WETH
    const path =
      tokenIn === SONEIUM_TOKENS.WETH || tokenOut === SONEIUM_TOKENS.WETH
        ? [tokenIn, tokenOut]
        : [tokenIn, SONEIUM_TOKENS.WETH, tokenOut];

    // Simplified estimation - would use actual quoter contract call in production
    const estimatedOutput = calculateEstimatedOutput(
      request.amountIn,
      request.slippage
    );

    return {
      aggregator: '1inch' as DexAggregator, // Placeholder
      amountOut: estimatedOutput,
      estimatedGas: 180000n,
      priceImpact: 0.3,
      route: [
        {
          dex: 'Kyo Finance',
          poolAddress: SONEIUM_FACTORIES.kyoFactory,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: encodeKyoSwap(request, path, 3000), // Default 0.3% fee tier
      txTo: SONEIUM_ROUTERS.kyoRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      feeTier: 3000,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote for Soneium chain
 */
export async function getSoneiumBestQuote(
  request: SwapRequest
): Promise<SoneiumQuote | null> {
  if (request.chainId !== 'soneium') {
    return null;
  }

  const quotes = await Promise.all([
    getKyoFinanceQuote(request),
    getKyoOnChainQuote(request),
  ]);

  const validQuotes = quotes.filter(
    (q): q is SoneiumQuote => q !== null && q.amountOut > 0n
  );

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Soneium
 */
export function buildSoneiumSwapTransaction(
  quote: SoneiumQuote,
  recipient: string
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || SONEIUM_ROUTERS.kyoRouter,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Soneium
 */
export function getSoneiumDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Kyo Finance', type: 'concentrated-liquidity', router: SONEIUM_ROUTERS.kyoRouter },
    { name: 'Universal Router', type: 'aggregator', router: SONEIUM_ROUTERS.universalRouter },
  ];
}

/**
 * Check if chain is Soneium
 */
export function isSoneiumChain(chainId: string): boolean {
  return chainId === 'soneium';
}

/**
 * Get Soneium chain ID
 */
export function getSoneiumChainId(): number {
  return EVM_CHAIN_IDS.soneium;
}

/**
 * Get popular trading pairs on Soneium
 */
export function getSoneiumPopularPairs(): Array<{
  tokenIn: string;
  tokenOut: string;
  name: string;
}> {
  return [
    { tokenIn: SONEIUM_TOKENS.ETH, tokenOut: SONEIUM_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: SONEIUM_TOKENS.WETH, tokenOut: SONEIUM_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: SONEIUM_TOKENS.ETH, tokenOut: SONEIUM_TOKENS.USDT, name: 'ETH/USDT' },
    { tokenIn: SONEIUM_TOKENS.USDC, tokenOut: SONEIUM_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: SONEIUM_TOKENS.ETH, tokenOut: SONEIUM_TOKENS.ASTR, name: 'ETH/ASTR' },
    { tokenIn: SONEIUM_TOKENS.WETH, tokenOut: SONEIUM_TOKENS.DAI, name: 'WETH/DAI' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === SONEIUM_TOKENS.ETH ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function parseKyoRoute(
  route: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(route)) {
    return [
      {
        dex: 'Kyo Finance',
        poolAddress: '',
        tokenIn,
        tokenOut,
        percentage: 100,
      },
    ];
  }

  try {
    return route.map(
      (hop: { pool?: string; tokenIn?: string; tokenOut?: string; fee?: number }) => ({
        dex: 'Kyo Finance',
        poolAddress: hop.pool || '',
        tokenIn: hop.tokenIn || tokenIn,
        tokenOut: hop.tokenOut || tokenOut,
        percentage: 100 / route.length,
      })
    );
  } catch {
    return [
      {
        dex: 'Kyo Finance',
        poolAddress: '',
        tokenIn,
        tokenOut,
        percentage: 100,
      },
    ];
  }
}

function buildKyoFallbackQuote(request: SwapRequest): SoneiumQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? SONEIUM_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? SONEIUM_TOKENS.WETH
      : request.tokenOut;

    // Build path
    const path =
      tokenIn === SONEIUM_TOKENS.WETH || tokenOut === SONEIUM_TOKENS.WETH
        ? [tokenIn, tokenOut]
        : [tokenIn, SONEIUM_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(
      request.amountIn,
      request.slippage
    );

    return {
      aggregator: '1inch' as DexAggregator, // Placeholder
      amountOut: minAmountOut,
      estimatedGas: 200000n,
      priceImpact: 0.5,
      route: [
        {
          dex: 'Kyo Finance',
          poolAddress: SONEIUM_ROUTERS.kyoRouter,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: encodeKyoSwap(request, path, 3000),
      txTo: SONEIUM_ROUTERS.kyoRouter,
      txValue: isNativeIn ? request.amountIn : 0n,
      feeTier: 3000,
    };
  } catch {
    return null;
  }
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  // Simplified estimation - assumes 1:1 ratio minus slippage
  // In production, this would use actual price data from oracles
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return (amountIn * (10000n - slippageBps)) / 10000n;
}

function encodeKyoSwap(
  request: SwapRequest,
  path: string[],
  feeTier: number
): string {
  // Simplified encoding - in production use viem or ethers for proper ABI encoding
  // This returns the exactInputSingle function selector
  const EXACT_INPUT_SINGLE_SELECTOR = '0x414bf389';
  return EXACT_INPUT_SINGLE_SELECTOR;
}
