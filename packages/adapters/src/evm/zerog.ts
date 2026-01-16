/**
 * 0G (Zero Gravity) Chain DEX Integrations
 *
 * 0G is an AI-focused modular blockchain designed for data availability
 * and AI workloads. Uses A0GI as native gas token.
 *
 * Native DEXes:
 * - 0GSwap - Primary DEX on 0G (Uniswap V2 fork)
 * - Gravity DEX - Native liquidity protocol
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// 0G Chain ID
export const ZEROG_CHAIN_ID = 16600;

// 0G DEX Router Addresses
export const ZEROG_ROUTERS = {
  zerogswap: '0x0000000000000000000000000000000000000000', // 0GSwap Router (TBD)
  gravitydex: '0x0000000000000000000000000000000000000000', // Gravity DEX (TBD)
} as const;

// 0G Factory Addresses
export const ZEROG_FACTORIES = {
  zerogswap: '0x0000000000000000000000000000000000000000', // Factory (TBD)
} as const;

// Common 0G Tokens
export const ZEROG_TOKENS = {
  A0GI: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native A0GI
  WA0GI: '0x4200000000000000000000000000000000000006', // Wrapped A0GI
  USDC: '0x0000000000000000000000000000000000000000', // USDC (TBD)
  USDT: '0x0000000000000000000000000000000000000000', // USDT (TBD)
  ETH: '0x0000000000000000000000000000000000000000', // Bridged ETH (TBD)
  WETH: '0x0000000000000000000000000000000000000000', // Wrapped ETH (TBD)
};

// 0GSwap API endpoint (placeholder)
const ZEROGSWAP_API = 'https://api.0gswap.ai/v1';

// 0GSwap Router ABI (Uniswap V2 style)
export const ZEROGSWAP_ROUTER_ABI = [
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

export interface ZeroGQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from 0GSwap
 */
export async function getZeroGSwapQuote(
  request: SwapRequest
): Promise<ZeroGQuote | null> {
  if (request.chainId !== 'zerog') {
    return null;
  }

  try {
    // Try 0GSwap API for quote
    const quoteResponse = await fetch(`${ZEROGSWAP_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder for '0gswap'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: '0gswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || ZEROG_ROUTERS.zerogswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Gravity DEX
 */
export async function getGravityDexQuote(
  request: SwapRequest
): Promise<ZeroGQuote | null> {
  if (request.chainId !== 'zerog') {
    return null;
  }

  try {
    // Gravity DEX API placeholder
    const quoteResponse = await fetch('https://api.gravitydex.ai/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: ZEROG_CHAIN_ID,
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
        estimatedGas: BigInt(data.estimatedGas || '180000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'gravitydex',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || ZEROG_ROUTERS.gravitydex,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for 0G chain
 */
export async function getZeroGBestQuote(
  request: SwapRequest
): Promise<ZeroGQuote | null> {
  if (request.chainId !== 'zerog') {
    return null;
  }

  const quotes = await Promise.all([
    getZeroGSwapQuote(request),
    getGravityDexQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is ZeroGQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for 0G
 */
export function buildZeroGSwapTransaction(
  quote: ZeroGQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || ZEROG_ROUTERS.zerogswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on 0G
 */
export function getZeroGDexes(): string[] {
  return ['0gswap', 'gravitydex'];
}

/**
 * Check if chain is 0G
 */
export function isZeroGChain(chainId: string): boolean {
  return chainId === 'zerog';
}

/**
 * Get 0G chain ID
 */
export function getZeroGChainId(): number {
  return ZEROG_CHAIN_ID;
}

/**
 * Get popular trading pairs on 0G
 */
export function getZeroGPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: ZEROG_TOKENS.A0GI, tokenOut: ZEROG_TOKENS.USDC, name: 'A0GI/USDC' },
    { tokenIn: ZEROG_TOKENS.WA0GI, tokenOut: ZEROG_TOKENS.USDC, name: 'WA0GI/USDC' },
    { tokenIn: ZEROG_TOKENS.A0GI, tokenOut: ZEROG_TOKENS.USDT, name: 'A0GI/USDT' },
    { tokenIn: ZEROG_TOKENS.ETH, tokenOut: ZEROG_TOKENS.A0GI, name: 'ETH/A0GI' },
  ];
}
