/**
 * Fraxtal Chain DEX Integrations
 *
 * Fraxtal is Frax Finance's OP Stack L2 with native frxETH gas.
 * Uses frxETH as the native gas token.
 *
 * Native DEXes:
 * - Fraxswap - Native Frax DEX with TWAMM support
 * - FraxFerry - Cross-chain bridge/swap
 * - Ra Exchange - ve(3,3) DEX on Fraxtal
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// Fraxtal Chain ID
export const FRAXTAL_CHAIN_ID = 252;

// Fraxtal DEX Router Addresses
export const FRAXTAL_ROUTERS = {
  fraxswap: '0x39cd4db6460d8B5961F73E997E86DdbB7Ca4D5F6', // Fraxswap Router
  raExchange: '0xAAA45c8F5ef92a000a121d102F4e89278a711Faa', // Ra Exchange Router
  fraxFerry: '0x0000000000000000000000000000000000000000', // FraxFerry (TBD)
} as const;

// Fraxtal Factory Addresses
export const FRAXTAL_FACTORIES = {
  fraxswap: '0x43eC799eAdd63848443E2347C49f5f52e8Fe0F6f', // Fraxswap Factory
  raExchange: '0xAAA20D08e59F6561f242b08513D36266C5A29415', // Ra Exchange Factory
} as const;

// Common Fraxtal Tokens
export const FRAXTAL_TOKENS = {
  frxETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native frxETH
  wfrxETH: '0xFC00000000000000000000000000000000000006', // Wrapped frxETH
  FRAX: '0xFc00000000000000000000000000000000000001', // FRAX stablecoin
  sFRAX: '0xFc00000000000000000000000000000000000008', // Staked FRAX
  FXS: '0xFc00000000000000000000000000000000000002', // Frax Share
  sfrxETH: '0xFC00000000000000000000000000000000000005', // Staked frxETH
  USDC: '0xDcc0F2D8F90FDe85b10aC1c8Ab57dc0AE946A543', // USDC
  USDT: '0x0000000000000000000000000000000000000000', // USDT (TBD)
  WBTC: '0x0000000000000000000000000000000000000000', // WBTC (TBD)
};

// Fraxswap API endpoint
const FRAXSWAP_API = 'https://api.frax.finance/v2';

// Fraxswap Router ABI fragments (Uniswap V2 style with TWAMM)
export const FRAXSWAP_ROUTER_ABI = [
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

// Ra Exchange Router ABI fragments (Solidly/ve(3,3) style)
export const RA_EXCHANGE_ROUTER_ABI = [
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
        ],
      },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

export interface FraxtalQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Fraxswap
 */
export async function getFraxswapQuote(
  request: SwapRequest
): Promise<FraxtalQuote | null> {
  if (request.chainId !== 'fraxtal') {
    return null;
  }

  try {
    const quoteResponse = await fetch(`${FRAXSWAP_API}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: FRAXTAL_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountIn: request.amountIn.toString(),
        slippage: request.slippage,
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'fraxswap',
          poolAddress: data.route?.[0]?.pool || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || FRAXTAL_ROUTERS.fraxswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Ra Exchange
 */
export async function getRaExchangeQuote(
  request: SwapRequest
): Promise<FraxtalQuote | null> {
  if (request.chainId !== 'fraxtal') {
    return null;
  }

  try {
    const params = new URLSearchParams({
      chainId: FRAXTAL_CHAIN_ID.toString(),
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountIn: request.amountIn.toString(),
    });

    const quoteResponse = await fetch(
      `https://api.ra.exchange/v1/quote?${params}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      if (data.amountOut) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder
          amountOut: BigInt(data.amountOut),
          estimatedGas: BigInt(data.estimatedGas || '200000'),
          priceImpact: parseFloat(data.priceImpact || '0'),
          route: [{
            dex: 'ra-exchange',
            poolAddress: data.route?.[0]?.pool || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: data.tx?.data || '0x',
          txTo: data.tx?.to || FRAXTAL_ROUTERS.raExchange,
          txValue: BigInt(data.tx?.value || '0'),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Fraxtal
 */
export async function getFraxtalBestQuote(
  request: SwapRequest
): Promise<FraxtalQuote | null> {
  if (request.chainId !== 'fraxtal') {
    return null;
  }

  const quotes = await Promise.all([
    getFraxswapQuote(request),
    getRaExchangeQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is FraxtalQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Fraxtal
 */
export function buildFraxtalSwapTransaction(
  quote: FraxtalQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || FRAXTAL_ROUTERS.fraxswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Fraxtal
 */
export function getFraxtalDexes(): string[] {
  return ['fraxswap', 'ra-exchange'];
}

/**
 * Check if chain is Fraxtal
 */
export function isFraxtalChain(chainId: string): boolean {
  return chainId === 'fraxtal';
}

/**
 * Get Fraxtal chain ID
 */
export function getFraxtalChainId(): number {
  return FRAXTAL_CHAIN_ID;
}

/**
 * Get popular trading pairs on Fraxtal
 */
export function getFraxtalPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: FRAXTAL_TOKENS.frxETH, tokenOut: FRAXTAL_TOKENS.FRAX, name: 'frxETH/FRAX' },
    { tokenIn: FRAXTAL_TOKENS.wfrxETH, tokenOut: FRAXTAL_TOKENS.FRAX, name: 'wfrxETH/FRAX' },
    { tokenIn: FRAXTAL_TOKENS.frxETH, tokenOut: FRAXTAL_TOKENS.USDC, name: 'frxETH/USDC' },
    { tokenIn: FRAXTAL_TOKENS.FRAX, tokenOut: FRAXTAL_TOKENS.USDC, name: 'FRAX/USDC' },
    { tokenIn: FRAXTAL_TOKENS.FXS, tokenOut: FRAXTAL_TOKENS.FRAX, name: 'FXS/FRAX' },
    { tokenIn: FRAXTAL_TOKENS.sfrxETH, tokenOut: FRAXTAL_TOKENS.frxETH, name: 'sfrxETH/frxETH' },
  ];
}
