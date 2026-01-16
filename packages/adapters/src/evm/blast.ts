/**
 * Blast Chain DEX Integration
 *
 * Blast is an Ethereum L2 with native yield for ETH and stablecoins.
 * Features auto-rebasing for ETH and USDB (native stablecoin).
 *
 * Primary DEX: Thruster (Uniswap V2/V3 style)
 * Also supports: BladeSwap, Ring Protocol
 *
 * Chain ID: 81457
 * Native Token: ETH (with native yield)
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';
import { EVM_CHAIN_IDS } from './chains.js';

// Blast Chain ID
export const BLAST_CHAIN_ID = 81457;

// Thruster Router Addresses
export const BLAST_ROUTERS = {
  thrusterV2Router: '0x98994a9A7a2570367554589189dC9772241650f6', // Thruster V2 Router
  thrusterV3Router: '0x337827814155ECBf24D20231fCA4444F530C0555', // Thruster V3 SwapRouter
  thrusterV3Quoter: '0x7587a55d4B7cF703F5f3B8ba34627b03C057a00c', // Thruster V3 Quoter
  bladeSwap: '0x9E958a75E6A2bb32eB9cCFd9cB5b4b4a1FBA618e', // BladeSwap Router
  ringProtocol: '0x7001F706ACB6440d17cBFaD63Fa50a22D51696fF', // Ring Protocol
} as const;

// Thruster Factory Addresses
export const BLAST_FACTORIES = {
  thrusterV2Factory: '0xb4A7D971D0ADea1c73198C97d7ab3f9CE4aaFA13', // Thruster V2 Factory
  thrusterV3Factory: '0xa08ae3d3f4dA51C22d3c041E468bdF4C61405AaB', // Thruster V3 Factory
} as const;

// Common Blast Tokens
export const BLAST_TOKENS = {
  ETH: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
  WETH: '0x4300000000000000000000000000000000000004', // Wrapped ETH (rebasing)
  USDB: '0x4300000000000000000000000000000000000003', // Native USD (rebasing)
  BLAST: '0xb1a5700fA2358173Fe465e6eA4Ff52E36e88E2ad', // BLAST token
  USDC: '0x4300000000000000000000000000000000000002', // USDC on Blast
  WBTC: '0xF7bc58b8D8f97ADC129cfC4c9f45Ce3C0E1D2692', // Wrapped BTC
  USDT: '0x4300000000000000000000000000000000000001', // USDT on Blast
} as const;

// Thruster API endpoint
const THRUSTER_API = 'https://api.thruster.finance/v1';

// Thruster V2 Router ABI fragments
export const THRUSTER_V2_ROUTER_ABI = [
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

// Thruster V3 Router ABI fragments
export const THRUSTER_V3_ROUTER_ABI = [
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

export interface BlastQuote extends AggregatorQuote {
  aggregator: DexAggregator;
  version?: 'v2' | 'v3';
  feeTier?: number;
}

/**
 * Get quote from Thruster V3 (concentrated liquidity)
 */
export async function getThrusterV3Quote(
  request: SwapRequest
): Promise<BlastQuote | null> {
  if (request.chainId !== 'blast') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? BLAST_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? BLAST_TOKENS.WETH
      : request.tokenOut;

    // Try Thruster API for quote
    const quoteResponse = await fetch(`${THRUSTER_API}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chainId: BLAST_CHAIN_ID,
        tokenIn,
        tokenOut,
        amount: request.amountIn.toString(),
        type: 'exactIn',
        slippage: request.slippage * 100, // bps
        recipient: request.recipient || '',
        version: 'v3',
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
        aggregator: '1inch' as DexAggregator, // Placeholder for 'thruster'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: parseThrusterRoute(data.route, request.tokenIn, request.tokenOut),
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || BLAST_ROUTERS.thrusterV3Router,
        txValue: isNativeToken(request.tokenIn)
          ? request.amountIn
          : BigInt(data.tx?.value || '0'),
        version: 'v3',
        feeTier: data.feeTier || 3000,
      };
    }

    return buildThrusterV3FallbackQuote(request);
  } catch {
    return buildThrusterV3FallbackQuote(request);
  }
}

/**
 * Get quote from Thruster V2 (constant product AMM)
 */
export async function getThrusterV2Quote(
  request: SwapRequest
): Promise<BlastQuote | null> {
  if (request.chainId !== 'blast') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? BLAST_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? BLAST_TOKENS.WETH
      : request.tokenOut;

    // Build path
    const path =
      tokenIn === BLAST_TOKENS.WETH || tokenOut === BLAST_TOKENS.WETH
        ? [tokenIn, tokenOut]
        : [tokenIn, BLAST_TOKENS.WETH, tokenOut];

    // Try Thruster V2 API
    const quoteResponse = await fetch(`${THRUSTER_API}/v2/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chainId: BLAST_CHAIN_ID,
        path,
        amountIn: request.amountIn.toString(),
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
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [
          {
            dex: 'Thruster V2',
            poolAddress: BLAST_FACTORIES.thrusterV2Factory,
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          },
        ],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || BLAST_ROUTERS.thrusterV2Router,
        txValue: isNativeToken(request.tokenIn)
          ? request.amountIn
          : BigInt(data.tx?.value || '0'),
        version: 'v2',
      };
    }

    return buildThrusterV2FallbackQuote(request);
  } catch {
    return buildThrusterV2FallbackQuote(request);
  }
}

/**
 * Get quote from BladeSwap
 */
export async function getBladeSwapQuote(
  request: SwapRequest
): Promise<BlastQuote | null> {
  if (request.chainId !== 'blast') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? BLAST_TOKENS.WETH
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? BLAST_TOKENS.WETH
      : request.tokenOut;

    const quoteResponse = await fetch('https://api.bladeswap.xyz/v1/quote', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        chainId: BLAST_CHAIN_ID,
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
            dex: 'BladeSwap',
            poolAddress: BLAST_ROUTERS.bladeSwap,
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          },
        ],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || BLAST_ROUTERS.bladeSwap,
        txValue: isNativeToken(request.tokenIn)
          ? request.amountIn
          : BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Blast chain
 */
export async function getBlastBestQuote(
  request: SwapRequest
): Promise<BlastQuote | null> {
  if (request.chainId !== 'blast') {
    return null;
  }

  const quotes = await Promise.all([
    getThrusterV3Quote(request),
    getThrusterV2Quote(request),
    getBladeSwapQuote(request),
  ]);

  const validQuotes = quotes.filter(
    (q): q is BlastQuote => q !== null && q.amountOut > 0n
  );

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Blast
 */
export function buildBlastSwapTransaction(
  quote: BlastQuote,
  recipient: string
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || BLAST_ROUTERS.thrusterV3Router,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Blast
 */
export function getBlastDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Thruster V3', type: 'concentrated-liquidity', router: BLAST_ROUTERS.thrusterV3Router },
    { name: 'Thruster V2', type: 'amm', router: BLAST_ROUTERS.thrusterV2Router },
    { name: 'BladeSwap', type: 'amm', router: BLAST_ROUTERS.bladeSwap },
    { name: 'Ring Protocol', type: 'aggregator', router: BLAST_ROUTERS.ringProtocol },
  ];
}

/**
 * Check if chain is Blast
 */
export function isBlastChain(chainId: string): boolean {
  return chainId === 'blast';
}

/**
 * Get Blast chain ID
 */
export function getBlastChainId(): number {
  return EVM_CHAIN_IDS.blast;
}

/**
 * Get popular trading pairs on Blast
 */
export function getBlastPopularPairs(): Array<{
  tokenIn: string;
  tokenOut: string;
  name: string;
}> {
  return [
    { tokenIn: BLAST_TOKENS.ETH, tokenOut: BLAST_TOKENS.USDB, name: 'ETH/USDB' },
    { tokenIn: BLAST_TOKENS.WETH, tokenOut: BLAST_TOKENS.USDB, name: 'WETH/USDB' },
    { tokenIn: BLAST_TOKENS.ETH, tokenOut: BLAST_TOKENS.BLAST, name: 'ETH/BLAST' },
    { tokenIn: BLAST_TOKENS.USDB, tokenOut: BLAST_TOKENS.USDC, name: 'USDB/USDC' },
    { tokenIn: BLAST_TOKENS.WETH, tokenOut: BLAST_TOKENS.WBTC, name: 'WETH/WBTC' },
    { tokenIn: BLAST_TOKENS.ETH, tokenOut: BLAST_TOKENS.USDT, name: 'ETH/USDT' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === BLAST_TOKENS.ETH ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function parseThrusterRoute(
  route: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(route)) {
    return [
      {
        dex: 'Thruster V3',
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
        dex: 'Thruster V3',
        poolAddress: hop.pool || '',
        tokenIn: hop.tokenIn || tokenIn,
        tokenOut: hop.tokenOut || tokenOut,
        percentage: 100 / route.length,
      })
    );
  } catch {
    return [
      {
        dex: 'Thruster V3',
        poolAddress: '',
        tokenIn,
        tokenOut,
        percentage: 100,
      },
    ];
  }
}

function buildThrusterV3FallbackQuote(request: SwapRequest): BlastQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? BLAST_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? BLAST_TOKENS.WETH
      : request.tokenOut;

    // Build path
    const path =
      tokenIn === BLAST_TOKENS.WETH || tokenOut === BLAST_TOKENS.WETH
        ? [tokenIn, tokenOut]
        : [tokenIn, BLAST_TOKENS.WETH, tokenOut];

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
          dex: 'Thruster V3',
          poolAddress: BLAST_ROUTERS.thrusterV3Router,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: encodeV3Swap(request, path, 3000),
      txTo: BLAST_ROUTERS.thrusterV3Router,
      txValue: isNativeIn ? request.amountIn : 0n,
      version: 'v3',
      feeTier: 3000,
    };
  } catch {
    return null;
  }
}

function buildThrusterV2FallbackQuote(request: SwapRequest): BlastQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? BLAST_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? BLAST_TOKENS.WETH
      : request.tokenOut;

    // Build path
    const path =
      tokenIn === BLAST_TOKENS.WETH || tokenOut === BLAST_TOKENS.WETH
        ? [tokenIn, tokenOut]
        : [tokenIn, BLAST_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(
      request.amountIn,
      request.slippage
    );

    return {
      aggregator: '1inch' as DexAggregator,
      amountOut: minAmountOut,
      estimatedGas: 150000n,
      priceImpact: 0.5,
      route: [
        {
          dex: 'Thruster V2',
          poolAddress: BLAST_ROUTERS.thrusterV2Router,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: encodeV2Swap(request, path),
      txTo: BLAST_ROUTERS.thrusterV2Router,
      txValue: isNativeIn ? request.amountIn : 0n,
      version: 'v2',
    };
  } catch {
    return null;
  }
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return (amountIn * (10000n - slippageBps)) / 10000n;
}

function encodeV3Swap(
  request: SwapRequest,
  path: string[],
  feeTier: number
): string {
  // Simplified encoding - in production use viem for proper ABI encoding
  const EXACT_INPUT_SINGLE_SELECTOR = '0x414bf389';
  return EXACT_INPUT_SINGLE_SELECTOR;
}

function encodeV2Swap(request: SwapRequest, path: string[]): string {
  // Simplified encoding - in production use viem for proper ABI encoding
  const isNativeIn = isNativeToken(request.tokenIn);
  const isNativeOut = isNativeToken(request.tokenOut);

  if (isNativeIn) {
    return '0x7ff36ab5'; // swapExactETHForTokens
  } else if (isNativeOut) {
    return '0x18cbafe5'; // swapExactTokensForETH
  }
  return '0x38ed1739'; // swapExactTokensForTokens
}
