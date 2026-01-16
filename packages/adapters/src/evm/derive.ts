/**
 * Derive Chain DEX Integrations
 *
 * Derive (formerly Lyra) is a derivatives-focused L2 built on
 * Optimism's OP Stack. Uses ETH as native gas token.
 * Focused on options and perpetual trading.
 *
 * Native DEXes:
 * - Derive Protocol - Native options/perps DEX
 * - Velodrome - ve(3,3) DEX for spot trading
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Derive Chain ID
export const DERIVE_CHAIN_ID = 957;

// Derive DEX Router Addresses
export const DERIVE_ROUTERS = {
  derive: '0x0000000000000000000000000000000000000000', // Derive Protocol Router (TBD)
  velodrome: '0x0000000000000000000000000000000000000000', // Velodrome Router (TBD)
} as const;

// Derive Factory Addresses
export const DERIVE_FACTORIES = {
  derive: '0x0000000000000000000000000000000000000000', // Derive Factory
  velodrome: '0x0000000000000000000000000000000000000000', // Velodrome Factory
} as const;

// Common Derive Tokens
export const DERIVE_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH (OP Stack standard)
  USDC: '0x0000000000000000000000000000000000000000', // USDC (TBD)
  USDT: '0x0000000000000000000000000000000000000000', // USDT (TBD)
  DRV: '0x0000000000000000000000000000000000000000', // Derive token (TBD)
  LYRA: '0x0000000000000000000000000000000000000000', // Legacy Lyra token (TBD)
};

// Derive Protocol Router ABI
export const DERIVE_ROUTER_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'recipient', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'getAmountOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

// Velodrome Router ABI (ve(3,3) style)
export const DERIVE_VELODROME_ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' },
        ],
      },
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
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' },
        ],
      },
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
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
          { name: 'factory', type: 'address' },
        ],
      },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

export interface DeriveQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Derive Protocol
 */
export async function getDeriveProtocolQuote(
  request: SwapRequest
): Promise<DeriveQuote | null> {
  if (request.chainId !== 'derive') {
    return null;
  }

  try {
    // Derive Protocol API placeholder
    const quoteResponse = await fetch('https://api.derive.xyz/v1/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: DERIVE_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        slippage: request.slippage,
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder for 'derive'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'derive',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || DERIVE_ROUTERS.derive,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Velodrome on Derive
 */
export async function getVelodromeDeriveQuote(
  request: SwapRequest
): Promise<DeriveQuote | null> {
  if (request.chainId !== 'derive') {
    return null;
  }

  try {
    // Velodrome API placeholder for Derive chain
    const quoteResponse = await fetch('https://api.velodrome.finance/derive/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: DERIVE_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        slippage: request.slippage,
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
          dex: 'velodrome',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || DERIVE_ROUTERS.velodrome,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Derive chain
 */
export async function getDeriveBestQuote(
  request: SwapRequest
): Promise<DeriveQuote | null> {
  if (request.chainId !== 'derive') {
    return null;
  }

  const quotes = await Promise.all([
    getDeriveProtocolQuote(request),
    getVelodromeDeriveQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is DeriveQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Derive
 */
export function buildDeriveSwapTransaction(
  quote: DeriveQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || DERIVE_ROUTERS.derive,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Derive
 */
export function getDeriveDexes(): string[] {
  return ['derive', 'velodrome'];
}

/**
 * Check if chain is Derive
 */
export function isDeriveChain(chainId: string): boolean {
  return chainId === 'derive';
}

/**
 * Get Derive chain ID
 */
export function getDeriveChainId(): number {
  return DERIVE_CHAIN_ID;
}

/**
 * Get popular trading pairs on Derive
 */
export function getDerivePopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: DERIVE_TOKENS.ETH, tokenOut: DERIVE_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: DERIVE_TOKENS.WETH, tokenOut: DERIVE_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: DERIVE_TOKENS.ETH, tokenOut: DERIVE_TOKENS.DRV, name: 'ETH/DRV' },
    { tokenIn: DERIVE_TOKENS.DRV, tokenOut: DERIVE_TOKENS.USDC, name: 'DRV/USDC' },
  ];
}
