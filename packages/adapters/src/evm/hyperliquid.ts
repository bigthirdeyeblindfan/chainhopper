/**
 * Hyperliquid Chain DEX Integration
 *
 * Hyperliquid is a high-performance L1 focused on perpetuals trading.
 * HyperEVM provides EVM compatibility for spot trading.
 * Primary DEX: Native Hyperliquid Spot (order book based)
 *
 * Chain ID: 999 (HyperEVM)
 * Native Token: HYPE
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';

// Chain constant
export const HYPERLIQUID_CHAIN_ID = 999;

// Hyperliquid API endpoints
const HYPERLIQUID_API = 'https://api.hyperliquid.xyz';
const HYPERLIQUID_INFO_API = 'https://api.hyperliquid.xyz/info';
const HYPERLIQUID_EXCHANGE_API = 'https://api.hyperliquid.xyz/exchange';

// Contract addresses on Hyperliquid (HyperEVM)
export const HYPERLIQUID_ROUTERS = {
  // Native spot trading (order book)
  spotRouter: '0x2222222222222222222222222222222222222222', // Placeholder - native spot
  // Bridge contracts
  bridge: '0x3333333333333333333333333333333333333333', // Placeholder
  // Multicall
  multicall3: '0xcA11bde05977b3631167028862bE2a173976CA11',
} as const;

export const HYPERLIQUID_FACTORIES = {
  spotOrderbook: '0x1111111111111111111111111111111111111111', // Placeholder
} as const;

// Popular Hyperliquid tokens
export const HYPERLIQUID_TOKENS = {
  HYPE: '0x0000000000000000000000000000000000000000', // Native token
  WHYPE: '0x5555555555555555555555555555555555555555', // Wrapped HYPE (placeholder)
  USDC: '0xUSDC0000000000000000000000000000000000', // Native USDC (placeholder)
  USDT: '0xUSDT0000000000000000000000000000000000', // Tether (placeholder)
  WETH: '0xWETH0000000000000000000000000000000000', // Wrapped ETH (placeholder)
  WBTC: '0xWBTC0000000000000000000000000000000000', // Wrapped BTC (placeholder)
  PURR: '0xPURR0000000000000000000000000000000000', // Hyperliquid Points token (placeholder)
} as const;

export interface HyperliquidQuote {
  aggregator: 'hyperliquid-spot' | 'hyperliquid-perps';
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
  path: string[];
  orderType?: 'limit' | 'market';
  midPrice?: number;
}

// Hyperliquid Spot Trading API types
interface HyperliquidMeta {
  universe: Array<{
    name: string;
    szDecimals: number;
  }>;
}

interface HyperliquidSpotMeta {
  tokens: Array<{
    name: string;
    szDecimals: number;
    weiDecimals: number;
    index: number;
    tokenId: string;
  }>;
  universe: Array<{
    name: string;
    tokens: [number, number];
    index: number;
  }>;
}

interface HyperliquidOrderbook {
  levels: Array<[{ px: string; sz: string; n: number }, { px: string; sz: string; n: number }]>;
}

/**
 * Get quote from Hyperliquid Spot (order book based)
 */
export async function getHyperliquidSpotQuote(
  request: SwapRequest
): Promise<HyperliquidQuote | null> {
  if (request.chainId !== 'hyperliquid') return null;

  try {
    // Get spot metadata to find the trading pair
    const metaResponse = await fetch(HYPERLIQUID_INFO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'spotMeta' }),
    });

    if (!metaResponse.ok) {
      return buildHyperliquidFallbackQuote(request, 'market');
    }

    const spotMeta = await metaResponse.json() as HyperliquidSpotMeta;

    // Find the relevant trading pair
    const tokenInSymbol = getTokenSymbol(request.tokenIn);
    const tokenOutSymbol = getTokenSymbol(request.tokenOut);

    // Get orderbook for the pair
    const orderbookResponse = await fetch(HYPERLIQUID_INFO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'l2Book',
        coin: `${tokenInSymbol}/${tokenOutSymbol}`,
      }),
    });

    if (!orderbookResponse.ok) {
      return buildHyperliquidFallbackQuote(request, 'market');
    }

    const orderbook = await orderbookResponse.json() as HyperliquidOrderbook;

    // Calculate output based on orderbook depth
    const { amountOut, priceImpact, midPrice } = calculateOrderbookOutput(
      request.amountIn,
      orderbook,
      request.slippage
    );

    return {
      aggregator: 'hyperliquid-spot',
      amountOut,
      estimatedGas: 100000n, // Lower gas for native orderbook
      priceImpact,
      route: [{
        dex: 'Hyperliquid Spot',
        poolAddress: HYPERLIQUID_ROUTERS.spotRouter,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x', // Native API call, not EVM tx
      txTo: HYPERLIQUID_ROUTERS.spotRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path: [request.tokenIn, request.tokenOut],
      orderType: 'market',
      midPrice,
    };
  } catch {
    return buildHyperliquidFallbackQuote(request, 'market');
  }
}

/**
 * Get quote for Hyperliquid Perps (for hedging/arbitrage)
 */
export async function getHyperliquidPerpsQuote(
  request: SwapRequest
): Promise<HyperliquidQuote | null> {
  if (request.chainId !== 'hyperliquid') return null;

  try {
    // Get perps metadata
    const metaResponse = await fetch(HYPERLIQUID_INFO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'meta' }),
    });

    if (!metaResponse.ok) {
      return null; // Perps not available, skip
    }

    const meta = await metaResponse.json() as HyperliquidMeta;

    // Find the relevant perp market
    const tokenSymbol = getTokenSymbol(request.tokenIn);
    const perpMarket = meta.universe.find(u => u.name === tokenSymbol);

    if (!perpMarket) {
      return null; // No perp market for this token
    }

    // Get mid price for the perp
    const allMidsResponse = await fetch(HYPERLIQUID_INFO_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'allMids' }),
    });

    if (!allMidsResponse.ok) {
      return null;
    }

    const allMids = await allMidsResponse.json() as Record<string, string>;
    const midPrice = parseFloat(allMids[tokenSymbol] || '0');

    if (midPrice === 0) {
      return null;
    }

    // Calculate output at mid price with slippage
    const slippageMultiplier = 1 - request.slippage / 100;
    const amountOut = BigInt(
      Math.floor(Number(request.amountIn) * midPrice * slippageMultiplier)
    );

    return {
      aggregator: 'hyperliquid-perps',
      amountOut,
      estimatedGas: 50000n, // Very low gas for perps
      priceImpact: 0.1, // Perps typically have lower impact
      route: [{
        dex: 'Hyperliquid Perps',
        poolAddress: HYPERLIQUID_ROUTERS.spotRouter,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: HYPERLIQUID_ROUTERS.spotRouter,
      txValue: 0n,
      path: [request.tokenIn, request.tokenOut],
      orderType: 'market',
      midPrice,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote from all Hyperliquid trading venues
 */
export async function getHyperliquidBestQuote(
  request: SwapRequest
): Promise<HyperliquidQuote | null> {
  if (request.chainId !== 'hyperliquid') return null;

  const quotes = await Promise.all([
    getHyperliquidSpotQuote(request),
    getHyperliquidPerpsQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is HyperliquidQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap/trade transaction for Hyperliquid
 */
export async function buildHyperliquidSwapTransaction(
  quote: HyperliquidQuote,
  recipient: string
): Promise<{ to: string; data: string; value: bigint }> {
  // Hyperliquid uses native API calls, not standard EVM transactions
  // This returns placeholder data for the swap router
  return {
    to: quote.txTo,
    data: quote.txData,
    value: quote.txValue,
  };
}

/**
 * Get list of available trading venues on Hyperliquid
 */
export function getHyperliquidDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Hyperliquid Spot', type: 'orderbook', router: HYPERLIQUID_ROUTERS.spotRouter },
    { name: 'Hyperliquid Perps', type: 'perpetuals', router: HYPERLIQUID_ROUTERS.spotRouter },
  ];
}

/**
 * Check if chain is Hyperliquid
 */
export function isHyperliquidChain(chainId: string): boolean {
  return chainId === 'hyperliquid';
}

/**
 * Get Hyperliquid chain ID
 */
export function getHyperliquidChainId(): number {
  return EVM_CHAIN_IDS.hyperliquid;
}

/**
 * Get popular trading pairs on Hyperliquid
 */
export function getHyperliquidPopularPairs(): { tokenIn: string; tokenOut: string; name: string }[] {
  return [
    { tokenIn: HYPERLIQUID_TOKENS.HYPE, tokenOut: HYPERLIQUID_TOKENS.USDC, name: 'HYPE/USDC' },
    { tokenIn: HYPERLIQUID_TOKENS.WETH, tokenOut: HYPERLIQUID_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: HYPERLIQUID_TOKENS.WBTC, tokenOut: HYPERLIQUID_TOKENS.USDC, name: 'BTC/USDC' },
    { tokenIn: HYPERLIQUID_TOKENS.PURR, tokenOut: HYPERLIQUID_TOKENS.USDC, name: 'PURR/USDC' },
    { tokenIn: HYPERLIQUID_TOKENS.HYPE, tokenOut: HYPERLIQUID_TOKENS.WETH, name: 'HYPE/ETH' },
  ];
}

/**
 * Get Hyperliquid spot trading fee tier
 */
export function getHyperliquidFeeTier(volume30d: number): { maker: number; taker: number } {
  // Hyperliquid fee structure (example - actual fees may vary)
  if (volume30d >= 100_000_000) {
    return { maker: 0.0001, taker: 0.00025 }; // VIP 5
  } else if (volume30d >= 25_000_000) {
    return { maker: 0.00015, taker: 0.0003 }; // VIP 4
  } else if (volume30d >= 5_000_000) {
    return { maker: 0.0002, taker: 0.00035 }; // VIP 3
  } else if (volume30d >= 1_000_000) {
    return { maker: 0.00025, taker: 0.0004 }; // VIP 2
  } else if (volume30d >= 100_000) {
    return { maker: 0.0003, taker: 0.00045 }; // VIP 1
  }
  return { maker: 0.0002, taker: 0.0005 }; // Default tier
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === HYPERLIQUID_TOKENS.HYPE ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function getTokenSymbol(address: string): string {
  // Map addresses to symbols for API calls
  const addressToSymbol: Record<string, string> = {
    [HYPERLIQUID_TOKENS.HYPE]: 'HYPE',
    [HYPERLIQUID_TOKENS.WHYPE]: 'HYPE',
    [HYPERLIQUID_TOKENS.USDC]: 'USDC',
    [HYPERLIQUID_TOKENS.USDT]: 'USDT',
    [HYPERLIQUID_TOKENS.WETH]: 'ETH',
    [HYPERLIQUID_TOKENS.WBTC]: 'BTC',
    [HYPERLIQUID_TOKENS.PURR]: 'PURR',
    'native': 'HYPE',
  };
  return addressToSymbol[address] || 'UNKNOWN';
}

function calculateOrderbookOutput(
  amountIn: bigint,
  orderbook: HyperliquidOrderbook,
  slippage: number
): { amountOut: bigint; priceImpact: number; midPrice: number } {
  // Simplified orderbook calculation
  // In production, this would walk the orderbook levels
  try {
    if (!orderbook.levels || orderbook.levels.length === 0) {
      return { amountOut: 0n, priceImpact: 0, midPrice: 0 };
    }

    const firstLevel = orderbook.levels[0];
    const bestBid = parseFloat(firstLevel[0]?.px || '0');
    const bestAsk = parseFloat(firstLevel[1]?.px || '0');
    const midPrice = (bestBid + bestAsk) / 2;

    if (midPrice === 0) {
      return { amountOut: 0n, priceImpact: 0, midPrice: 0 };
    }

    // Calculate output with slippage
    const slippageMultiplier = 1 - slippage / 100;
    const amountOut = BigInt(
      Math.floor(Number(amountIn) * midPrice * slippageMultiplier)
    );

    // Estimate price impact based on order size
    const priceImpact = Math.min(Number(amountIn) / 1e18 * 0.01, 5); // Max 5%

    return { amountOut, priceImpact, midPrice };
  } catch {
    return { amountOut: 0n, priceImpact: 0, midPrice: 0 };
  }
}

function buildHyperliquidFallbackQuote(
  request: SwapRequest,
  orderType: 'limit' | 'market'
): HyperliquidQuote | null {
  try {
    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'hyperliquid-spot',
      amountOut: minAmountOut,
      estimatedGas: 100000n,
      priceImpact: 0.5,
      route: [{
        dex: 'Hyperliquid Spot',
        poolAddress: HYPERLIQUID_ROUTERS.spotRouter,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: HYPERLIQUID_ROUTERS.spotRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path: [request.tokenIn, request.tokenOut],
      orderType,
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
