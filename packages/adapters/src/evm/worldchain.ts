/**
 * World Chain DEX Integrations
 *
 * World Chain is Worldcoin's OP Stack L2, focused on identity
 * and human verification. Uses ETH as native gas token.
 *
 * Native DEXes:
 * - Uniswap V3 - Primary DEX
 * - WorldSwap - Native World Chain DEX
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// World Chain ID
export const WORLDCHAIN_CHAIN_ID = 480;

// World Chain DEX Router Addresses
export const WORLDCHAIN_ROUTERS = {
  uniswapV3: '0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6', // Uniswap V3 SwapRouter
  worldswap: '0x0000000000000000000000000000000000000000', // WorldSwap Router (TBD)
} as const;

// World Chain Factory Addresses
export const WORLDCHAIN_FACTORIES = {
  uniswapV3: '0x7a5028BDa40e7B173C278C5342087826455ea25a', // Uniswap V3 Factory
} as const;

// Common World Chain Tokens
export const WORLDCHAIN_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH (OP Stack)
  WLD: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003', // Worldcoin token
  USDC: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1', // USDC.e
  USDT: '0x0000000000000000000000000000000000000000', // USDT (TBD)
  DAI: '0x0000000000000000000000000000000000000000', // DAI (TBD)
};

// Uniswap V3 Router ABI
export const WORLDCHAIN_UNISWAP_V3_ROUTER_ABI = [
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
  {
    name: 'exactOutputSingle',
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
        { name: 'amountOut', type: 'uint256' },
        { name: 'amountInMaximum', type: 'uint256' },
        { name: 'sqrtPriceLimitX96', type: 'uint160' },
      ],
    }],
    outputs: [{ name: 'amountIn', type: 'uint256' }],
  },
] as const;

// WorldSwap Router ABI (Uniswap V2 style placeholder)
export const WORLDSWAP_ROUTER_ABI = [
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

export interface WorldChainQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Uniswap V3 on World Chain
 */
export async function getUniswapWorldChainQuote(
  request: SwapRequest
): Promise<WorldChainQuote | null> {
  if (request.chainId !== 'worldchain') {
    return null;
  }

  try {
    // Use Uniswap's routing API
    const quoteResponse = await fetch('https://api.uniswap.org/v2/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenInChainId: WORLDCHAIN_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOutChainId: WORLDCHAIN_CHAIN_ID,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        type: 'EXACT_INPUT',
        configs: [{
          protocols: ['V3'],
          routingType: 'CLASSIC',
        }],
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder for 'uniswap'
        amountOut: BigInt(data.quote || '0'),
        estimatedGas: BigInt(data.gasEstimate || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'uniswap_v3',
          poolAddress: data.route?.[0]?.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.methodParameters?.calldata || '0x',
        txTo: data.methodParameters?.to || WORLDCHAIN_ROUTERS.uniswapV3,
        txValue: BigInt(data.methodParameters?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from WorldSwap
 */
export async function getWorldSwapQuote(
  request: SwapRequest
): Promise<WorldChainQuote | null> {
  if (request.chainId !== 'worldchain') {
    return null;
  }

  try {
    // WorldSwap API placeholder
    const quoteResponse = await fetch('https://api.worldswap.io/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: WORLDCHAIN_CHAIN_ID,
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
        estimatedGas: BigInt(data.estimatedGas || '140000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'worldswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || WORLDCHAIN_ROUTERS.worldswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for World Chain
 */
export async function getWorldChainBestQuote(
  request: SwapRequest
): Promise<WorldChainQuote | null> {
  if (request.chainId !== 'worldchain') {
    return null;
  }

  const quotes = await Promise.all([
    getUniswapWorldChainQuote(request),
    getWorldSwapQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is WorldChainQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for World Chain
 */
export function buildWorldChainSwapTransaction(
  quote: WorldChainQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || WORLDCHAIN_ROUTERS.uniswapV3,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on World Chain
 */
export function getWorldChainDexes(): string[] {
  return ['uniswap_v3', 'worldswap'];
}

/**
 * Check if chain is World Chain
 */
export function isWorldChain(chainId: string): boolean {
  return chainId === 'worldchain';
}

/**
 * Get World Chain ID
 */
export function getWorldChainId(): number {
  return WORLDCHAIN_CHAIN_ID;
}

/**
 * Get Uniswap V3 fee tiers
 */
export function getWorldChainFeeTiers(): number[] {
  return [100, 500, 3000, 10000]; // 0.01%, 0.05%, 0.3%, 1%
}

/**
 * Get popular trading pairs on World Chain
 */
export function getWorldChainPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: WORLDCHAIN_TOKENS.ETH, tokenOut: WORLDCHAIN_TOKENS.WLD, name: 'ETH/WLD' },
    { tokenIn: WORLDCHAIN_TOKENS.WETH, tokenOut: WORLDCHAIN_TOKENS.WLD, name: 'WETH/WLD' },
    { tokenIn: WORLDCHAIN_TOKENS.ETH, tokenOut: WORLDCHAIN_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: WORLDCHAIN_TOKENS.WLD, tokenOut: WORLDCHAIN_TOKENS.USDC, name: 'WLD/USDC' },
  ];
}
