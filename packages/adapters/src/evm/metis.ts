/**
 * Metis Chain DEX Integrations
 *
 * Metis is an Ethereum L2 Rollup focusing on low-cost transactions
 * and enterprise solutions. Uses METIS as native gas token.
 *
 * Native DEXes:
 * - Netswap - Primary DEX (Uniswap V2 fork)
 * - Tethys Finance - Popular V2/V3 DEX
 * - Hummus Exchange - Stablecoin DEX (Platypus fork)
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Metis Chain ID
export const METIS_CHAIN_ID = 1088;

// Metis DEX Router Addresses
export const METIS_ROUTERS = {
  netswap: '0x1E876cCe41B7b844FDe09E38Fa1cf00f213bFf56', // Netswap Router
  tethys: '0x81b9FA50D5f5155Ee17817C21702C3AE4780AD09', // Tethys Router
  hummus: '0x0000000000000000000000000000000000000000', // Hummus Exchange (TBD)
} as const;

// Metis Factory Addresses
export const METIS_FACTORIES = {
  netswap: '0x70f51d68D16e8f9e418441280342BD43AC9Dff9f', // Netswap Factory
  tethys: '0x2CdFB20205701FF01689461610C9F321D1d00F80', // Tethys Factory
} as const;

// Common Metis Tokens
export const METIS_TOKENS = {
  METIS: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native METIS
  WMETIS: '0x75cb093E4D61d2A2e65D8e0BBb01DE8d89b53481', // Wrapped METIS
  USDC: '0xEA32A96608495e54156Ae48931A7c20f0dcc1a21', // m.USDC
  USDT: '0xbB06DCA3AE6887fAbF931640f67cab3e3a16F4dC', // m.USDT
  DAI: '0x4c078361FC9BbB78DF910800A991C7c3DD2F6ce0', // m.DAI
  WETH: '0x420000000000000000000000000000000000000A', // m.WETH
  WBTC: '0xa5B55ab1dAF0F8e1EFc0eB1931a957fd89B918f4', // m.WBTC
  NETT: '0x90fE084F877C65e1b577c7b2eA64B8D8dd1AB278', // Netswap token
};

// Netswap API endpoint
const NETSWAP_API = 'https://api.netswap.io/v1';

// Netswap Router ABI (Uniswap V2 style)
export const NETSWAP_ROUTER_ABI = [
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

// Tethys Router ABI (similar to Uniswap V2)
export const TETHYS_ROUTER_ABI = [
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
    name: 'swapExactMETISForTokens',
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
    name: 'swapExactTokensForMETIS',
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

export interface MetisQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Netswap
 */
export async function getNetswapQuote(
  request: SwapRequest
): Promise<MetisQuote | null> {
  if (request.chainId !== 'metis') {
    return null;
  }

  try {
    // Try Netswap API for quote
    const quoteResponse = await fetch(`${NETSWAP_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder for 'netswap'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'netswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || METIS_ROUTERS.netswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Tethys Finance
 */
export async function getTethysQuote(
  request: SwapRequest
): Promise<MetisQuote | null> {
  if (request.chainId !== 'metis') {
    return null;
  }

  try {
    // Tethys Finance API
    const quoteResponse = await fetch('https://api.tethys.finance/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: METIS_CHAIN_ID,
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
        estimatedGas: BigInt(data.estimatedGas || '160000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'tethys',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || METIS_ROUTERS.tethys,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Metis chain
 */
export async function getMetisBestQuote(
  request: SwapRequest
): Promise<MetisQuote | null> {
  if (request.chainId !== 'metis') {
    return null;
  }

  const quotes = await Promise.all([
    getNetswapQuote(request),
    getTethysQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is MetisQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Metis
 */
export function buildMetisSwapTransaction(
  quote: MetisQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || METIS_ROUTERS.netswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Metis
 */
export function getMetisDexes(): string[] {
  return ['netswap', 'tethys', 'hummus'];
}

/**
 * Check if chain is Metis
 */
export function isMetisChain(chainId: string): boolean {
  return chainId === 'metis';
}

/**
 * Get Metis chain ID
 */
export function getMetisChainId(): number {
  return METIS_CHAIN_ID;
}

/**
 * Get popular trading pairs on Metis
 */
export function getMetisPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: METIS_TOKENS.METIS, tokenOut: METIS_TOKENS.USDC, name: 'METIS/USDC' },
    { tokenIn: METIS_TOKENS.WMETIS, tokenOut: METIS_TOKENS.USDC, name: 'WMETIS/USDC' },
    { tokenIn: METIS_TOKENS.METIS, tokenOut: METIS_TOKENS.USDT, name: 'METIS/USDT' },
    { tokenIn: METIS_TOKENS.WETH, tokenOut: METIS_TOKENS.WMETIS, name: 'WETH/WMETIS' },
    { tokenIn: METIS_TOKENS.USDC, tokenOut: METIS_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: METIS_TOKENS.NETT, tokenOut: METIS_TOKENS.WMETIS, name: 'NETT/WMETIS' },
  ];
}
