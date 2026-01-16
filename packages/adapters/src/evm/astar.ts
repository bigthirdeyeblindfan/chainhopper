/**
 * Astar Chain DEX Integrations
 *
 * Astar is a Polkadot parachain with EVM compatibility, supporting
 * both EVM and WASM smart contracts. Uses ASTR as native gas token.
 *
 * Native DEXes:
 * - ArthSwap - Primary DEX (Uniswap V2 fork)
 * - SiriusFinance - Stablecoin DEX (Curve fork)
 * - Zenlink - Cross-chain DEX aggregator
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Astar Chain ID
export const ASTAR_CHAIN_ID = 592;

// Astar DEX Router Addresses
export const ASTAR_ROUTERS = {
  arthswap: '0xE915D2393a08a00c5A463053edD31bAe2199b9e7', // ArthSwap Router
  sirius: '0x417E9d065ee22DFB7CC6C63C403600E27627F333', // SiriusFinance Router
  zenlink: '0x0000000000000000000000000000000000000000', // Zenlink (TBD)
} as const;

// Astar Factory Addresses
export const ASTAR_FACTORIES = {
  arthswap: '0xA9473608514457b4bF083f9045fA63ae5810A03E', // ArthSwap Factory
} as const;

// Common Astar Tokens
export const ASTAR_TOKENS = {
  ASTR: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ASTR
  WASTR: '0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720', // Wrapped ASTR
  USDC: '0x6a2d262D56735DbA19Dd70682B39F6bE9a931D98', // USDC
  USDT: '0x3795C36e7D12A8c252A20C5a7B455f7c57b60283', // USDT
  DAI: '0x6De33698e9e9b787e09d3Bd7771ef63557E148bb', // DAI
  WETH: '0x81ECac0D6Be0550A00FF064a4f9dd2400585FE9c', // Wrapped ETH
  WBTC: '0xad543f18cFf85c77E140E3E5E3c3392f6Ba9d01D', // Wrapped BTC
  DOT: '0xFFfFfFffFFfffFFfFFfFFFFFffFFFffffFfFFFfF', // Polkadot DOT
};

// ArthSwap API endpoint
const ARTHSWAP_API = 'https://api.arthswap.org/v1';

// ArthSwap Router ABI (Uniswap V2 style)
export const ARTHSWAP_ROUTER_ABI = [
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

// SiriusFinance ABI (Curve-style)
export const SIRIUS_ROUTER_ABI = [
  {
    name: 'exchange',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'pool', type: 'address' },
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
      { name: 'expected', type: 'uint256' },
    ],
    outputs: [{ name: 'received', type: 'uint256' }],
  },
  {
    name: 'get_best_rate',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [
      { name: 'pool', type: 'address' },
      { name: 'expected', type: 'uint256' },
    ],
  },
] as const;

export interface AstarQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from ArthSwap
 */
export async function getArthSwapQuote(
  request: SwapRequest
): Promise<AstarQuote | null> {
  if (request.chainId !== 'astar') {
    return null;
  }

  try {
    // Try ArthSwap API for quote
    const quoteResponse = await fetch(`${ARTHSWAP_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder for 'arthswap'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'arthswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || ASTAR_ROUTERS.arthswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from SiriusFinance (stablecoins)
 */
export async function getSiriusQuote(
  request: SwapRequest
): Promise<AstarQuote | null> {
  if (request.chainId !== 'astar') {
    return null;
  }

  try {
    // SiriusFinance is optimized for stablecoin swaps
    const quoteResponse = await fetch('https://api.sirius.finance/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: ASTAR_CHAIN_ID,
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
          dex: 'sirius',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || ASTAR_ROUTERS.sirius,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Astar chain
 */
export async function getAstarBestQuote(
  request: SwapRequest
): Promise<AstarQuote | null> {
  if (request.chainId !== 'astar') {
    return null;
  }

  const quotes = await Promise.all([
    getArthSwapQuote(request),
    getSiriusQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is AstarQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Astar
 */
export function buildAstarSwapTransaction(
  quote: AstarQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || ASTAR_ROUTERS.arthswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Astar
 */
export function getAstarDexes(): string[] {
  return ['arthswap', 'sirius', 'zenlink'];
}

/**
 * Check if chain is Astar
 */
export function isAstarChain(chainId: string): boolean {
  return chainId === 'astar';
}

/**
 * Get Astar chain ID
 */
export function getAstarChainId(): number {
  return ASTAR_CHAIN_ID;
}

/**
 * Get popular trading pairs on Astar
 */
export function getAstarPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: ASTAR_TOKENS.ASTR, tokenOut: ASTAR_TOKENS.USDC, name: 'ASTR/USDC' },
    { tokenIn: ASTAR_TOKENS.WASTR, tokenOut: ASTAR_TOKENS.USDC, name: 'WASTR/USDC' },
    { tokenIn: ASTAR_TOKENS.ASTR, tokenOut: ASTAR_TOKENS.USDT, name: 'ASTR/USDT' },
    { tokenIn: ASTAR_TOKENS.USDC, tokenOut: ASTAR_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: ASTAR_TOKENS.WETH, tokenOut: ASTAR_TOKENS.ASTR, name: 'WETH/ASTR' },
    { tokenIn: ASTAR_TOKENS.DOT, tokenOut: ASTAR_TOKENS.ASTR, name: 'DOT/ASTR' },
  ];
}
