/**
 * Zora Chain DEX Integration
 *
 * Zora is an OP Stack L2 focused on NFTs and creator economy.
 * Primary DEX: Uniswap V3 (via Universal Router)
 * Also supports: Velodrome fork (potential)
 *
 * Chain ID: 7777777
 * Native Token: ETH
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';

// Chain constant
export const ZORA_CHAIN_ID = 7777777;

// Contract addresses on Zora Mainnet
export const ZORA_ROUTERS = {
  // Uniswap V3 contracts (Universal Router deployment)
  universalRouter: '0x2626664c2603336E57B271c5C0b26F421741e481',
  swapRouter02: '0x0F9e9a16b54dD89dc6f7d4361d2D37E8a4ef8f4E',
  quoterV2: '0x11867e1b3348F3ce4FcC170BC5af3d23E07E64Df',
  // Uniswap V3 core
  factory: '0x7145F8aeef1f6510E92164038E1B6F8cB2c42Cbb',
  positionManager: '0xbC91e8DfA3fF18De43853372A3d7dfe585137D78',
  // Multicall
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
} as const;

export const ZORA_FACTORIES = {
  uniswapV3: '0x7145F8aeef1f6510E92164038E1B6F8cB2c42Cbb',
} as const;

// Popular Zora tokens
export const ZORA_TOKENS = {
  ETH: '0x0000000000000000000000000000000000000000', // Native token
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH (OP Stack)
  USDC: '0xCccCCccc7021b32EBb4e8C08314bD62F7c653EC4', // Circle USDC
  USDCe: '0x9Bd03768a7DCc129555dE410FF8E85528A4F88b5', // Bridged USDC.e
  ENJOY: '0xa6B280B42CB0b7c4a4F789EC6cCC3a7b6657d6b0', // Enjoy token (Zora ecosystem)
  IMAGINE: '0x078540eECC8b6d89949c9C7d5e8E91eAb64f6696', // Imagine token
  DEGEN: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed', // Degen (bridged)
  ZORA: '0x1111111111111111111111111111111111111111', // Zora token (placeholder)
} as const;

export interface ZoraQuote {
  aggregator: 'uniswap-v3' | 'uniswap-universal';
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
  path: string[];
  fee?: number; // Uniswap V3 fee tier
}

// Uniswap V3 QuoterV2 ABI
export const ZORA_QUOTER_ABI = [
  {
    name: 'quoteExactInputSingle',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      {
        name: 'params',
        type: 'tuple',
        components: [
          { name: 'tokenIn', type: 'address' },
          { name: 'tokenOut', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
          { name: 'fee', type: 'uint24' },
          { name: 'sqrtPriceLimitX96', type: 'uint160' },
        ],
      },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96After', type: 'uint160' },
      { name: 'initializedTicksCrossed', type: 'uint32' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
  {
    name: 'quoteExactInput',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'path', type: 'bytes' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [
      { name: 'amountOut', type: 'uint256' },
      { name: 'sqrtPriceX96AfterList', type: 'uint160[]' },
      { name: 'initializedTicksCrossedList', type: 'uint32[]' },
      { name: 'gasEstimate', type: 'uint256' },
    ],
  },
] as const;

// Uniswap V3 SwapRouter02 ABI
export const ZORA_SWAP_ROUTER_ABI = [
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
    name: 'multicall',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'deadline', type: 'uint256' },
      { name: 'data', type: 'bytes[]' },
    ],
    outputs: [{ name: 'results', type: 'bytes[]' }],
  },
] as const;

// Fee tiers for Uniswap V3 on Zora
export const ZORA_FEE_TIERS = {
  LOWEST: 100,   // 0.01%
  LOW: 500,      // 0.05%
  MEDIUM: 3000,  // 0.30%
  HIGH: 10000,   // 1.00%
} as const;

/**
 * Get quote from Uniswap V3 on Zora
 */
export async function getUniswapZoraQuote(
  request: SwapRequest
): Promise<ZoraQuote | null> {
  if (request.chainId !== 'zora') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? ZORA_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? ZORA_TOKENS.WETH : request.tokenOut;

    // Determine best fee tier based on tokens
    const feeTier = getOptimalFeeTier(tokenIn, tokenOut);

    // Try to get quote - in production would use QuoterV2 contract
    const { amountOut, priceImpact } = await simulateUniswapQuote(
      tokenIn,
      tokenOut,
      request.amountIn,
      feeTier
    );

    return {
      aggregator: 'uniswap-v3',
      amountOut,
      estimatedGas: 180000n,
      priceImpact,
      route: [{
        dex: 'Uniswap V3',
        poolAddress: ZORA_FACTORIES.uniswapV3,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x', // Would be encoded swap call
      txTo: ZORA_ROUTERS.swapRouter02,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path: [tokenIn, tokenOut],
      fee: feeTier,
    };
  } catch {
    return buildZoraFallbackQuote(request);
  }
}

/**
 * Get quote via Universal Router (supports more complex routes)
 */
export async function getUniversalRouterZoraQuote(
  request: SwapRequest
): Promise<ZoraQuote | null> {
  if (request.chainId !== 'zora') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? ZORA_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? ZORA_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed for better liquidity
    const needsWethHop = tokenIn !== ZORA_TOKENS.WETH &&
                         tokenOut !== ZORA_TOKENS.WETH &&
                         !isStablePair(tokenIn, tokenOut);

    const path = needsWethHop
      ? [tokenIn, ZORA_TOKENS.WETH, tokenOut]
      : [tokenIn, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'uniswap-universal',
      amountOut: minAmountOut,
      estimatedGas: needsWethHop ? 250000n : 180000n,
      priceImpact: 0.3,
      route: needsWethHop
        ? [
            {
              dex: 'Uniswap V3',
              poolAddress: ZORA_FACTORIES.uniswapV3,
              tokenIn: request.tokenIn,
              tokenOut: ZORA_TOKENS.WETH,
              percentage: 100,
            },
            {
              dex: 'Uniswap V3',
              poolAddress: ZORA_FACTORIES.uniswapV3,
              tokenIn: ZORA_TOKENS.WETH,
              tokenOut: request.tokenOut,
              percentage: 100,
            },
          ]
        : [{
            dex: 'Uniswap V3',
            poolAddress: ZORA_FACTORIES.uniswapV3,
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
      txData: '0x',
      txTo: ZORA_ROUTERS.universalRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
    };
  } catch {
    return buildZoraFallbackQuote(request);
  }
}

/**
 * Get best quote from all Zora DEXes
 */
export async function getZoraBestQuote(
  request: SwapRequest
): Promise<ZoraQuote | null> {
  if (request.chainId !== 'zora') return null;

  const quotes = await Promise.all([
    getUniswapZoraQuote(request),
    getUniversalRouterZoraQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is ZoraQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Zora
 */
export async function buildZoraSwapTransaction(
  quote: ZoraQuote,
  recipient: string
): Promise<{ to: string; data: string; value: bigint }> {
  return {
    to: quote.txTo,
    data: quote.txData,
    value: quote.txValue,
  };
}

/**
 * Get list of available DEXes on Zora
 */
export function getZoraDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Uniswap V3', type: 'concentrated-liquidity', router: ZORA_ROUTERS.swapRouter02 },
    { name: 'Universal Router', type: 'aggregator', router: ZORA_ROUTERS.universalRouter },
  ];
}

/**
 * Check if chain is Zora
 */
export function isZoraChain(chainId: string): boolean {
  return chainId === 'zora';
}

/**
 * Get Zora chain ID
 */
export function getZoraChainId(): number {
  return EVM_CHAIN_IDS.zora;
}

/**
 * Get popular trading pairs on Zora
 */
export function getZoraPopularPairs(): { tokenIn: string; tokenOut: string; name: string }[] {
  return [
    { tokenIn: ZORA_TOKENS.ETH, tokenOut: ZORA_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: ZORA_TOKENS.ETH, tokenOut: ZORA_TOKENS.ENJOY, name: 'ETH/ENJOY' },
    { tokenIn: ZORA_TOKENS.WETH, tokenOut: ZORA_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: ZORA_TOKENS.ENJOY, tokenOut: ZORA_TOKENS.USDC, name: 'ENJOY/USDC' },
    { tokenIn: ZORA_TOKENS.DEGEN, tokenOut: ZORA_TOKENS.WETH, name: 'DEGEN/WETH' },
    { tokenIn: ZORA_TOKENS.IMAGINE, tokenOut: ZORA_TOKENS.WETH, name: 'IMAGINE/WETH' },
  ];
}

/**
 * Get Uniswap V3 fee tiers on Zora
 */
export function getZoraFeeTiers(): typeof ZORA_FEE_TIERS {
  return ZORA_FEE_TIERS;
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === ZORA_TOKENS.ETH ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function isStablePair(tokenIn: string, tokenOut: string): boolean {
  const stableTokens = [
    ZORA_TOKENS.USDC.toLowerCase(),
    ZORA_TOKENS.USDCe.toLowerCase(),
  ];
  return (
    stableTokens.includes(tokenIn.toLowerCase()) &&
    stableTokens.includes(tokenOut.toLowerCase())
  );
}

function getOptimalFeeTier(tokenIn: string, tokenOut: string): number {
  // Stable pairs use lowest fee
  if (isStablePair(tokenIn, tokenOut)) {
    return ZORA_FEE_TIERS.LOWEST;
  }

  // WETH pairs typically use low or medium fee
  if (tokenIn === ZORA_TOKENS.WETH || tokenOut === ZORA_TOKENS.WETH) {
    return ZORA_FEE_TIERS.LOW;
  }

  // Default to medium fee for other pairs
  return ZORA_FEE_TIERS.MEDIUM;
}

async function simulateUniswapQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: bigint,
  feeTier: number
): Promise<{ amountOut: bigint; priceImpact: number }> {
  // Simplified simulation - in production would call QuoterV2
  const slippage = 0.003; // 0.3% default
  const feeImpact = feeTier / 1_000_000; // Convert basis points to percentage

  const amountOut = BigInt(
    Math.floor(Number(amountIn) * (1 - slippage - feeImpact))
  );

  const priceImpact = slippage * 100; // Convert to percentage

  return { amountOut, priceImpact };
}

function buildZoraFallbackQuote(request: SwapRequest): ZoraQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? ZORA_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? ZORA_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed
    const path = tokenIn === ZORA_TOKENS.WETH || tokenOut === ZORA_TOKENS.WETH
      ? [tokenIn, tokenOut]
      : [tokenIn, ZORA_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'uniswap-v3',
      amountOut: minAmountOut,
      estimatedGas: 180000n,
      priceImpact: 0.5,
      route: [{
        dex: 'Uniswap V3',
        poolAddress: ZORA_FACTORIES.uniswapV3,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: ZORA_ROUTERS.swapRouter02,
      txValue: isNativeIn ? request.amountIn : 0n,
      path,
      fee: ZORA_FEE_TIERS.MEDIUM,
    };
  } catch {
    return null;
  }
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  // Simplified estimation - assumes 1:1 ratio minus slippage
  // In production, this would use actual price data
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return amountIn * (10000n - slippageBps) / 10000n;
}
