/**
 * Manta Pacific Chain DEX Integrations
 *
 * Manta Pacific is a modular L2 built on OP Stack with Celestia DA.
 * Uses ETH as the native gas token.
 *
 * Native DEXes:
 * - ApertureSwap - Primary DEX on Manta Pacific
 * - QuickSwap - Multi-chain DEX deployed on Manta
 * - PacificSwap - Native Manta DEX
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// Manta Pacific Chain ID
export const MANTA_CHAIN_ID = 169;

// Manta Pacific DEX Router Addresses
export const MANTA_ROUTERS = {
  apertureswap: '0x3488d5A2D0281f546e43435715C436b46Ec1C678', // ApertureSwap Router
  quickswap: '0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff', // QuickSwap Router
  pacificswap: '0x1234567890123456789012345678901234567890', // PacificSwap Router (placeholder)
} as const;

// Manta Pacific Factory Addresses
export const MANTA_FACTORIES = {
  apertureswap: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // ApertureSwap Factory
  quickswap: '0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32', // QuickSwap Factory
} as const;

// Common Manta Pacific Tokens
export const MANTA_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x0Dc808adcE2099A9F62AA87D9670745AbA741746', // Wrapped ETH
  USDC: '0xb73603C5d87fA094B7314C74ACE2e64D165016fb', // USDC
  USDT: '0xf417F5A458eC102B90352F697D6e2Ac3A3d2851f', // USDT
  WBTC: '0x305E88d809c9DC03179554BFbf85Ac05Ce8F18d6', // Wrapped BTC
  DAI: '0x1c466b9371f8aBA0D7c458bE10a62192Fcb8Aa71', // DAI
  MANTA: '0x95CeF13441Be50d20cA4558CC0a27B601aC544E5', // MANTA token
  STONE: '0xEc901DA9c68E90798BbBb74c11406A32A70652C3', // StakeStone ETH
};

// ApertureSwap API endpoint
const APERTURESWAP_API = 'https://api.aperture.finance/v1';

// ApertureSwap Router ABI fragments (Uniswap V3 style)
export const APERTURESWAP_ROUTER_ABI = [
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
] as const;

// QuickSwap Router ABI fragments (Uniswap V2 style)
export const MANTA_QUICKSWAP_ROUTER_ABI = [
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

export interface MantaQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from ApertureSwap
 */
export async function getApertureSwapQuote(
  request: SwapRequest
): Promise<MantaQuote | null> {
  if (request.chainId !== 'manta') {
    return null;
  }

  try {
    const quoteResponse = await fetch(`${APERTURESWAP_API}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: MANTA_CHAIN_ID,
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
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'apertureswap',
          poolAddress: data.route?.[0]?.pool || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || MANTA_ROUTERS.apertureswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from QuickSwap on Manta
 */
export async function getQuickSwapMantaQuote(
  request: SwapRequest
): Promise<MantaQuote | null> {
  if (request.chainId !== 'manta') {
    return null;
  }

  try {
    const params = new URLSearchParams({
      chainId: MANTA_CHAIN_ID.toString(),
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountIn: request.amountIn.toString(),
    });

    const quoteResponse = await fetch(
      `https://api.quickswap.exchange/v1/quote?${params}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      if (data.amountOut) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder
          amountOut: BigInt(data.amountOut),
          estimatedGas: BigInt(data.estimatedGas || '180000'),
          priceImpact: parseFloat(data.priceImpact || '0'),
          route: [{
            dex: 'quickswap',
            poolAddress: data.route?.[0]?.pool || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: data.tx?.data || '0x',
          txTo: data.tx?.to || MANTA_ROUTERS.quickswap,
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
 * Get best quote for Manta Pacific
 */
export async function getMantaBestQuote(
  request: SwapRequest
): Promise<MantaQuote | null> {
  if (request.chainId !== 'manta') {
    return null;
  }

  const quotes = await Promise.all([
    getApertureSwapQuote(request),
    getQuickSwapMantaQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is MantaQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Manta Pacific
 */
export function buildMantaSwapTransaction(
  quote: MantaQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || MANTA_ROUTERS.apertureswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Manta Pacific
 */
export function getMantaDexes(): string[] {
  return ['apertureswap', 'quickswap', 'pacificswap'];
}

/**
 * Check if chain is Manta Pacific
 */
export function isMantaChain(chainId: string): boolean {
  return chainId === 'manta';
}

/**
 * Get Manta Pacific chain ID
 */
export function getMantaChainId(): number {
  return MANTA_CHAIN_ID;
}

/**
 * Get popular trading pairs on Manta Pacific
 */
export function getMantaPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: MANTA_TOKENS.ETH, tokenOut: MANTA_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: MANTA_TOKENS.WETH, tokenOut: MANTA_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: MANTA_TOKENS.ETH, tokenOut: MANTA_TOKENS.USDT, name: 'ETH/USDT' },
    { tokenIn: MANTA_TOKENS.STONE, tokenOut: MANTA_TOKENS.WETH, name: 'STONE/WETH' },
    { tokenIn: MANTA_TOKENS.MANTA, tokenOut: MANTA_TOKENS.WETH, name: 'MANTA/WETH' },
    { tokenIn: MANTA_TOKENS.USDC, tokenOut: MANTA_TOKENS.USDT, name: 'USDC/USDT' },
  ];
}
