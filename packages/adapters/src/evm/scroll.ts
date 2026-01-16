/**
 * Scroll Chain DEX Integrations
 *
 * Scroll is a zkEVM Layer 2 scaling solution with native EVM compatibility.
 * Uses zero-knowledge proofs for security and scalability.
 *
 * Native DEXes:
 * - SyncSwap - Primary DEX (Uniswap V2/V3 style)
 * - Ambient (CrocSwap) - Concentrated liquidity DEX
 * - Zebra - Native Scroll DEX
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Scroll Chain ID
export const SCROLL_CHAIN_ID = 534352;

// Scroll DEX Router Addresses
export const SCROLL_ROUTERS = {
  syncswap: '0x80e38291e06339d10AAB483C65695D004dBD5C69', // SyncSwap Router
  ambient: '0xaaaaAAAACB71BF2C8CaE522EA5fa455571A74106', // Ambient/CrocSwap
  zebra: '0x0000000000000000000000000000000000000000', // Zebra Router (TBD)
} as const;

// Scroll Factory Addresses
export const SCROLL_FACTORIES = {
  syncswapClassic: '0x37BAc764494c8db4e54BDE72f6965beA9fa0AC2d', // Classic pools
  syncswapStable: '0xE4CF807E351b56720B17A59094179e7Ed9dD3727', // Stable pools
} as const;

// Common Scroll Tokens
export const SCROLL_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x5300000000000000000000000000000000000004', // Wrapped ETH
  USDC: '0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4', // USDC
  USDT: '0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df', // USDT
  DAI: '0xcA77eB3fEFe3725Dc33bccB54eDEFc3D9f764f97', // DAI
  WBTC: '0x3C1BCa5a656e69edCD0D4E36BEbb3FcDAcA60Cf1', // Wrapped BTC
  SCR: '0xd29687c813D741E2F938F4aC377128810E217b1b', // Scroll Token
};

// SyncSwap API endpoint
const SYNCSWAP_API = 'https://api.syncswap.xyz/api/v1';

// SyncSwap Router ABI fragments
export const SYNCSWAP_ROUTER_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'paths',
        type: 'tuple[]',
        components: [
          {
            name: 'steps',
            type: 'tuple[]',
            components: [
              { name: 'pool', type: 'address' },
              { name: 'data', type: 'bytes' },
              { name: 'callback', type: 'address' },
              { name: 'callbackData', type: 'bytes' },
            ],
          },
          { name: 'tokenIn', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
        ],
      },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'swapWithPermit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'paths',
        type: 'tuple[]',
        components: [
          {
            name: 'steps',
            type: 'tuple[]',
            components: [
              { name: 'pool', type: 'address' },
              { name: 'data', type: 'bytes' },
              { name: 'callback', type: 'address' },
              { name: 'callbackData', type: 'bytes' },
            ],
          },
          { name: 'tokenIn', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
        ],
      },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'permit', type: 'bytes' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

// Ambient (CrocSwap) ABI fragments
export const AMBIENT_ROUTER_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'base', type: 'address' },
      { name: 'quote', type: 'address' },
      { name: 'poolIdx', type: 'uint256' },
      { name: 'isBuy', type: 'bool' },
      { name: 'inBaseQty', type: 'bool' },
      { name: 'qty', type: 'uint128' },
      { name: 'tip', type: 'uint16' },
      { name: 'limitPrice', type: 'uint128' },
      { name: 'minOut', type: 'uint128' },
      { name: 'reserveFlags', type: 'uint8' },
    ],
    outputs: [
      { name: 'baseFlow', type: 'int128' },
      { name: 'quoteFlow', type: 'int128' },
    ],
  },
] as const;

export interface ScrollQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from SyncSwap
 */
export async function getSyncSwapQuote(
  request: SwapRequest
): Promise<ScrollQuote | null> {
  if (request.chainId !== 'scroll') {
    return null;
  }

  try {
    // Try SyncSwap API for quote
    const quoteResponse = await fetch(`${SYNCSWAP_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder for 'syncswap'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '180000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'syncswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || SCROLL_ROUTERS.syncswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Ambient (CrocSwap)
 */
export async function getAmbientQuote(
  request: SwapRequest
): Promise<ScrollQuote | null> {
  if (request.chainId !== 'scroll') {
    return null;
  }

  try {
    // Ambient uses on-chain quotes primarily
    // This is a placeholder for API-based quotes
    const quoteResponse = await fetch('https://ambient.finance/api/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: SCROLL_CHAIN_ID,
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
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'ambient',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || SCROLL_ROUTERS.ambient,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Scroll chain
 */
export async function getScrollBestQuote(
  request: SwapRequest
): Promise<ScrollQuote | null> {
  if (request.chainId !== 'scroll') {
    return null;
  }

  const quotes = await Promise.all([
    getSyncSwapQuote(request),
    getAmbientQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is ScrollQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Scroll
 */
export function buildScrollSwapTransaction(
  quote: ScrollQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || SCROLL_ROUTERS.syncswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Scroll
 */
export function getScrollDexes(): string[] {
  return ['syncswap', 'ambient', 'zebra'];
}

/**
 * Check if chain is Scroll
 */
export function isScrollChain(chainId: string): boolean {
  return chainId === 'scroll';
}

/**
 * Get Scroll chain ID
 */
export function getScrollChainId(): number {
  return SCROLL_CHAIN_ID;
}

/**
 * Get popular trading pairs on Scroll
 */
export function getScrollPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: SCROLL_TOKENS.ETH, tokenOut: SCROLL_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: SCROLL_TOKENS.WETH, tokenOut: SCROLL_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: SCROLL_TOKENS.ETH, tokenOut: SCROLL_TOKENS.USDT, name: 'ETH/USDT' },
    { tokenIn: SCROLL_TOKENS.USDC, tokenOut: SCROLL_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: SCROLL_TOKENS.WBTC, tokenOut: SCROLL_TOKENS.WETH, name: 'WBTC/WETH' },
    { tokenIn: SCROLL_TOKENS.ETH, tokenOut: SCROLL_TOKENS.SCR, name: 'ETH/SCR' },
  ];
}
