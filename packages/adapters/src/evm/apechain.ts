/**
 * ApeChain DEX Integrations
 *
 * ApeChain is an Arbitrum Orbit L3 chain launched by ApeCoin DAO.
 * Uses APE (ApeCoin) as the native gas token.
 *
 * Native DEXes:
 * - Ape Portal - Primary DEX on ApeChain (Camelot-style)
 * - Camelot (deployed on ApeChain)
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// ApeChain Chain ID
export const APECHAIN_CHAIN_ID = 33139;

// ApeChain DEX Router Addresses
export const APECHAIN_ROUTERS = {
  apePortal: '0x1234567890123456789012345678901234567890', // Ape Portal Router (placeholder)
  camelot: '0xc873fEcbd354f5A56E00E710B90EF4201db2448d', // Camelot Router
} as const;

// ApeChain Factory Addresses
export const APECHAIN_FACTORIES = {
  apePortal: '0x2345678901234567890123456789012345678901', // Ape Portal Factory (placeholder)
  camelot: '0x6EcCab422D763aC031210895C81787E87B43A652', // Camelot Factory
} as const;

// Common ApeChain Tokens
export const APECHAIN_TOKENS = {
  APE: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native APE
  WAPE: '0x48b62137EdfA95a428D35C09E44256a739F6B557', // Wrapped APE
  USDC: '0x0000000000000000000000000000000000000000', // USDC (TBD)
  USDT: '0x0000000000000000000000000000000000000000', // USDT (TBD)
  WETH: '0x0000000000000000000000000000000000000000', // Wrapped ETH (TBD)
  DAI: '0x0000000000000000000000000000000000000000', // DAI (TBD)
};

// Ape Portal API endpoint
const APE_PORTAL_API = 'https://api.apeportal.xyz/v1';

// Ape Portal Router ABI fragments (Camelot/Uniswap V2 style)
export const APE_PORTAL_ROUTER_ABI = [
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

export interface ApeChainQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Ape Portal DEX
 */
export async function getApePortalQuote(
  request: SwapRequest
): Promise<ApeChainQuote | null> {
  if (request.chainId !== 'apechain') {
    return null;
  }

  try {
    const quoteResponse = await fetch(`${APE_PORTAL_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'ape-portal',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || APECHAIN_ROUTERS.apePortal,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Camelot DEX on ApeChain
 */
export async function getCamelotApeChainQuote(
  request: SwapRequest
): Promise<ApeChainQuote | null> {
  if (request.chainId !== 'apechain') {
    return null;
  }

  try {
    // Camelot API for ApeChain
    const params = new URLSearchParams({
      chainId: APECHAIN_CHAIN_ID.toString(),
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amount: request.amountIn.toString(),
    });

    const quoteResponse = await fetch(
      `https://api.camelot.exchange/v1/quote?${params}`,
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
            dex: 'camelot',
            poolAddress: data.route?.[0]?.pool || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: data.tx?.data || '0x',
          txTo: data.tx?.to || APECHAIN_ROUTERS.camelot,
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
 * Get best quote for ApeChain
 */
export async function getApeChainBestQuote(
  request: SwapRequest
): Promise<ApeChainQuote | null> {
  if (request.chainId !== 'apechain') {
    return null;
  }

  const quotes = await Promise.all([
    getApePortalQuote(request),
    getCamelotApeChainQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is ApeChainQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for ApeChain
 */
export function buildApeChainSwapTransaction(
  quote: ApeChainQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || APECHAIN_ROUTERS.apePortal,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on ApeChain
 */
export function getApeChainDexes(): string[] {
  return ['ape-portal', 'camelot'];
}

/**
 * Check if chain is ApeChain
 */
export function isApeChain(chainId: string): boolean {
  return chainId === 'apechain';
}

/**
 * Get ApeChain chain ID
 */
export function getApeChainId(): number {
  return APECHAIN_CHAIN_ID;
}

/**
 * Get popular trading pairs on ApeChain
 */
export function getApeChainPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: APECHAIN_TOKENS.APE, tokenOut: APECHAIN_TOKENS.USDC, name: 'APE/USDC' },
    { tokenIn: APECHAIN_TOKENS.WAPE, tokenOut: APECHAIN_TOKENS.USDC, name: 'WAPE/USDC' },
    { tokenIn: APECHAIN_TOKENS.APE, tokenOut: APECHAIN_TOKENS.WETH, name: 'APE/WETH' },
    { tokenIn: APECHAIN_TOKENS.WETH, tokenOut: APECHAIN_TOKENS.USDC, name: 'WETH/USDC' },
  ];
}
