/**
 * Mode Network DEX Integration
 *
 * Mode is an Ethereum L2 built on OP Stack, part of the Optimism Superchain.
 * Primary DEX: SwapMode (V2 AMM + V3 Concentrated Liquidity)
 * Also supports: Kim Exchange (Algebra-based)
 *
 * Chain ID: 34443
 * Native Token: ETH
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';

// SwapMode API endpoint
const SWAPMODE_API = 'https://api.swapmode.fi/v1';

// Contract addresses on Mode Network
export const MODE_CONTRACTS = {
  // SwapMode V2 (AMM)
  swapModeV2Router: '0xc1e624C810D297FD70eF53B0E08F44FABE468591',
  swapModeV2Factory: '0xfb926356BAf861c93C3557D7327Dbe8734A71891',
  // SwapMode V3 (Concentrated Liquidity)
  swapModeV3Factory: '0x6E36FC34eA123044F278d3a9F3819027B21c9c32',
  swapModeV3PositionManager: '0xcc3726bCc27f232bC1CaAB40853AEa91ae43C216',
  swapModeV3TickLens: '0x62e879c8979694DbC3A4EF1dd324b08Ee3Ac3688',
  // SwapMode Staking
  swapModeMasterChef: '0x327Df1E6de05895d2ab08513aaDD9313Fe505d86',
  // Tokens
  smdToken: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB',
  xSmdToken: '0xFb68BBfaEF679C1E653b5cE271a0A383c0df6B45',
  // Kim Exchange (Algebra-based)
  kimRouter: '0x5D61c537393cf21893BE619E36fC94cd73C77DD3', // Algebra SwapRouter
  kimFactory: '0xB5F00c2C5f8821155D8ed27E31932CFD9DB3C5D5',
  kimQuoter: '0x1E8C6F0a47ADCa9f14D30B7f77B34F1e91E96007',
} as const;

// Popular Mode tokens
export const MODE_TOKENS = {
  ETH: '0x0000000000000000000000000000000000000000', // Native token
  WETH: '0x4200000000000000000000000000000000000006', // OP Stack standard
  USDC: '0xd988097fb8612cc24eeC14542bC03424c656005f',
  USDT: '0xf0F161fDA2712DB8b566946122a5af183995e2eD',
  MODE: '0xDfc7C877a950e49D2610114102175A06C2e3167a', // Mode native token
  SMD: '0xFDa619b6d20975be80A10332cD39b9a4b0FAa8BB', // SwapMode token
  ezETH: '0x2416092f143378750bb29b79eD961ab195CcEea5', // Renzo ezETH
  weETH: '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A', // ether.fi weETH
} as const;

export interface ModeQuote {
  aggregator: 'swapmode-v2' | 'swapmode-v3' | 'kim';
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
  path: string[];
  poolFees?: number[]; // V3 pool fee tiers
}

/**
 * Get quote from SwapMode V2 (AMM)
 */
export async function getSwapModeV2Quote(
  request: SwapRequest
): Promise<ModeQuote | null> {
  if (request.chainId !== 'mode') return null;

  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const isNativeOut = isNativeToken(request.tokenOut);

    const tokenIn = isNativeIn ? MODE_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeOut ? MODE_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed
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
      aggregator: 'swapmode-v2',
      amountOut: minAmountOut,
      estimatedGas: 150000n,
      priceImpact: 0.5,
      route: [{
        dex: 'SwapMode V2',
        poolAddress: MODE_CONTRACTS.swapModeV2Factory,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: encodeV2Swap(swapMethod, request, path),
      txTo: MODE_CONTRACTS.swapModeV2Router,
      txValue: isNativeIn ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from SwapMode V3 (Concentrated Liquidity)
 */
export async function getSwapModeV3Quote(
  request: SwapRequest
): Promise<ModeQuote | null> {
  if (request.chainId !== 'mode') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? MODE_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? MODE_TOKENS.WETH : request.tokenOut;

    const path = buildPath(tokenIn, tokenOut);
    const poolFees = [3000]; // Default 0.3% fee tier

    const estimatedOutput = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'swapmode-v3',
      amountOut: estimatedOutput,
      estimatedGas: 180000n,
      priceImpact: 0.3,
      route: [{
        dex: 'SwapMode V3',
        poolAddress: MODE_CONTRACTS.swapModeV3Factory,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: encodeV3Swap(request, path, poolFees),
      txTo: MODE_CONTRACTS.swapModeV3PositionManager,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
      poolFees,
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from Kim Exchange (Algebra-based)
 */
export async function getKimQuote(
  request: SwapRequest
): Promise<ModeQuote | null> {
  if (request.chainId !== 'mode') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? MODE_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? MODE_TOKENS.WETH : request.tokenOut;

    const path = buildPath(tokenIn, tokenOut);
    const estimatedOutput = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'kim',
      amountOut: estimatedOutput,
      estimatedGas: 200000n,
      priceImpact: 0.3,
      route: [{
        dex: 'Kim Exchange',
        poolAddress: MODE_CONTRACTS.kimFactory,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: encodeAlgebraSwap(request, path),
      txTo: MODE_CONTRACTS.kimRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote from all Mode DEXes
 */
export async function getModeBestQuote(
  request: SwapRequest
): Promise<ModeQuote | null> {
  if (request.chainId !== 'mode') return null;

  const quotes = await Promise.all([
    getSwapModeV3Quote(request),
    getSwapModeV2Quote(request),
    getKimQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is ModeQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Mode
 */
export async function buildModeSwapTransaction(
  quote: ModeQuote,
  recipient: string
): Promise<{ to: string; data: string; value: bigint }> {
  return {
    to: quote.txTo,
    data: quote.txData,
    value: quote.txValue,
  };
}

/**
 * Get list of available DEXes on Mode
 */
export function getModeDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'SwapMode V3', type: 'concentrated-liquidity', router: MODE_CONTRACTS.swapModeV3PositionManager },
    { name: 'SwapMode V2', type: 'amm', router: MODE_CONTRACTS.swapModeV2Router },
    { name: 'Kim Exchange', type: 'algebra', router: MODE_CONTRACTS.kimRouter },
  ];
}

/**
 * Check if chain is Mode
 */
export function isModeChain(chainId: string): boolean {
  return chainId === 'mode';
}

/**
 * Get Mode chain ID
 */
export function getModeChainId(): number {
  return EVM_CHAIN_IDS.mode;
}

/**
 * Get popular trading pairs on Mode
 */
export function getModePopularPairs(): { tokenIn: string; tokenOut: string; name: string }[] {
  return [
    { tokenIn: MODE_TOKENS.ETH, tokenOut: MODE_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: MODE_TOKENS.ETH, tokenOut: MODE_TOKENS.MODE, name: 'ETH/MODE' },
    { tokenIn: MODE_TOKENS.MODE, tokenOut: MODE_TOKENS.USDC, name: 'MODE/USDC' },
    { tokenIn: MODE_TOKENS.WETH, tokenOut: MODE_TOKENS.ezETH, name: 'WETH/ezETH' },
    { tokenIn: MODE_TOKENS.WETH, tokenOut: MODE_TOKENS.weETH, name: 'WETH/weETH' },
    { tokenIn: MODE_TOKENS.SMD, tokenOut: MODE_TOKENS.WETH, name: 'SMD/WETH' },
    { tokenIn: MODE_TOKENS.USDC, tokenOut: MODE_TOKENS.USDT, name: 'USDC/USDT' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === MODE_TOKENS.ETH ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function buildPath(tokenIn: string, tokenOut: string): string[] {
  // If either token is WETH, direct path
  if (tokenIn === MODE_TOKENS.WETH || tokenOut === MODE_TOKENS.WETH) {
    return [tokenIn, tokenOut];
  }
  // Otherwise route through WETH
  return [tokenIn, MODE_TOKENS.WETH, tokenOut];
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return amountIn * (10000n - slippageBps) / 10000n;
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

function encodeV3Swap(
  request: SwapRequest,
  path: string[],
  poolFees: number[]
): string {
  // Uniswap V3 exactInputSingle function selector
  const EXACT_INPUT_SINGLE_SELECTOR = '0x414bf389';
  return EXACT_INPUT_SINGLE_SELECTOR;
}

function encodeAlgebraSwap(
  request: SwapRequest,
  path: string[]
): string {
  // Algebra SwapRouter exactInputSingle function selector
  const EXACT_INPUT_SINGLE_SELECTOR = '0xbc651188';
  return EXACT_INPUT_SINGLE_SELECTOR;
}
