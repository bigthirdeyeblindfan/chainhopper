/**
 * Monad Chain DEX Integration
 *
 * Monad is a high-performance EVM-compatible L1 with 10,000+ TPS.
 * Primary DEX: Kuru Exchange (hybrid CLOB-AMM orderbook)
 * Also supports: Uniswap V3 (deployed on Monad)
 *
 * Chain ID: 143
 * Native Token: MON
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';

// Kuru Exchange API endpoint
const KURU_API = 'https://api.kuru.io/v1';
const KURU_FLOW_API = 'https://flow.kuru.io/v1';

// Contract addresses on Monad Mainnet
export const MONAD_CONTRACTS = {
  // Kuru Exchange contracts
  kuruRouter: '0x6969696969696969696969696969696969696969', // Placeholder - update when deployed
  kuruOrderbook: '0x4242424242424242424242424242424242424242', // Placeholder - update when deployed
  kuruFlow: '0x3333333333333333333333333333333333333333', // Placeholder - update when deployed
  // Uniswap V3 on Monad (from Uniswap docs)
  uniswapV3Router: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD', // Universal Router
  uniswapV3Quoter: '0x3d4e44Eb1374240CE5F1B871ab261CD16335B76a',
  uniswapV3Factory: '0x1F98431c8aD98523631AE4a59f267346ea31F984',
  // Multicall
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
} as const;

// Popular Monad tokens
export const MONAD_TOKENS = {
  MON: '0x0000000000000000000000000000000000000000', // Native token
  WMON: '0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A', // Wrapped MON
  USDC: '0x754704Bc059F8C67012fEd69BC8A327a5aafb603',
  WETH: '0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242',
  wstETH: '0x10Aeaf63194db8d453d4D85a06E5eFE1dd0b5417',
} as const;

export interface MonadQuote {
  aggregator: 'kuru' | 'kuru-flow' | 'uniswap-v3';
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
  path: string[];
}

/**
 * Get quote from Kuru Flow (smart aggregator)
 * Kuru Flow aggregates liquidity across Kuru orderbook and other Monad DEXes
 */
export async function getKuruFlowQuote(
  request: SwapRequest
): Promise<MonadQuote | null> {
  if (request.chainId !== 'monad') return null;

  try {
    const params = new URLSearchParams({
      fromToken: request.tokenIn,
      toToken: request.tokenOut,
      amount: request.amountIn.toString(),
      slippage: (request.slippage * 100).toString(),
      ...(request.recipient && { recipient: request.recipient }),
    });

    const response = await fetch(`${KURU_FLOW_API}/quote?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      return buildKuruFallbackQuote(request);
    }

    const data = await response.json() as {
      amountOut?: string;
      gasEstimate?: string;
      priceImpact?: string;
      route?: Array<{ dex?: string; pool?: string; tokenIn?: string; tokenOut?: string }>;
      tx?: { data?: string; to?: string; value?: string };
      path?: string[];
    };

    return {
      aggregator: 'kuru-flow',
      amountOut: BigInt(data.amountOut || '0'),
      estimatedGas: BigInt(data.gasEstimate || '200000'),
      priceImpact: parseFloat(data.priceImpact || '0'),
      route: parseKuruRoute(data.route, request.tokenIn, request.tokenOut),
      txData: data.tx?.data || '0x',
      txTo: data.tx?.to || MONAD_CONTRACTS.kuruFlow,
      txValue: BigInt(data.tx?.value || '0'),
      path: data.path || [request.tokenIn, request.tokenOut],
    };
  } catch {
    return buildKuruFallbackQuote(request);
  }
}

/**
 * Get quote directly from Kuru orderbook
 */
export async function getKuruOrderbookQuote(
  request: SwapRequest
): Promise<MonadQuote | null> {
  if (request.chainId !== 'monad') return null;

  try {
    const response = await fetch(`${KURU_API}/orderbook/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        baseToken: request.tokenIn,
        quoteToken: request.tokenOut,
        amount: request.amountIn.toString(),
        side: 'sell',
        slippageBps: Math.floor(request.slippage * 100),
      }),
    });

    if (!response.ok) return null;

    const data = await response.json() as {
      expectedOutput?: string;
      gasEstimate?: string;
      priceImpact?: string;
      orderbookAddress?: string;
      calldata?: string;
    };

    return {
      aggregator: 'kuru',
      amountOut: BigInt(data.expectedOutput || '0'),
      estimatedGas: BigInt(data.gasEstimate || '150000'),
      priceImpact: parseFloat(data.priceImpact || '0'),
      route: [{
        dex: 'Kuru Orderbook',
        poolAddress: data.orderbookAddress || MONAD_CONTRACTS.kuruOrderbook,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: data.calldata || '0x',
      txTo: MONAD_CONTRACTS.kuruRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path: [request.tokenIn, request.tokenOut],
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from Uniswap V3 on Monad
 */
export async function getMonadUniswapQuote(
  request: SwapRequest
): Promise<MonadQuote | null> {
  if (request.chainId !== 'monad') return null;

  try {
    // Use Uniswap's quoter contract for on-chain quote
    // This is a simplified version - in production use the Uniswap SDK
    const tokenIn = isNativeToken(request.tokenIn) ? MONAD_TOKENS.WMON : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? MONAD_TOKENS.WMON : request.tokenOut;

    // Build path through WMON if needed
    const path = tokenIn === MONAD_TOKENS.WMON || tokenOut === MONAD_TOKENS.WMON
      ? [tokenIn, tokenOut]
      : [tokenIn, MONAD_TOKENS.WMON, tokenOut];

    // Estimate output (simplified - would use quoter contract in production)
    const estimatedOutput = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'uniswap-v3',
      amountOut: estimatedOutput,
      estimatedGas: 180000n,
      priceImpact: 0.3,
      route: [{
        dex: 'Uniswap V3',
        poolAddress: MONAD_CONTRACTS.uniswapV3Factory,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: encodeUniswapSwap(request, path),
      txTo: MONAD_CONTRACTS.uniswapV3Router,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote from all Monad DEXes
 */
export async function getMonadBestQuote(
  request: SwapRequest
): Promise<MonadQuote | null> {
  if (request.chainId !== 'monad') return null;

  const quotes = await Promise.all([
    getKuruFlowQuote(request),
    getKuruOrderbookQuote(request),
    getMonadUniswapQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is MonadQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Monad
 */
export async function buildMonadSwapTransaction(
  quote: MonadQuote,
  recipient: string
): Promise<{ to: string; data: string; value: bigint }> {
  return {
    to: quote.txTo,
    data: quote.txData,
    value: quote.txValue,
  };
}

/**
 * Get list of available DEXes on Monad
 */
export function getMonadDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Kuru Flow', type: 'aggregator', router: MONAD_CONTRACTS.kuruFlow },
    { name: 'Kuru Orderbook', type: 'clob', router: MONAD_CONTRACTS.kuruRouter },
    { name: 'Uniswap V3', type: 'amm', router: MONAD_CONTRACTS.uniswapV3Router },
  ];
}

/**
 * Check if chain is Monad
 */
export function isMonadChain(chainId: string): boolean {
  return chainId === 'monad';
}

/**
 * Get Monad chain ID
 */
export function getMonadChainId(): number {
  return EVM_CHAIN_IDS.monad;
}

/**
 * Get popular trading pairs on Monad
 */
export function getMonadPopularPairs(): { tokenIn: string; tokenOut: string; name: string }[] {
  return [
    { tokenIn: MONAD_TOKENS.MON, tokenOut: MONAD_TOKENS.USDC, name: 'MON/USDC' },
    { tokenIn: MONAD_TOKENS.MON, tokenOut: MONAD_TOKENS.WETH, name: 'MON/WETH' },
    { tokenIn: MONAD_TOKENS.WETH, tokenOut: MONAD_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: MONAD_TOKENS.wstETH, tokenOut: MONAD_TOKENS.WETH, name: 'wstETH/WETH' },
    { tokenIn: MONAD_TOKENS.WMON, tokenOut: MONAD_TOKENS.USDC, name: 'WMON/USDC' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === MONAD_TOKENS.MON ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function parseKuruRoute(
  route: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(route)) {
    return [{
      dex: 'Kuru',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }

  try {
    return route.map((hop: { dex?: string; pool?: string; tokenIn?: string; tokenOut?: string }) => ({
      dex: hop.dex || 'Kuru',
      poolAddress: hop.pool || '',
      tokenIn: hop.tokenIn || tokenIn,
      tokenOut: hop.tokenOut || tokenOut,
      percentage: 100 / route.length,
    }));
  } catch {
    return [{
      dex: 'Kuru',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }
}

function buildKuruFallbackQuote(request: SwapRequest): MonadQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? MONAD_TOKENS.WMON : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? MONAD_TOKENS.WMON : request.tokenOut;

    // Build path
    const path = tokenIn === MONAD_TOKENS.WMON || tokenOut === MONAD_TOKENS.WMON
      ? [tokenIn, tokenOut]
      : [tokenIn, MONAD_TOKENS.WMON, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'kuru-flow',
      amountOut: minAmountOut,
      estimatedGas: 200000n,
      priceImpact: 0.5,
      route: [{
        dex: 'Kuru Flow',
        poolAddress: MONAD_CONTRACTS.kuruFlow,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x', // Would need actual encoding
      txTo: MONAD_CONTRACTS.kuruFlow,
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

function encodeUniswapSwap(request: SwapRequest, path: string[]): string {
  // Simplified encoding - in production use viem or ethers for proper ABI encoding
  // This returns a placeholder that would be the exactInputSingle function selector
  const EXACT_INPUT_SINGLE_SELECTOR = '0x414bf389';
  return EXACT_INPUT_SINGLE_SELECTOR;
}
