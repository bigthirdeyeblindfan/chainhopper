/**
 * X Layer Chain DEX Integrations
 *
 * X Layer is OKX's zkEVM-based L2 built using Polygon CDK.
 * Uses OKB as the native gas token.
 *
 * Native DEXes:
 * - XSwap - Primary DEX on X Layer (Uniswap V3 fork)
 * - OKX DEX Aggregator - Cross-chain aggregation
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// X Layer Chain ID
export const XLAYER_CHAIN_ID = 196;

// X Layer DEX Router Addresses
export const XLAYER_ROUTERS = {
  xswap: '0x5E6C2818E86A1F2d8e3d4C0f7d3F7e3C6b3A5c8D', // XSwap Router (placeholder)
  uniswapV3: '0x0000000000000000000000000000000000000000', // Uniswap V3 (if deployed)
} as const;

// X Layer Factory Addresses
export const XLAYER_FACTORIES = {
  xswap: '0x3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F0A1B2C', // XSwap Factory (placeholder)
} as const;

// Common X Layer Tokens
export const XLAYER_TOKENS = {
  OKB: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native OKB
  WOKB: '0xe538905cf8410324e03A5A23C1c177a474D59b2b', // Wrapped OKB
  USDT: '0x1E4a5963aBFD975d8c9021ce480b42188849D41d', // USDT on X Layer
  USDC: '0x74b7F16337b8972027F6196A17a631aC6dE26d22', // USDC on X Layer
  WETH: '0x5A77f1443D16ee5761d310e38b62f77f726bC71c', // Wrapped ETH
  WBTC: '0xEA034fb02eB1808C2cc3adbC15f447B93CbE08e1', // Wrapped BTC
};

// XSwap API endpoint
const XSWAP_API = 'https://www.okx.com/api/v5/dex/aggregator';

// XSwap Router ABI fragments (Uniswap V2/V3 style)
export const XSWAP_ROUTER_ABI = [
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

export interface XLayerQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from XSwap (OKX DEX Aggregator)
 */
export async function getXSwapQuote(
  request: SwapRequest
): Promise<XLayerQuote | null> {
  if (request.chainId !== 'xlayer') {
    return null;
  }

  try {
    // OKX DEX Aggregator API
    const params = new URLSearchParams({
      chainId: XLAYER_CHAIN_ID.toString(),
      fromTokenAddress: request.tokenIn,
      toTokenAddress: request.tokenOut,
      amount: request.amountIn.toString(),
      slippage: (request.slippage / 100).toString(),
    });

    const quoteResponse = await fetch(`${XSWAP_API}/quote?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();

      if (data.code === '0' && data.data?.[0]) {
        const quote = data.data[0];
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder, would be 'xswap'
          amountOut: BigInt(quote.toTokenAmount || '0'),
          estimatedGas: BigInt(quote.estimateGasFee || '150000'),
          priceImpact: parseFloat(quote.priceImpact || '0'),
          route: [{
            dex: 'xswap',
            poolAddress: quote.routerResult?.routes?.[0]?.subRoutes?.[0]?.dexProtocol || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: quote.tx?.data || '0x',
          txTo: quote.tx?.to || XLAYER_ROUTERS.xswap,
          txValue: BigInt(quote.tx?.value || '0'),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote using direct router call (fallback)
 */
export async function getXLayerDirectQuote(
  request: SwapRequest
): Promise<XLayerQuote | null> {
  if (request.chainId !== 'xlayer') {
    return null;
  }

  // For direct quotes, we would need to call the router contract
  // This is a fallback when the API is unavailable
  // In production, this would use viem to call getAmountsOut
  return null;
}

/**
 * Get best quote for X Layer chain
 */
export async function getXLayerBestQuote(
  request: SwapRequest
): Promise<XLayerQuote | null> {
  if (request.chainId !== 'xlayer') {
    return null;
  }

  const quotes = await Promise.all([
    getXSwapQuote(request),
    getXLayerDirectQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is XLayerQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for X Layer
 */
export function buildXLayerSwapTransaction(
  quote: XLayerQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || XLAYER_ROUTERS.xswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on X Layer
 */
export function getXLayerDexes(): string[] {
  return ['xswap', 'okx-dex'];
}

/**
 * Check if chain is X Layer
 */
export function isXLayerChain(chainId: string): boolean {
  return chainId === 'xlayer';
}

/**
 * Get X Layer chain ID
 */
export function getXLayerChainId(): number {
  return XLAYER_CHAIN_ID;
}

/**
 * Get popular trading pairs on X Layer
 */
export function getXLayerPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: XLAYER_TOKENS.OKB, tokenOut: XLAYER_TOKENS.USDT, name: 'OKB/USDT' },
    { tokenIn: XLAYER_TOKENS.WOKB, tokenOut: XLAYER_TOKENS.USDT, name: 'WOKB/USDT' },
    { tokenIn: XLAYER_TOKENS.OKB, tokenOut: XLAYER_TOKENS.USDC, name: 'OKB/USDC' },
    { tokenIn: XLAYER_TOKENS.WETH, tokenOut: XLAYER_TOKENS.USDT, name: 'WETH/USDT' },
    { tokenIn: XLAYER_TOKENS.WBTC, tokenOut: XLAYER_TOKENS.USDT, name: 'WBTC/USDT' },
    { tokenIn: XLAYER_TOKENS.USDC, tokenOut: XLAYER_TOKENS.USDT, name: 'USDC/USDT' },
  ];
}
