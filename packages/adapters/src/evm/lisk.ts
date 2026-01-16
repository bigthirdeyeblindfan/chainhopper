/**
 * Lisk Chain DEX Integrations
 *
 * Lisk is an enterprise-focused OP Stack L2 built on Optimism's
 * technology. Uses ETH as native gas token.
 *
 * Native DEXes:
 * - Velodrome - Primary DEX (ve(3,3) model)
 * - Oku Trade - Uniswap V3 frontend
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Lisk Chain ID
export const LISK_CHAIN_ID = 1135;

// Lisk DEX Router Addresses
export const LISK_ROUTERS = {
  velodrome: '0x0000000000000000000000000000000000000000', // Velodrome Router (TBD)
  oku: '0x0000000000000000000000000000000000000000', // Oku Trade Router (TBD)
  uniswapV3: '0x0000000000000000000000000000000000000000', // Uniswap V3 SwapRouter (TBD)
} as const;

// Lisk Factory Addresses
export const LISK_FACTORIES = {
  velodrome: '0x0000000000000000000000000000000000000000', // Velodrome Factory
  uniswapV3: '0x0000000000000000000000000000000000000000', // Uniswap V3 Factory
} as const;

// Common Lisk Tokens
export const LISK_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH (OP Stack standard)
  LSK: '0xac485391EB2d7D88253a7F1eF18C37f4F81F3A3A', // Lisk token
  USDC: '0xF242275d3a6527d877f2c927a82D9b057609cc71', // USDC
  USDT: '0x05D032ac25d322df992303dCa074EE7392C117b9', // USDT
  DAI: '0x0000000000000000000000000000000000000000', // DAI (TBD)
};

// Velodrome Router ABI (ve(3,3) style)
export const LISK_VELODROME_ROUTER_ABI = [
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

// Uniswap V3 Router ABI
export const LISK_UNISWAP_V3_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
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
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'exactInput',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'path', type: 'bytes' },
        { name: 'recipient', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOutMinimum', type: 'uint256' },
      ],
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

export interface LiskQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Velodrome on Lisk
 */
export async function getVelodromeLiskQuote(
  request: SwapRequest
): Promise<LiskQuote | null> {
  if (request.chainId !== 'lisk') {
    return null;
  }

  try {
    // Velodrome API placeholder
    const quoteResponse = await fetch('https://api.velodrome.finance/lisk/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: LISK_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        slippage: request.slippage,
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder for 'velodrome'
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
        txTo: data.tx?.to || LISK_ROUTERS.velodrome,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Oku Trade (Uniswap V3 frontend) on Lisk
 */
export async function getOkuLiskQuote(
  request: SwapRequest
): Promise<LiskQuote | null> {
  if (request.chainId !== 'lisk') {
    return null;
  }

  try {
    // Oku Trade uses Uniswap's routing
    const quoteResponse = await fetch('https://api.oku.trade/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: LISK_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        type: 'EXACT_INPUT',
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
          dex: 'oku',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || LISK_ROUTERS.uniswapV3,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Lisk chain
 */
export async function getLiskBestQuote(
  request: SwapRequest
): Promise<LiskQuote | null> {
  if (request.chainId !== 'lisk') {
    return null;
  }

  const quotes = await Promise.all([
    getVelodromeLiskQuote(request),
    getOkuLiskQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is LiskQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Lisk
 */
export function buildLiskSwapTransaction(
  quote: LiskQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || LISK_ROUTERS.velodrome,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Lisk
 */
export function getLiskDexes(): string[] {
  return ['velodrome', 'oku'];
}

/**
 * Check if chain is Lisk
 */
export function isLiskChain(chainId: string): boolean {
  return chainId === 'lisk';
}

/**
 * Get Lisk chain ID
 */
export function getLiskChainId(): number {
  return LISK_CHAIN_ID;
}

/**
 * Get popular trading pairs on Lisk
 */
export function getLiskPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: LISK_TOKENS.ETH, tokenOut: LISK_TOKENS.LSK, name: 'ETH/LSK' },
    { tokenIn: LISK_TOKENS.WETH, tokenOut: LISK_TOKENS.LSK, name: 'WETH/LSK' },
    { tokenIn: LISK_TOKENS.ETH, tokenOut: LISK_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: LISK_TOKENS.LSK, tokenOut: LISK_TOKENS.USDC, name: 'LSK/USDC' },
    { tokenIn: LISK_TOKENS.USDC, tokenOut: LISK_TOKENS.USDT, name: 'USDC/USDT' },
  ];
}
