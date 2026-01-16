/**
 * Ronin Chain DEX Integration
 *
 * Ronin is the blockchain built for gaming, home to Axie Infinity.
 * Primary DEX: Katana (V2 + V3 with concentrated liquidity)
 *
 * Chain ID: 2020
 * Native Token: RON
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';

// Katana V3 contracts (current)
export const RONIN_CONTRACTS = {
  // Katana V3 (Uniswap V3 fork)
  katanaV3Router: '0x8Cd8F15E956636e6527d2EC2ea669675A74153CF', // AggregateRouter
  katanaV3Factory: '0x4E7236ff45d69395DDEFE1445040A8f3C7CD8819',
  katanaV3Quoter: '0xB2Cc117Ed42cBE07710C90903bE46D2822bcde45', // QuoterV2
  katanaV3PositionManager: '0x7C2716803c09cd5eeD78Ba40117084af3c803565',
  katanaGovernance: '0x247F12836A421CDC5e22B93Bf5A9AAa0f521f986',
  // Katana V2 (legacy, still operational)
  katanaV2Router: '0x7d0556d55ca1a92708681e2e231733ebd922597d',
  katanaV2Factory: '0xB255D6A720BB7c39fee173cE22113397119cB930',
  // Utilities
  permit2: '0xCcf4a457E775f317e0Cf306EFDda14Cc8084F82C',
  multicall: '0x5938EF96F0C7c75CED7132D083ff08362C7FF70a',
} as const;

// Popular Ronin tokens
export const RONIN_TOKENS = {
  RON: '0x0000000000000000000000000000000000000000', // Native token
  WRON: '0xe514d9DEB7966c8BE0ca922de8a064264eA6bcd4', // Wrapped RON
  WETH: '0xc99a6A985eD2Cac1ef41640596C5A5f9F4E19Ef5', // Wrapped ETH
  AXS: '0x97a9107C1793BC407d6F527b77e7fff4D812bece', // Axie Infinity Shards
  SLP: '0xa8754b9Fa15fc18BB59458815510E40a12cD2014', // Smooth Love Potion
  USDC: '0x0B7007c13325C48911F73A2daD5FA5dCBf808aDc', // USD Coin
  PIXEL: '0x7EAe20d11Ef8c779433EB24503dEf900b9d28ad7', // Pixels token
  APRS: '0x306a28279d04a47468ed83d55088d0DCd1369294', // Apeiros token
} as const;

export interface RoninQuote {
  aggregator: 'katana-v3' | 'katana-v2' | 'katana-aggregate';
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
  path: string[];
  poolFees?: number[]; // V3 pool fee tiers (500, 3000, 10000)
}

/**
 * Get quote from Katana V3 (concentrated liquidity)
 */
export async function getKatanaV3Quote(
  request: SwapRequest
): Promise<RoninQuote | null> {
  if (request.chainId !== 'ronin') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? RONIN_TOKENS.WRON : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? RONIN_TOKENS.WRON : request.tokenOut;

    // Try to get quote from Katana's quoter contract
    // In production, this would call the QuoterV2 contract
    const path = buildPath(tokenIn, tokenOut);
    const poolFees = [3000]; // Default 0.3% fee tier

    // Estimate output (simplified)
    const estimatedOutput = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'katana-v3',
      amountOut: estimatedOutput,
      estimatedGas: 200000n,
      priceImpact: 0.3,
      route: [{
        dex: 'Katana V3',
        poolAddress: RONIN_CONTRACTS.katanaV3Factory,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: encodeV3Swap(request, path, poolFees),
      txTo: RONIN_CONTRACTS.katanaV3Router,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
      poolFees,
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from Katana V2 (legacy AMM)
 */
export async function getKatanaV2Quote(
  request: SwapRequest
): Promise<RoninQuote | null> {
  if (request.chainId !== 'ronin') return null;

  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const isNativeOut = isNativeToken(request.tokenOut);

    const tokenIn = isNativeIn ? RONIN_TOKENS.WRON : request.tokenIn;
    const tokenOut = isNativeOut ? RONIN_TOKENS.WRON : request.tokenOut;

    // Build path through WRON if needed
    const path = buildPath(tokenIn, tokenOut);

    // Calculate min amount out with slippage
    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    // Determine swap method
    const swapMethod = isNativeIn
      ? 'swapExactETHForTokens'
      : isNativeOut
        ? 'swapExactTokensForETH'
        : 'swapExactTokensForTokens';

    return {
      aggregator: 'katana-v2',
      amountOut: minAmountOut,
      estimatedGas: 180000n,
      priceImpact: 0.5,
      route: [{
        dex: 'Katana V2',
        poolAddress: RONIN_CONTRACTS.katanaV2Factory,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: encodeV2Swap(swapMethod, request, path),
      txTo: RONIN_CONTRACTS.katanaV2Router,
      txValue: isNativeIn ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote using Katana's aggregate router
 * The aggregate router finds the best path across V2 and V3 pools
 */
export async function getKatanaAggregateQuote(
  request: SwapRequest
): Promise<RoninQuote | null> {
  if (request.chainId !== 'ronin') return null;

  try {
    // The AggregateRouter automatically routes through both V2 and V3
    const tokenIn = isNativeToken(request.tokenIn) ? RONIN_TOKENS.WRON : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? RONIN_TOKENS.WRON : request.tokenOut;

    const path = buildPath(tokenIn, tokenOut);
    const estimatedOutput = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'katana-aggregate',
      amountOut: estimatedOutput,
      estimatedGas: 250000n, // Higher gas for aggregate routing
      priceImpact: 0.25,
      route: [{
        dex: 'Katana Aggregate',
        poolAddress: RONIN_CONTRACTS.katanaV3Router,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: encodeAggregateSwap(request, path),
      txTo: RONIN_CONTRACTS.katanaV3Router,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote from all Katana versions
 */
export async function getRoninBestQuote(
  request: SwapRequest
): Promise<RoninQuote | null> {
  if (request.chainId !== 'ronin') return null;

  const quotes = await Promise.all([
    getKatanaAggregateQuote(request), // Aggregate router usually gives best price
    getKatanaV3Quote(request),
    getKatanaV2Quote(request),
  ]);

  const validQuotes = quotes.filter((q): q is RoninQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Ronin
 */
export async function buildRoninSwapTransaction(
  quote: RoninQuote,
  recipient: string
): Promise<{ to: string; data: string; value: bigint }> {
  return {
    to: quote.txTo,
    data: quote.txData,
    value: quote.txValue,
  };
}

/**
 * Get list of available DEXes on Ronin
 */
export function getRoninDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Katana Aggregate', type: 'aggregator', router: RONIN_CONTRACTS.katanaV3Router },
    { name: 'Katana V3', type: 'concentrated-liquidity', router: RONIN_CONTRACTS.katanaV3Router },
    { name: 'Katana V2', type: 'amm', router: RONIN_CONTRACTS.katanaV2Router },
  ];
}

/**
 * Check if chain is Ronin
 */
export function isRoninChain(chainId: string): boolean {
  return chainId === 'ronin';
}

/**
 * Get Ronin chain ID
 */
export function getRoninChainId(): number {
  return EVM_CHAIN_IDS.ronin;
}

/**
 * Get popular trading pairs on Ronin
 */
export function getRoninPopularPairs(): { tokenIn: string; tokenOut: string; name: string }[] {
  return [
    { tokenIn: RONIN_TOKENS.RON, tokenOut: RONIN_TOKENS.USDC, name: 'RON/USDC' },
    { tokenIn: RONIN_TOKENS.RON, tokenOut: RONIN_TOKENS.WETH, name: 'RON/WETH' },
    { tokenIn: RONIN_TOKENS.RON, tokenOut: RONIN_TOKENS.AXS, name: 'RON/AXS' },
    { tokenIn: RONIN_TOKENS.AXS, tokenOut: RONIN_TOKENS.WETH, name: 'AXS/WETH' },
    { tokenIn: RONIN_TOKENS.SLP, tokenOut: RONIN_TOKENS.WRON, name: 'SLP/WRON' },
    { tokenIn: RONIN_TOKENS.PIXEL, tokenOut: RONIN_TOKENS.RON, name: 'PIXEL/RON' },
    { tokenIn: RONIN_TOKENS.WETH, tokenOut: RONIN_TOKENS.USDC, name: 'WETH/USDC' },
  ];
}

/**
 * Get Katana V3 fee tiers
 */
export function getKatanaFeeTiers(): { fee: number; description: string }[] {
  return [
    { fee: 500, description: '0.05% - Best for stable pairs' },
    { fee: 3000, description: '0.3% - Standard fee tier' },
    { fee: 10000, description: '1% - For exotic pairs' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === RONIN_TOKENS.RON ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function buildPath(tokenIn: string, tokenOut: string): string[] {
  // If either token is WRON, direct path
  if (tokenIn === RONIN_TOKENS.WRON || tokenOut === RONIN_TOKENS.WRON) {
    return [tokenIn, tokenOut];
  }
  // Otherwise route through WRON
  return [tokenIn, RONIN_TOKENS.WRON, tokenOut];
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return amountIn * (10000n - slippageBps) / 10000n;
}

function encodeV3Swap(
  request: SwapRequest,
  path: string[],
  poolFees: number[]
): string {
  // Simplified encoding - in production use viem/ethers for proper ABI encoding
  // This would be the exactInputSingle function selector for Uniswap V3 style router
  const EXACT_INPUT_SINGLE_SELECTOR = '0x414bf389';
  return EXACT_INPUT_SINGLE_SELECTOR;
}

function encodeV2Swap(
  method: string,
  request: SwapRequest,
  path: string[]
): string {
  // Uniswap V2 Router function signatures
  const signatures: Record<string, string> = {
    swapExactETHForTokens: '0x7ff36ab5',
    swapExactTokensForETH: '0x18cbafe5',
    swapExactTokensForTokens: '0x38ed1739',
  };
  return signatures[method] || signatures['swapExactTokensForTokens']!;
}

function encodeAggregateSwap(
  request: SwapRequest,
  path: string[]
): string {
  // AggregateRouter execute function selector
  const EXECUTE_SELECTOR = '0x3593564c';
  return EXECUTE_SELECTOR;
}
