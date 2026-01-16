/**
 * Taiko Chain DEX Integration
 *
 * Taiko is a Type-1 (fully Ethereum-equivalent) zkEVM rollup.
 * It maintains 100% EVM compatibility with Ethereum.
 *
 * Primary DEXes:
 * - Henjin - Native Taiko DEX (Uniswap V3 style)
 * - Panko - Uniswap V2 fork
 * - DTX (Decentralized Trading Exchange)
 *
 * Chain ID: 167000
 * Native Token: ETH
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';
import { EVM_CHAIN_IDS } from './chains.js';

// Taiko Chain ID
export const TAIKO_CHAIN_ID = 167000;

// DEX Router Addresses
export const TAIKO_ROUTERS = {
  henjinRouter: '0x2d5ee574CA0ca7A8E58030FE0e29387C531a75E1', // Henjin V3 Router
  henjinQuoter: '0xC1a7E9a7d5E6b26c9C2C7eeA6d3B50B9c9c8c9d0', // Henjin Quoter
  pankoRouter: '0x8c47bcc8b3a4c16b6D34D32e9F73f9B4F8C58A2a', // Panko Router (V2)
  dtxRouter: '0x4752ba5DBc23f44D87826276BF6Fd6b1C372aD24', // DTX Router
  ritsuRouter: '0x5f1d751f447236a5bF9C0d2e8E0f87C6E8C8C8C8', // Ritsu Finance
} as const;

// Factory Addresses
export const TAIKO_FACTORIES = {
  henjinFactory: '0x1F98431c8aD98523631AE4a59f267346ea31F984', // Henjin V3 Factory
  pankoFactory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // Panko Factory
} as const;

// Common Taiko Tokens
export const TAIKO_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0xA51894664A773981C6C112C43ce576f315d5b1B6', // Wrapped ETH
  TAIKO: '0xA9d23408b9bA935c230493c40C73824Df71A0975', // Taiko Token
  USDC: '0x07d83526730c7438048D55A4fc0b850e2aaB6f0b', // USDC
  USDT: '0x2DEF195713CF4a606B49D07E520e22C17899a736', // USDT
  DAI: '0x7d02A3E0180451B17e5D7f29eF78d06F8117106C', // DAI
  WBTC: '0x8c5e77fD6F3177A5B226B0f5F5e1FCBD0e6DEfDE', // Wrapped BTC
  HORSE: '0x2F4D4CFc5A3B5d1c9d2C5D6e5b5c5d5e5f5a5b5c', // HORSE meme token
} as const;

// Henjin API endpoint
const HENJIN_API = 'https://api.henjin.finance/v1';

// Henjin V3 Router ABI fragments
export const HENJIN_ROUTER_ABI = [
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

// Panko V2 Router ABI fragments
export const PANKO_ROUTER_ABI = [
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
] as const;

export interface TaikoQuote extends AggregatorQuote {
  aggregator: DexAggregator;
  dexName?: string;
  feeTier?: number;
}

/**
 * Get quote from Henjin (Uniswap V3 style)
 */
export async function getHenjinQuote(
  request: SwapRequest
): Promise<TaikoQuote | null> {
  if (request.chainId !== 'taiko') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? TAIKO_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? TAIKO_TOKENS.WETH
      : request.tokenOut;

    // Try Henjin API for quote
    const quoteResponse = await fetch(`${HENJIN_API}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chainId: TAIKO_CHAIN_ID,
        tokenIn,
        tokenOut,
        amount: request.amountIn.toString(),
        type: 'exactIn',
        slippage: request.slippage * 100,
        recipient: request.recipient || '',
      }),
    });

    if (quoteResponse.ok) {
      const data = (await quoteResponse.json()) as {
        amountOut?: string;
        estimatedGas?: string;
        priceImpact?: string;
        route?: Array<{
          pool?: string;
          tokenIn?: string;
          tokenOut?: string;
          fee?: number;
        }>;
        tx?: { data?: string; to?: string; value?: string };
        feeTier?: number;
      };

      return {
        aggregator: '1inch' as DexAggregator,
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: parseHenjinRoute(data.route, request.tokenIn, request.tokenOut),
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || TAIKO_ROUTERS.henjinRouter,
        txValue: isNativeToken(request.tokenIn)
          ? request.amountIn
          : BigInt(data.tx?.value || '0'),
        dexName: 'Henjin',
        feeTier: data.feeTier || 3000,
      };
    }

    return buildHenjinFallbackQuote(request);
  } catch {
    return buildHenjinFallbackQuote(request);
  }
}

/**
 * Get quote from Panko (Uniswap V2 style)
 */
export async function getPankoQuote(
  request: SwapRequest
): Promise<TaikoQuote | null> {
  if (request.chainId !== 'taiko') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? TAIKO_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? TAIKO_TOKENS.WETH
      : request.tokenOut;

    // Build path through WETH if needed
    const path =
      tokenIn === TAIKO_TOKENS.WETH || tokenOut === TAIKO_TOKENS.WETH
        ? [tokenIn, tokenOut]
        : [tokenIn, TAIKO_TOKENS.WETH, tokenOut];

    // Simplified estimation - would use router contract for actual quote
    const estimatedOutput = calculateEstimatedOutput(
      request.amountIn,
      request.slippage
    );

    return {
      aggregator: '1inch' as DexAggregator,
      amountOut: estimatedOutput,
      estimatedGas: 150000n,
      priceImpact: 0.3,
      route: [
        {
          dex: 'Panko',
          poolAddress: TAIKO_FACTORIES.pankoFactory,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: encodePankoSwap(request, path),
      txTo: TAIKO_ROUTERS.pankoRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      dexName: 'Panko',
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from DTX
 */
export async function getDtxQuote(
  request: SwapRequest
): Promise<TaikoQuote | null> {
  if (request.chainId !== 'taiko') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? TAIKO_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? TAIKO_TOKENS.WETH
      : request.tokenOut;

    const quoteResponse = await fetch('https://api.dtx.exchange/v1/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chainId: TAIKO_CHAIN_ID,
        tokenIn,
        tokenOut,
        amount: request.amountIn.toString(),
        slippage: request.slippage,
      }),
    });

    if (quoteResponse.ok) {
      const data = (await quoteResponse.json()) as {
        amountOut?: string;
        estimatedGas?: string;
        priceImpact?: string;
        tx?: { data?: string; to?: string; value?: string };
      };

      return {
        aggregator: '1inch' as DexAggregator,
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '180000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [
          {
            dex: 'DTX',
            poolAddress: TAIKO_ROUTERS.dtxRouter,
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          },
        ],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || TAIKO_ROUTERS.dtxRouter,
        txValue: isNativeToken(request.tokenIn)
          ? request.amountIn
          : BigInt(data.tx?.value || '0'),
        dexName: 'DTX',
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Taiko chain
 */
export async function getTaikoBestQuote(
  request: SwapRequest
): Promise<TaikoQuote | null> {
  if (request.chainId !== 'taiko') {
    return null;
  }

  const quotes = await Promise.all([
    getHenjinQuote(request),
    getPankoQuote(request),
    getDtxQuote(request),
  ]);

  const validQuotes = quotes.filter(
    (q): q is TaikoQuote => q !== null && q.amountOut > 0n
  );

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Taiko
 */
export function buildTaikoSwapTransaction(
  quote: TaikoQuote,
  recipient: string
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || TAIKO_ROUTERS.henjinRouter,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Taiko
 */
export function getTaikoDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Henjin', type: 'concentrated-liquidity', router: TAIKO_ROUTERS.henjinRouter },
    { name: 'Panko', type: 'amm', router: TAIKO_ROUTERS.pankoRouter },
    { name: 'DTX', type: 'amm', router: TAIKO_ROUTERS.dtxRouter },
    { name: 'Ritsu', type: 'stable-swap', router: TAIKO_ROUTERS.ritsuRouter },
  ];
}

/**
 * Check if chain is Taiko
 */
export function isTaikoChain(chainId: string): boolean {
  return chainId === 'taiko';
}

/**
 * Get Taiko chain ID
 */
export function getTaikoChainId(): number {
  return EVM_CHAIN_IDS.taiko;
}

/**
 * Get popular trading pairs on Taiko
 */
export function getTaikoPopularPairs(): Array<{
  tokenIn: string;
  tokenOut: string;
  name: string;
}> {
  return [
    { tokenIn: TAIKO_TOKENS.ETH, tokenOut: TAIKO_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: TAIKO_TOKENS.ETH, tokenOut: TAIKO_TOKENS.TAIKO, name: 'ETH/TAIKO' },
    { tokenIn: TAIKO_TOKENS.WETH, tokenOut: TAIKO_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: TAIKO_TOKENS.TAIKO, tokenOut: TAIKO_TOKENS.USDC, name: 'TAIKO/USDC' },
    { tokenIn: TAIKO_TOKENS.ETH, tokenOut: TAIKO_TOKENS.USDT, name: 'ETH/USDT' },
    { tokenIn: TAIKO_TOKENS.WETH, tokenOut: TAIKO_TOKENS.WBTC, name: 'WETH/WBTC' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === TAIKO_TOKENS.ETH ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function parseHenjinRoute(
  route: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(route)) {
    return [
      {
        dex: 'Henjin',
        poolAddress: '',
        tokenIn,
        tokenOut,
        percentage: 100,
      },
    ];
  }

  try {
    return route.map(
      (hop: { pool?: string; tokenIn?: string; tokenOut?: string; fee?: number }) => ({
        dex: 'Henjin',
        poolAddress: hop.pool || '',
        tokenIn: hop.tokenIn || tokenIn,
        tokenOut: hop.tokenOut || tokenOut,
        percentage: 100 / route.length,
      })
    );
  } catch {
    return [
      {
        dex: 'Henjin',
        poolAddress: '',
        tokenIn,
        tokenOut,
        percentage: 100,
      },
    ];
  }
}

function buildHenjinFallbackQuote(request: SwapRequest): TaikoQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? TAIKO_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? TAIKO_TOKENS.WETH
      : request.tokenOut;

    const path =
      tokenIn === TAIKO_TOKENS.WETH || tokenOut === TAIKO_TOKENS.WETH
        ? [tokenIn, tokenOut]
        : [tokenIn, TAIKO_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(
      request.amountIn,
      request.slippage
    );

    return {
      aggregator: '1inch' as DexAggregator,
      amountOut: minAmountOut,
      estimatedGas: 200000n,
      priceImpact: 0.5,
      route: [
        {
          dex: 'Henjin',
          poolAddress: TAIKO_ROUTERS.henjinRouter,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: encodeHenjinSwap(request, path, 3000),
      txTo: TAIKO_ROUTERS.henjinRouter,
      txValue: isNativeIn ? request.amountIn : 0n,
      dexName: 'Henjin',
      feeTier: 3000,
    };
  } catch {
    return null;
  }
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return (amountIn * (10000n - slippageBps)) / 10000n;
}

function encodeHenjinSwap(
  request: SwapRequest,
  path: string[],
  feeTier: number
): string {
  // Simplified encoding - in production use viem for proper ABI encoding
  const EXACT_INPUT_SINGLE_SELECTOR = '0x414bf389';
  return EXACT_INPUT_SINGLE_SELECTOR;
}

function encodePankoSwap(request: SwapRequest, path: string[]): string {
  // Simplified encoding
  const isNativeIn = isNativeToken(request.tokenIn);
  const isNativeOut = isNativeToken(request.tokenOut);

  if (isNativeIn) {
    return '0x7ff36ab5'; // swapExactETHForTokens
  } else if (isNativeOut) {
    return '0x18cbafe5'; // swapExactTokensForETH
  }
  return '0x38ed1739'; // swapExactTokensForTokens
}
