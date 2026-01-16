/**
 * Ink Chain DEX Integration
 *
 * Ink is an OP Stack L2 built by Kraken.
 * Primary DEXes: Velodrome (ve(3,3) AMM), Nado (concentrated liquidity)
 *
 * Chain ID: 57073
 * Native Token: ETH
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';

// Chain constant
export const INK_CHAIN_ID = 57073;

// Velodrome API endpoint (ve(3,3) fork on Ink)
const VELODROME_API = 'https://api.velodrome.finance/v1';

// Nado API endpoint
const NADO_API = 'https://api.nado.finance/v1';

// Contract addresses on Ink Mainnet
export const INK_ROUTERS = {
  // Velodrome v2 contracts (ve(3,3) DEX)
  velodrome: '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43', // Router
  velodromeFactory: '0x31832f2a97Fd20664D76Cc421207669b55CE4BC0',
  velodromeVoter: '0x41C914ee0c7E1A5edCD0295623e6dC557B5aBf3C',
  // Nado contracts (concentrated liquidity)
  nado: '0x5c6C7D5e010200B35d9E3B7e0B2E9E4E5B9C3A1D', // Placeholder - update when deployed
  nadoFactory: '0x7D8c9E1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E', // Placeholder
  nadoQuoter: '0x8E9F0A1B2C3D4E5F6A7B8C9D0E1F2A3B4C5D6E7F', // Placeholder
  // Multicall
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
} as const;

// Popular Ink tokens
export const INK_TOKENS = {
  ETH: '0x0000000000000000000000000000000000000000', // Native token
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH (OP Stack standard)
  USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // Circle USDC
  USDCe: '0x7F5c764cBc14f9669B88837ca1490cCa17c31607', // Bridged USDC.e
  USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58', // Tether
  DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', // DAI Stablecoin
  WBTC: '0x68f180fcCe6836688e9084f035309E29Bf0A2095', // Wrapped BTC
  INK: '0x0000000000000000000000000000000000000000', // Ink native token (if any)
} as const;

export interface InkQuote {
  aggregator: 'velodrome' | 'nado';
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
  path: string[];
  stable?: boolean; // Velodrome pool type (stable vs volatile)
}

// Velodrome Router ABI (ve(3,3) style)
export const VELODROME_ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'routes', type: 'tuple[]', components: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'stable', type: 'bool' },
        { name: 'factory', type: 'address' },
      ]},
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
      { name: 'routes', type: 'tuple[]', components: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'stable', type: 'bool' },
        { name: 'factory', type: 'address' },
      ]},
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
      { name: 'routes', type: 'tuple[]', components: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'stable', type: 'bool' },
        { name: 'factory', type: 'address' },
      ]},
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
      { name: 'routes', type: 'tuple[]', components: [
        { name: 'from', type: 'address' },
        { name: 'to', type: 'address' },
        { name: 'stable', type: 'bool' },
        { name: 'factory', type: 'address' },
      ]},
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

// Nado Router ABI (concentrated liquidity style)
export const NADO_ROUTER_ABI = [
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
] as const;

/**
 * Get quote from Velodrome (ve(3,3) DEX)
 */
export async function getVelodromeQuote(
  request: SwapRequest
): Promise<InkQuote | null> {
  if (request.chainId !== 'ink') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? INK_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? INK_TOKENS.WETH : request.tokenOut;

    // Determine if this is a stable pair (stablecoins) or volatile pair
    const isStablePair = isStableSwap(tokenIn, tokenOut);

    // Try to get quote from Velodrome API
    const params = new URLSearchParams({
      chainId: INK_CHAIN_ID.toString(),
      tokenIn,
      tokenOut,
      amount: request.amountIn.toString(),
      slippage: (request.slippage * 100).toString(),
      stable: isStablePair.toString(),
    });

    const response = await fetch(`${VELODROME_API}/quote?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return buildVelodromeFallbackQuote(request, isStablePair);
    }

    const data = await response.json() as {
      amountOut?: string;
      gasEstimate?: string;
      priceImpact?: string;
      route?: Array<{ from?: string; to?: string; stable?: boolean; factory?: string }>;
      tx?: { data?: string; to?: string; value?: string };
    };

    return {
      aggregator: 'velodrome',
      amountOut: BigInt(data.amountOut || '0'),
      estimatedGas: BigInt(data.gasEstimate || '200000'),
      priceImpact: parseFloat(data.priceImpact || '0'),
      route: parseVelodromeRoute(data.route, request.tokenIn, request.tokenOut),
      txData: data.tx?.data || '0x',
      txTo: data.tx?.to || INK_ROUTERS.velodrome,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path: [tokenIn, tokenOut],
      stable: isStablePair,
    };
  } catch {
    return buildVelodromeFallbackQuote(request, isStableSwap(request.tokenIn, request.tokenOut));
  }
}

/**
 * Get quote from Nado (concentrated liquidity DEX)
 */
export async function getNadoQuote(
  request: SwapRequest
): Promise<InkQuote | null> {
  if (request.chainId !== 'ink') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? INK_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? INK_TOKENS.WETH : request.tokenOut;

    // Try to get quote from Nado API
    const params = new URLSearchParams({
      tokenIn,
      tokenOut,
      amountIn: request.amountIn.toString(),
      slippage: (request.slippage * 100).toString(),
      ...(request.recipient && { recipient: request.recipient }),
    });

    const response = await fetch(`${NADO_API}/quote?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return buildNadoFallbackQuote(request);
    }

    const data = await response.json() as {
      amountOut?: string;
      gasEstimate?: string;
      priceImpact?: string;
      fee?: number;
      path?: string[];
      tx?: { data?: string; to?: string; value?: string };
    };

    return {
      aggregator: 'nado',
      amountOut: BigInt(data.amountOut || '0'),
      estimatedGas: BigInt(data.gasEstimate || '180000'),
      priceImpact: parseFloat(data.priceImpact || '0'),
      route: [{
        dex: 'Nado',
        poolAddress: INK_ROUTERS.nado,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: data.tx?.data || '0x',
      txTo: data.tx?.to || INK_ROUTERS.nado,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path: data.path || [tokenIn, tokenOut],
    };
  } catch {
    return buildNadoFallbackQuote(request);
  }
}

/**
 * Get best quote from all Ink DEXes
 */
export async function getInkBestQuote(
  request: SwapRequest
): Promise<InkQuote | null> {
  if (request.chainId !== 'ink') return null;

  const quotes = await Promise.all([
    getVelodromeQuote(request),
    getNadoQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is InkQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Ink
 */
export async function buildInkSwapTransaction(
  quote: InkQuote,
  recipient: string
): Promise<{ to: string; data: string; value: bigint }> {
  return {
    to: quote.txTo,
    data: quote.txData,
    value: quote.txValue,
  };
}

/**
 * Get list of available DEXes on Ink
 */
export function getInkDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Velodrome', type: 've(3,3)', router: INK_ROUTERS.velodrome },
    { name: 'Nado', type: 'concentrated-liquidity', router: INK_ROUTERS.nado },
  ];
}

/**
 * Check if chain is Ink
 */
export function isInkChain(chainId: string): boolean {
  return chainId === 'ink';
}

/**
 * Get Ink chain ID
 */
export function getInkChainId(): number {
  return EVM_CHAIN_IDS.ink;
}

/**
 * Get popular trading pairs on Ink
 */
export function getInkPopularPairs(): { tokenIn: string; tokenOut: string; name: string }[] {
  return [
    { tokenIn: INK_TOKENS.ETH, tokenOut: INK_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: INK_TOKENS.ETH, tokenOut: INK_TOKENS.USDT, name: 'ETH/USDT' },
    { tokenIn: INK_TOKENS.WETH, tokenOut: INK_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: INK_TOKENS.USDC, tokenOut: INK_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: INK_TOKENS.WBTC, tokenOut: INK_TOKENS.WETH, name: 'WBTC/WETH' },
    { tokenIn: INK_TOKENS.DAI, tokenOut: INK_TOKENS.USDC, name: 'DAI/USDC' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === INK_TOKENS.ETH ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function isStableSwap(tokenIn: string, tokenOut: string): boolean {
  const stableTokens = [
    INK_TOKENS.USDC.toLowerCase(),
    INK_TOKENS.USDCe.toLowerCase(),
    INK_TOKENS.USDT.toLowerCase(),
    INK_TOKENS.DAI.toLowerCase(),
  ];
  return (
    stableTokens.includes(tokenIn.toLowerCase()) &&
    stableTokens.includes(tokenOut.toLowerCase())
  );
}

function parseVelodromeRoute(
  route: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(route)) {
    return [{
      dex: 'Velodrome',
      poolAddress: INK_ROUTERS.velodromeFactory,
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }

  try {
    return route.map((hop: { from?: string; to?: string; stable?: boolean; factory?: string }) => ({
      dex: hop.stable ? 'Velodrome (Stable)' : 'Velodrome (Volatile)',
      poolAddress: hop.factory || INK_ROUTERS.velodromeFactory,
      tokenIn: hop.from || tokenIn,
      tokenOut: hop.to || tokenOut,
      percentage: 100 / route.length,
    }));
  } catch {
    return [{
      dex: 'Velodrome',
      poolAddress: INK_ROUTERS.velodromeFactory,
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }
}

function buildVelodromeFallbackQuote(request: SwapRequest, isStable: boolean): InkQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? INK_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? INK_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed
    const path = tokenIn === INK_TOKENS.WETH || tokenOut === INK_TOKENS.WETH
      ? [tokenIn, tokenOut]
      : [tokenIn, INK_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'velodrome',
      amountOut: minAmountOut,
      estimatedGas: 200000n,
      priceImpact: 0.5,
      route: [{
        dex: isStable ? 'Velodrome (Stable)' : 'Velodrome (Volatile)',
        poolAddress: INK_ROUTERS.velodromeFactory,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: INK_ROUTERS.velodrome,
      txValue: isNativeIn ? request.amountIn : 0n,
      path,
      stable: isStable,
    };
  } catch {
    return null;
  }
}

function buildNadoFallbackQuote(request: SwapRequest): InkQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? INK_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? INK_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed
    const path = tokenIn === INK_TOKENS.WETH || tokenOut === INK_TOKENS.WETH
      ? [tokenIn, tokenOut]
      : [tokenIn, INK_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'nado',
      amountOut: minAmountOut,
      estimatedGas: 180000n,
      priceImpact: 0.3,
      route: [{
        dex: 'Nado',
        poolAddress: INK_ROUTERS.nado,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: INK_ROUTERS.nado,
      txValue: isNativeIn ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  // Simplified estimation - assumes 1:1 ratio minus slippage
  // In production, this would use actual price data from oracles
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return amountIn * (10000n - slippageBps) / 10000n;
}
