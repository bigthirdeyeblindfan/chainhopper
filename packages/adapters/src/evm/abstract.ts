/**
 * Abstract Chain DEX Integrations
 *
 * Abstract is a zkSync-based L2 built by Igloo Inc. (Pudgy Penguins)
 * with native account abstraction and consumer-focused features.
 *
 * Native DEXes:
 * - AbstractSwap - Primary DEX on Abstract
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// Abstract Chain ID
export const ABSTRACT_CHAIN_ID = 2741;

// Abstract DEX Router Addresses
export const ABSTRACT_ROUTERS = {
  abstractswap: '0x1234567890123456789012345678901234567890', // AbstractSwap Router (placeholder)
} as const;

// Common Abstract Tokens
export const ABSTRACT_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x3439153EB7AF838Ad19d56E1571FBD09333C2809', // Wrapped ETH
  USDC: '0x0000000000000000000000000000000000000000', // USDC (TBD)
  USDT: '0x0000000000000000000000000000000000000000', // USDT (TBD)
};

// AbstractSwap API endpoint
const ABSTRACTSWAP_API = 'https://api.abstractswap.com/v1';

// AbstractSwap Router ABI fragments (Uniswap V2 style)
export const ABSTRACTSWAP_ROUTER_ABI = [
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

export interface AbstractQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from AbstractSwap
 */
export async function getAbstractSwapQuote(
  request: SwapRequest
): Promise<AbstractQuote | null> {
  if (request.chainId !== 'abstract') {
    return null;
  }

  try {
    // Try API-based quote first
    const quoteResponse = await fetch(`${ABSTRACTSWAP_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder, would be 'abstractswap'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'abstractswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || ABSTRACT_ROUTERS.abstractswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    // Fallback: return null to try other aggregators
    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Abstract chain
 */
export async function getAbstractBestQuote(
  request: SwapRequest
): Promise<AbstractQuote | null> {
  if (request.chainId !== 'abstract') {
    return null;
  }

  const quotes = await Promise.all([
    getAbstractSwapQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is AbstractQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Abstract
 */
export function buildAbstractSwapTransaction(
  quote: AbstractQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || ABSTRACT_ROUTERS.abstractswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Abstract
 */
export function getAbstractDexes(): string[] {
  return ['abstractswap'];
}

/**
 * Check if chain is Abstract
 */
export function isAbstractChain(chainId: string): boolean {
  return chainId === 'abstract';
}

/**
 * Get popular trading pairs on Abstract
 */
export function getAbstractPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: ABSTRACT_TOKENS.ETH, tokenOut: ABSTRACT_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: ABSTRACT_TOKENS.WETH, tokenOut: ABSTRACT_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: ABSTRACT_TOKENS.USDC, tokenOut: ABSTRACT_TOKENS.USDT, name: 'USDC/USDT' },
  ];
}
