/**
 * Unichain DEX Integrations
 *
 * Unichain is Uniswap's own OP Stack L2, designed for DeFi.
 * Uses ETH as the native gas token.
 *
 * Native DEXes:
 * - Uniswap V4 - Native deployment with hooks support
 * - Uniswap V3 - Also deployed on Unichain
 * - Uniswap Universal Router - Unified routing
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// Unichain Chain ID
export const UNICHAIN_CHAIN_ID = 130;

// Unichain DEX Router Addresses
export const UNICHAIN_ROUTERS = {
  universalRouter: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Universal Router
  swapRouter02: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45', // SwapRouter02 (V3)
  v4Router: '0x0000000000000000000000000000000000000000', // V4 Router (TBD)
} as const;

// Unichain Factory Addresses
export const UNICHAIN_FACTORIES = {
  v3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // V3 Factory
  v4PoolManager: '0x0000000000000000000000000000000000000000', // V4 Pool Manager (TBD)
} as const;

// Common Unichain Tokens
export const UNICHAIN_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH (OP Stack)
  USDC: '0x078D782b760474a361dDA0AF3839290b0EF57AD6', // USDC
  USDT: '0x588CE4F028D8e7B53B687865d6A67b3A54C75518', // USDT
  DAI: '0x20CAb320A855b39F724131C69424240519573f81', // DAI
  WBTC: '0x927BfA6a4F4A0F23Bf4057E1B4B65c8E5E101E72', // Wrapped BTC
  UNI: '0x8f187aA05619a017077f5308904739877600DE17', // UNI token
};

// Uniswap API endpoint
const UNISWAP_API = 'https://api.uniswap.org/v2';

// Uniswap V3 SwapRouter02 ABI fragments
export const UNICHAIN_SWAP_ROUTER_ABI = [
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
          { name: 'amountIn', type: 'uint256' },
          { name: 'amountOutMinimum', type: 'uint256' },
        ],
      },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'exactOutputSingle',
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
          { name: 'amountOut', type: 'uint256' },
          { name: 'amountInMaximum', type: 'uint256' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [{ name: 'amountIn', type: 'uint256' }],
  },
] as const;

// Universal Router ABI fragments
export const UNIVERSAL_ROUTER_ABI = [
  {
    name: 'execute',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'commands', type: 'bytes' },
      { name: 'inputs', type: 'bytes[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export interface UnichainQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Uniswap on Unichain
 */
export async function getUniswapUnichainQuote(
  request: SwapRequest
): Promise<UnichainQuote | null> {
  if (request.chainId !== 'unichain') {
    return null;
  }

  try {
    const quoteResponse = await fetch(`${UNISWAP_API}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenInChainId: UNICHAIN_CHAIN_ID,
        tokenOutChainId: UNICHAIN_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        type: 'EXACT_INPUT',
        slippageTolerance: request.slippage,
        protocols: ['V3', 'V4'],
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder
        amountOut: BigInt(data.quote || '0'),
        estimatedGas: BigInt(data.gasUseEstimate || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'uniswap',
          poolAddress: data.route?.[0]?.[0]?.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.methodParameters?.calldata || '0x',
        txTo: data.methodParameters?.to || UNICHAIN_ROUTERS.universalRouter,
        txValue: BigInt(data.methodParameters?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Uniswap V3 directly
 */
export async function getUniswapV3UnichainQuote(
  request: SwapRequest
): Promise<UnichainQuote | null> {
  if (request.chainId !== 'unichain') {
    return null;
  }

  try {
    // Direct V3 quoter call would go here
    // For now, fallback to API
    const params = new URLSearchParams({
      chainId: UNICHAIN_CHAIN_ID.toString(),
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amount: request.amountIn.toString(),
      type: 'exactIn',
    });

    const quoteResponse = await fetch(
      `https://interface.gateway.uniswap.org/v2/quote?${params}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      if (data.quote) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder
          amountOut: BigInt(data.quote),
          estimatedGas: BigInt(data.gasUseEstimate || '180000'),
          priceImpact: parseFloat(data.priceImpact || '0'),
          route: [{
            dex: 'uniswap-v3',
            poolAddress: data.route?.[0]?.poolAddress || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: data.methodParameters?.calldata || '0x',
          txTo: data.methodParameters?.to || UNICHAIN_ROUTERS.swapRouter02,
          txValue: BigInt(data.methodParameters?.value || '0'),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Unichain
 */
export async function getUnichainBestQuote(
  request: SwapRequest
): Promise<UnichainQuote | null> {
  if (request.chainId !== 'unichain') {
    return null;
  }

  const quotes = await Promise.all([
    getUniswapUnichainQuote(request),
    getUniswapV3UnichainQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is UnichainQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Unichain
 */
export function buildUnichainSwapTransaction(
  quote: UnichainQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || UNICHAIN_ROUTERS.universalRouter,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Unichain
 */
export function getUnichainDexes(): string[] {
  return ['uniswap-v4', 'uniswap-v3'];
}

/**
 * Check if chain is Unichain
 */
export function isUnichainChain(chainId: string): boolean {
  return chainId === 'unichain';
}

/**
 * Get Unichain chain ID
 */
export function getUnichainChainId(): number {
  return UNICHAIN_CHAIN_ID;
}

/**
 * Get Uniswap V3 fee tiers
 */
export function getUnichainFeeTiers(): number[] {
  return [100, 500, 3000, 10000]; // 0.01%, 0.05%, 0.3%, 1%
}

/**
 * Get popular trading pairs on Unichain
 */
export function getUnichainPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: UNICHAIN_TOKENS.ETH, tokenOut: UNICHAIN_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: UNICHAIN_TOKENS.WETH, tokenOut: UNICHAIN_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: UNICHAIN_TOKENS.ETH, tokenOut: UNICHAIN_TOKENS.USDT, name: 'ETH/USDT' },
    { tokenIn: UNICHAIN_TOKENS.UNI, tokenOut: UNICHAIN_TOKENS.WETH, name: 'UNI/WETH' },
    { tokenIn: UNICHAIN_TOKENS.WBTC, tokenOut: UNICHAIN_TOKENS.WETH, name: 'WBTC/WETH' },
    { tokenIn: UNICHAIN_TOKENS.USDC, tokenOut: UNICHAIN_TOKENS.USDT, name: 'USDC/USDT' },
  ];
}
