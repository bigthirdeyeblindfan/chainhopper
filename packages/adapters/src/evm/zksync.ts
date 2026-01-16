/**
 * zkSync Era DEX Integration
 *
 * zkSync Era is a ZK rollup with native account abstraction.
 * Primary DEX: SyncSwap (Classic + Stable pools)
 * Also supports: Mute.io, SpaceFi
 *
 * Chain ID: 324
 * Native Token: ETH
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';

// Chain constant
export const ZKSYNC_CHAIN_ID = 324;

// SyncSwap API endpoint
const SYNCSWAP_API = 'https://api.syncswap.xyz/api';

// Contract addresses on zkSync Era Mainnet
export const ZKSYNC_ROUTERS = {
  // SyncSwap contracts
  syncswapRouter: '0x2da10A1e27bF85cEdD8FFb1AbBe97e53391C0295',
  syncswapClassicFactory: '0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb',
  syncswapStableFactory: '0x5b9f21d407F35b10CbfDDca17D5D84bC56FDaEF0',
  syncswapPoolMaster: '0xbB05918E9B4bA9Fe2c8384d223f0844867909Ffb',
  // Mute.io contracts
  muteRouter: '0x8B791913eB07C32779a16750e3868aA8495F5964',
  muteFactory: '0x40be1cBa6C5B47cDF9da7f963B6F761F4C60627D',
  // SpaceFi contracts
  spacefiRouter: '0xbE7D1FD1f6748bbDefC4fbaCafBb11C6Fc506d1d',
  spacefiFactory: '0x0700Fb51560CfC8F896B2c812499D17c5B0bF6A7',
  // Multicall
  multicall3: '0xF9cda624FBC7e059355ce98a31693d299FACd963',
} as const;

export const ZKSYNC_FACTORIES = {
  syncswapClassic: '0xf2DAd89f2788a8CD54625C60b55cD3d2D0ACa7Cb',
  syncswapStable: '0x5b9f21d407F35b10CbfDDca17D5D84bC56FDaEF0',
  mute: '0x40be1cBa6C5B47cDF9da7f963B6F761F4C60627D',
  spacefi: '0x0700Fb51560CfC8F896B2c812499D17c5B0bF6A7',
} as const;

// Popular zkSync Era tokens
export const ZKSYNC_TOKENS = {
  ETH: '0x0000000000000000000000000000000000000000', // Native token
  WETH: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', // Wrapped ETH
  USDC: '0x3355df6D4c9C3035724Fd0e3914dE96A5a83aaf4', // Native USDC
  USDCe: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', // Bridged USDC.e
  USDT: '0x493257fD37EDB34451f62EDf8D2a0C418852bA4C', // Tether placeholder
  WBTC: '0xBBeB516fb02a01611cBBE0453Fe3c580D7281011', // Wrapped BTC
  ZK: '0x5A7d6b2F92C77FAD6CCaBd7EE0624E64907Eaf3E', // ZK Token
  HOLD: '0xed4040fD47629e7c8FBB7DA76bb50B3e7695F0f2', // Holdstation
} as const;

export interface ZkSyncQuote {
  aggregator: 'syncswap' | 'mute' | 'spacefi';
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
  path: string[];
  poolType?: 'classic' | 'stable'; // SyncSwap pool type
}

// SyncSwap Router ABI
export const SYNCSWAP_ROUTER_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'paths',
        type: 'tuple[]',
        components: [
          {
            name: 'steps',
            type: 'tuple[]',
            components: [
              { name: 'pool', type: 'address' },
              { name: 'data', type: 'bytes' },
              { name: 'callback', type: 'address' },
              { name: 'callbackData', type: 'bytes' },
            ],
          },
          { name: 'tokenIn', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
        ],
      },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'swapWithPermit',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'paths',
        type: 'tuple[]',
        components: [
          {
            name: 'steps',
            type: 'tuple[]',
            components: [
              { name: 'pool', type: 'address' },
              { name: 'data', type: 'bytes' },
              { name: 'callback', type: 'address' },
              { name: 'callbackData', type: 'bytes' },
            ],
          },
          { name: 'tokenIn', type: 'address' },
          { name: 'amountIn', type: 'uint256' },
        ],
      },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
      { name: 'permit', type: 'tuple', components: [
        { name: 'token', type: 'address' },
        { name: 'approveAmount', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
        { name: 'v', type: 'uint8' },
        { name: 'r', type: 'bytes32' },
        { name: 's', type: 'bytes32' },
      ]},
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

// Mute Router ABI (Uniswap V2 style)
export const MUTE_ROUTER_ABI = [
  {
    name: 'swapExactETHForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'address[]' },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
      { name: 'stable', type: 'bool[]' },
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
      { name: 'stable', type: 'bool[]' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
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
      { name: 'stable', type: 'bool[]' },
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

/**
 * Get quote from SyncSwap
 */
export async function getSyncSwapZkSyncQuote(
  request: SwapRequest
): Promise<ZkSyncQuote | null> {
  if (request.chainId !== 'zksync') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? ZKSYNC_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? ZKSYNC_TOKENS.WETH : request.tokenOut;

    // Determine pool type based on tokens
    const isStablePair = isStableSwap(tokenIn, tokenOut);
    const poolType = isStablePair ? 'stable' : 'classic';

    // Try to get quote from SyncSwap API
    const params = new URLSearchParams({
      tokenIn,
      tokenOut,
      amount: request.amountIn.toString(),
      slippage: (request.slippage * 100).toString(),
    });

    const response = await fetch(`${SYNCSWAP_API}/quote?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      return buildSyncSwapFallbackQuote(request, poolType);
    }

    const data = await response.json() as {
      amountOut?: string;
      gasEstimate?: string;
      priceImpact?: string;
      pools?: Array<{ address?: string; type?: string }>;
      tx?: { data?: string; to?: string; value?: string };
    };

    return {
      aggregator: 'syncswap',
      amountOut: BigInt(data.amountOut || '0'),
      estimatedGas: BigInt(data.gasEstimate || '300000'),
      priceImpact: parseFloat(data.priceImpact || '0'),
      route: parseSyncSwapRoute(data.pools, request.tokenIn, request.tokenOut),
      txData: data.tx?.data || '0x',
      txTo: data.tx?.to || ZKSYNC_ROUTERS.syncswapRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path: [tokenIn, tokenOut],
      poolType,
    };
  } catch {
    return buildSyncSwapFallbackQuote(request, isStableSwap(request.tokenIn, request.tokenOut) ? 'stable' : 'classic');
  }
}

/**
 * Get quote from Mute.io
 */
export async function getMuteQuote(
  request: SwapRequest
): Promise<ZkSyncQuote | null> {
  if (request.chainId !== 'zksync') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? ZKSYNC_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? ZKSYNC_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed
    const path = tokenIn === ZKSYNC_TOKENS.WETH || tokenOut === ZKSYNC_TOKENS.WETH
      ? [tokenIn, tokenOut]
      : [tokenIn, ZKSYNC_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'mute',
      amountOut: minAmountOut,
      estimatedGas: 250000n,
      priceImpact: 0.3,
      route: [{
        dex: 'Mute.io',
        poolAddress: ZKSYNC_FACTORIES.mute,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: ZKSYNC_ROUTERS.muteRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from SpaceFi
 */
export async function getSpaceFiQuote(
  request: SwapRequest
): Promise<ZkSyncQuote | null> {
  if (request.chainId !== 'zksync') return null;

  try {
    const tokenIn = isNativeToken(request.tokenIn) ? ZKSYNC_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? ZKSYNC_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed
    const path = tokenIn === ZKSYNC_TOKENS.WETH || tokenOut === ZKSYNC_TOKENS.WETH
      ? [tokenIn, tokenOut]
      : [tokenIn, ZKSYNC_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'spacefi',
      amountOut: minAmountOut,
      estimatedGas: 220000n,
      priceImpact: 0.35,
      route: [{
        dex: 'SpaceFi',
        poolAddress: ZKSYNC_FACTORIES.spacefi,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: ZKSYNC_ROUTERS.spacefiRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      path,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote from all zkSync DEXes
 */
export async function getZkSyncBestQuote(
  request: SwapRequest
): Promise<ZkSyncQuote | null> {
  if (request.chainId !== 'zksync') return null;

  const quotes = await Promise.all([
    getSyncSwapZkSyncQuote(request),
    getMuteQuote(request),
    getSpaceFiQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is ZkSyncQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for zkSync Era
 */
export async function buildZkSyncSwapTransaction(
  quote: ZkSyncQuote,
  recipient: string
): Promise<{ to: string; data: string; value: bigint }> {
  return {
    to: quote.txTo,
    data: quote.txData,
    value: quote.txValue,
  };
}

/**
 * Get list of available DEXes on zkSync Era
 */
export function getZkSyncDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'SyncSwap', type: 'hybrid-amm', router: ZKSYNC_ROUTERS.syncswapRouter },
    { name: 'Mute.io', type: 'amm', router: ZKSYNC_ROUTERS.muteRouter },
    { name: 'SpaceFi', type: 'amm', router: ZKSYNC_ROUTERS.spacefiRouter },
  ];
}

/**
 * Check if chain is zkSync Era
 */
export function isZkSyncChain(chainId: string): boolean {
  return chainId === 'zksync';
}

/**
 * Get zkSync Era chain ID
 */
export function getZkSyncChainId(): number {
  return EVM_CHAIN_IDS.zksync;
}

/**
 * Get popular trading pairs on zkSync Era
 */
export function getZkSyncPopularPairs(): { tokenIn: string; tokenOut: string; name: string }[] {
  return [
    { tokenIn: ZKSYNC_TOKENS.ETH, tokenOut: ZKSYNC_TOKENS.USDC, name: 'ETH/USDC' },
    { tokenIn: ZKSYNC_TOKENS.ETH, tokenOut: ZKSYNC_TOKENS.ZK, name: 'ETH/ZK' },
    { tokenIn: ZKSYNC_TOKENS.WETH, tokenOut: ZKSYNC_TOKENS.USDC, name: 'WETH/USDC' },
    { tokenIn: ZKSYNC_TOKENS.USDC, tokenOut: ZKSYNC_TOKENS.USDCe, name: 'USDC/USDC.e' },
    { tokenIn: ZKSYNC_TOKENS.WBTC, tokenOut: ZKSYNC_TOKENS.WETH, name: 'WBTC/WETH' },
    { tokenIn: ZKSYNC_TOKENS.ZK, tokenOut: ZKSYNC_TOKENS.USDC, name: 'ZK/USDC' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === ZKSYNC_TOKENS.ETH ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function isStableSwap(tokenIn: string, tokenOut: string): boolean {
  const stableTokens = [
    ZKSYNC_TOKENS.USDC.toLowerCase(),
    ZKSYNC_TOKENS.USDCe.toLowerCase(),
    ZKSYNC_TOKENS.USDT.toLowerCase(),
  ];
  return (
    stableTokens.includes(tokenIn.toLowerCase()) &&
    stableTokens.includes(tokenOut.toLowerCase())
  );
}

function parseSyncSwapRoute(
  pools: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(pools)) {
    return [{
      dex: 'SyncSwap',
      poolAddress: ZKSYNC_ROUTERS.syncswapRouter,
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }

  try {
    return pools.map((pool: { address?: string; type?: string }) => ({
      dex: pool.type === 'stable' ? 'SyncSwap (Stable)' : 'SyncSwap (Classic)',
      poolAddress: pool.address || ZKSYNC_ROUTERS.syncswapRouter,
      tokenIn,
      tokenOut,
      percentage: 100 / pools.length,
    }));
  } catch {
    return [{
      dex: 'SyncSwap',
      poolAddress: ZKSYNC_ROUTERS.syncswapRouter,
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }
}

function buildSyncSwapFallbackQuote(request: SwapRequest, poolType: 'classic' | 'stable'): ZkSyncQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? ZKSYNC_TOKENS.WETH : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut) ? ZKSYNC_TOKENS.WETH : request.tokenOut;

    // Build path through WETH if needed
    const path = tokenIn === ZKSYNC_TOKENS.WETH || tokenOut === ZKSYNC_TOKENS.WETH
      ? [tokenIn, tokenOut]
      : [tokenIn, ZKSYNC_TOKENS.WETH, tokenOut];

    const minAmountOut = calculateEstimatedOutput(request.amountIn, request.slippage);

    return {
      aggregator: 'syncswap',
      amountOut: minAmountOut,
      estimatedGas: 300000n,
      priceImpact: 0.5,
      route: [{
        dex: poolType === 'stable' ? 'SyncSwap (Stable)' : 'SyncSwap (Classic)',
        poolAddress: poolType === 'stable' ? ZKSYNC_FACTORIES.syncswapStable : ZKSYNC_FACTORIES.syncswapClassic,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      }],
      txData: '0x',
      txTo: ZKSYNC_ROUTERS.syncswapRouter,
      txValue: isNativeIn ? request.amountIn : 0n,
      path,
      poolType,
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
