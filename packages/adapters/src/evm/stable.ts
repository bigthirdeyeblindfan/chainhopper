/**
 * Stable Chain DEX Integrations
 *
 * Stable is a unique EVM chain that uses USDT as its native gas token.
 * This eliminates the need for a separate gas token and simplifies
 * the user experience for stablecoin transactions.
 *
 * Native DEXes:
 * - StableSwap - Primary DEX (Uniswap V2/V3 style)
 * - StableDEX - Native liquidity protocol
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Stable Chain ID
export const STABLE_CHAIN_ID = 988;

// Stable DEX Router Addresses
export const STABLE_ROUTERS = {
  stableswap: '0x0000000000000000000000000000000000000000', // StableSwap Router (TBD)
  stabledex: '0x0000000000000000000000000000000000000000', // StableDEX Router (TBD)
} as const;

// Stable Factory Addresses
export const STABLE_FACTORIES = {
  stableswap: '0x0000000000000000000000000000000000000000', // Factory (TBD)
} as const;

// Common Stable Tokens
// Note: USDT is the native gas token on Stable chain
export const STABLE_TOKENS = {
  USDT: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native USDT (gas token)
  WUSDT: '0x0000000000000000000000000000000000000000', // Wrapped USDT (TBD)
  USDC: '0x0000000000000000000000000000000000000000', // USDC (TBD)
  DAI: '0x0000000000000000000000000000000000000000', // DAI (TBD)
  ETH: '0x0000000000000000000000000000000000000000', // Bridged ETH (TBD)
  WETH: '0x0000000000000000000000000000000000000000', // Wrapped ETH (TBD)
  WBTC: '0x0000000000000000000000000000000000000000', // Wrapped BTC (TBD)
};

// StableSwap API endpoint (placeholder)
const STABLESWAP_API = 'https://api.stableswap.io/v1';

// StableSwap Router ABI (Uniswap V2 style)
export const STABLESWAP_ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'swapExactTokensForETH',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
  {
    name: 'getAmountsOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'path', type: 'address[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

export interface StableQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from StableSwap
 */
export async function getStableSwapQuote(
  request: SwapRequest
): Promise<StableQuote | null> {
  if (request.chainId !== 'stable') {
    return null;
  }

  try {
    // Try StableSwap API for quote
    const quoteResponse = await fetch(`${STABLESWAP_API}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountIn: request.amountIn.toString(),
        slippage: request.slippage,
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder for 'stableswap'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '100000'), // Lower gas due to USDT native
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'stableswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || STABLE_ROUTERS.stableswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from StableDEX
 */
export async function getStableDexQuote(
  request: SwapRequest
): Promise<StableQuote | null> {
  if (request.chainId !== 'stable') {
    return null;
  }

  try {
    // StableDEX API placeholder
    const quoteResponse = await fetch('https://api.stabledex.io/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: STABLE_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '120000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'stabledex',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || STABLE_ROUTERS.stabledex,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Stable chain
 */
export async function getStableBestQuote(
  request: SwapRequest
): Promise<StableQuote | null> {
  if (request.chainId !== 'stable') {
    return null;
  }

  const quotes = await Promise.all([
    getStableSwapQuote(request),
    getStableDexQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is StableQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Stable
 */
export function buildStableSwapTransaction(
  quote: StableQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || STABLE_ROUTERS.stableswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Stable
 */
export function getStableDexes(): string[] {
  return ['stableswap', 'stabledex'];
}

/**
 * Check if chain is Stable
 */
export function isStableChain(chainId: string): boolean {
  return chainId === 'stable';
}

/**
 * Get Stable chain ID
 */
export function getStableChainId(): number {
  return STABLE_CHAIN_ID;
}

/**
 * Get popular trading pairs on Stable
 * Note: USDT is the native token, so pairs are denominated in USDT
 */
export function getStablePopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: STABLE_TOKENS.USDT, tokenOut: STABLE_TOKENS.USDC, name: 'USDT/USDC' },
    { tokenIn: STABLE_TOKENS.USDT, tokenOut: STABLE_TOKENS.DAI, name: 'USDT/DAI' },
    { tokenIn: STABLE_TOKENS.USDT, tokenOut: STABLE_TOKENS.ETH, name: 'USDT/ETH' },
    { tokenIn: STABLE_TOKENS.ETH, tokenOut: STABLE_TOKENS.WBTC, name: 'ETH/WBTC' },
  ];
}

/**
 * Get native token decimals for Stable chain
 * Stable uses USDT (6 decimals) as native gas token
 */
export function getStableNativeDecimals(): number {
  return 6;
}
