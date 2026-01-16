/**
 * Linea Chain DEX Integrations
 *
 * Linea is a zkEVM Layer 2 developed by Consensys.
 * Uses ETH as the native gas token.
 *
 * Native DEXes:
 * - Lynex - Primary ve(3,3) DEX on Linea (Solidly/Velodrome fork)
 * - SyncSwap - Multi-chain DEX also on Linea
 * - Horizon DEX - Another DEX option
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// Linea Chain ID
export const LINEA_CHAIN_ID = 59144;

// Linea DEX Router Addresses
export const LINEA_ROUTERS = {
  lynex: '0x610D2f07b7EdC67565160F587F37636194C34E74', // Lynex Router
  syncswap: '0x80e38291e06339d10AAB483C65695D004dBD5C69', // SyncSwap Router
  horizondex: '0x272E156Df8DA513C69cB41cC7A99185D53F926Bb', // Horizon DEX Router
} as const;

// Linea Factory Addresses
export const LINEA_FACTORIES = {
  lynex: '0xBc7695Fd00E3b32D08124b7a4287493aEE99f9ee', // Lynex Factory
  syncswap: '0x37BAc764494c8db4e54BDE72f6965beA9fa0AC2d', // SyncSwap Classic Factory
} as const;

// Common Linea Tokens
export const LINEA_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f', // Wrapped ETH
  USDC: '0x176211869cA2b568f2A7D4EE941E073a821EE1ff', // USDC
  USDT: '0xA219439258ca9da29E9Cc4cE5596924745e12B93', // USDT
  DAI: '0x4AF15ec2A0BD43Db75dd04E62FAA3B8EF36b00d5', // DAI
  WBTC: '0x3aAB2285ddcDdaD8edf438C1bAB47e1a9D05a9b4', // Wrapped BTC
  LYNX: '0x1a51b19CE03dbE0Cb44C1528E34a7EDD7771E9Af', // Lynex token
};

// Lynex API endpoint
const LYNEX_API = 'https://api.lynex.fi/api/v1';

// Lynex Router ABI fragments (Solidly/Velodrome style)
export const LYNEX_ROUTER_ABI = [
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
        ],
      },
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
        ],
      },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

// SyncSwap Router ABI fragments
export const LINEA_SYNCSWAP_ROUTER_ABI = [
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
] as const;

export interface LineaQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Lynex DEX
 */
export async function getLynexQuote(
  request: SwapRequest
): Promise<LineaQuote | null> {
  if (request.chainId !== 'linea') {
    return null;
  }

  try {
    const quoteResponse = await fetch(`${LYNEX_API}/quote`, {
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
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'lynex',
          poolAddress: data.route?.[0]?.pool || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || LINEA_ROUTERS.lynex,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from SyncSwap on Linea
 */
export async function getSyncSwapLineaQuote(
  request: SwapRequest
): Promise<LineaQuote | null> {
  if (request.chainId !== 'linea') {
    return null;
  }

  try {
    const params = new URLSearchParams({
      chainId: LINEA_CHAIN_ID.toString(),
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountIn: request.amountIn.toString(),
    });

    const quoteResponse = await fetch(
      `https://api.syncswap.xyz/api/v1/quote?${params}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      if (data.amountOut) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder
          amountOut: BigInt(data.amountOut),
          estimatedGas: BigInt(data.estimatedGas || '250000'),
          priceImpact: parseFloat(data.priceImpact || '0'),
          route: [{
            dex: 'syncswap',
            poolAddress: data.route?.[0]?.pool || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: data.tx?.data || '0x',
          txTo: data.tx?.to || LINEA_ROUTERS.syncswap,
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
 * Get best quote for Linea chain
 */
export async function getLineaBestQuote(
  request: SwapRequest
): Promise<LineaQuote | null> {
  if (request.chainId !== 'linea') {
    return null;
  }

  const quotes = await Promise.all([
    getLynexQuote(request),
    getSyncSwapLineaQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is LineaQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Linea
 */
export function buildLineaSwapTransaction(
  quote: LineaQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || LINEA_ROUTERS.lynex,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Linea
 */
export function getLineaDexes(): string[] {
  return ['lynex', 'syncswap', 'horizondex'];
}

/**
 * Check if chain is Linea
 */
export function isLineaChain(chainId: string): boolean {
  return chainId === 'linea';
}

/**
 * Get Linea chain ID
 */
export function getLineaChainId(): number {
  return LINEA_CHAIN_ID;
}

/**
 * Get popular trading pairs on Linea
 */
export function getLineaPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: LINEA_TOKENS.ETH, tokenOut: LINEA_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: LINEA_TOKENS.WETH, tokenOut: LINEA_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: LINEA_TOKENS.ETH, tokenOut: LINEA_TOKENS.USDT, name: 'ETH/USDT' },
    { tokenIn: LINEA_TOKENS.WBTC, tokenOut: LINEA_TOKENS.WETH, name: 'WBTC/WETH' },
    { tokenIn: LINEA_TOKENS.USDC, tokenOut: LINEA_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: LINEA_TOKENS.LYNX, tokenOut: LINEA_TOKENS.WETH, name: 'LYNX/WETH' },
  ];
}
