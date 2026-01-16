/**
 * Gnosis Chain DEX Integration
 *
 * Gnosis Chain (formerly xDai) is an EVM-compatible sidechain with
 * stable transaction fees paid in xDAI (bridged DAI).
 *
 * Primary DEXes:
 * - Balancer V2 - Weighted pools and stable pools
 * - Curve Finance - Stable swaps
 * - SushiSwap - Uniswap V2 style AMM
 * - CoW Protocol - MEV-protected batch auctions
 *
 * Chain ID: 100
 * Native Token: xDAI (stablecoin)
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';
import { EVM_CHAIN_IDS } from './chains.js';

// Gnosis Chain ID
export const GNOSIS_CHAIN_ID = 100;

// DEX Router Addresses
export const GNOSIS_ROUTERS = {
  balancerVault: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', // Balancer V2 Vault
  balancerRouter: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', // Same as Vault for swaps
  curveRouter: '0xF0d4c12A5768D806021F80a262B4d39d26C58b8D', // Curve Router
  sushiswapRouter: '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506', // SushiSwap Router
  cowSettlement: '0x9008D19f58AAbD9eD0D60971565AA8510560ab41', // CoW Protocol Settlement
  honeyswapRouter: '0x1C232F01118CB8B424793ae03F870aa7D0ac7f77', // Honeyswap Router
} as const;

// Factory Addresses
export const GNOSIS_FACTORIES = {
  balancerPoolFactory: '0xf302f9F50958c5593770FDf4d4812309fF77414f', // Weighted Pool Factory
  curveFactory: '0xD19d36FF2879Ef6222E7f7A8EF2462C07bB9B08b', // Curve Factory
  sushiswapFactory: '0xc35DADB65012eC5796536bD9864eD8773aBc74C4', // SushiSwap Factory
} as const;

// Common Gnosis Tokens
export const GNOSIS_TOKENS = {
  XDAI: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native xDAI
  WXDAI: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', // Wrapped xDAI
  WETH: '0x6A023CCd1ff6F2045C3309768eAd9E68F978f6e1', // Wrapped ETH
  GNO: '0x9C58BAcC331c9aa871AFD802DB6379a98e80CEdb', // Gnosis Token
  USDC: '0xDDAfbb505ad214D7b80b1f830fcCc89B60fb7A83', // USDC
  USDT: '0x4ECaBa5870353805a9F068101A40E0f32ed605C6', // USDT
  WBTC: '0x8e5bBbb09Ed1ebdE8674Cda39A0c169401db4252', // Wrapped BTC
  sDAI: '0xaf204776c7245bF4147c2612BF6e5972Ee483701', // Savings DAI
  COW: '0x177127622c4A00F3d409B75571e12cB3c8973d3c', // CoW Protocol Token
  BAL: '0x7eF541E2a22058048904fE5744f9c7E4C57AF717', // Balancer Token
} as const;

// Balancer API endpoints
const BALANCER_API = 'https://api.balancer.fi';
const BALANCER_SOR_API = 'https://api.balancer.fi/sor/gnosis';

// CoW Protocol API
const COW_API = 'https://api.cow.fi/xdai/api/v1';

// Balancer V2 Vault ABI fragments
export const BALANCER_VAULT_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      {
        name: 'singleSwap',
        type: 'tuple',
        components: [
          { name: 'poolId', type: 'bytes32' },
          { name: 'kind', type: 'uint8' },
          { name: 'assetIn', type: 'address' },
          { name: 'assetOut', type: 'address' },
          { name: 'amount', type: 'uint256' },
          { name: 'userData', type: 'bytes' },
        ],
      },
      {
        name: 'funds',
        type: 'tuple',
        components: [
          { name: 'sender', type: 'address' },
          { name: 'fromInternalBalance', type: 'bool' },
          { name: 'recipient', type: 'address' },
          { name: 'toInternalBalance', type: 'bool' },
        ],
      },
      { name: 'limit', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountCalculated', type: 'uint256' }],
  },
  {
    name: 'batchSwap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'kind', type: 'uint8' },
      {
        name: 'swaps',
        type: 'tuple[]',
        components: [
          { name: 'poolId', type: 'bytes32' },
          { name: 'assetInIndex', type: 'uint256' },
          { name: 'assetOutIndex', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'userData', type: 'bytes' },
        ],
      },
      { name: 'assets', type: 'address[]' },
      {
        name: 'funds',
        type: 'tuple',
        components: [
          { name: 'sender', type: 'address' },
          { name: 'fromInternalBalance', type: 'bool' },
          { name: 'recipient', type: 'address' },
          { name: 'toInternalBalance', type: 'bool' },
        ],
      },
      { name: 'limits', type: 'int256[]' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'assetDeltas', type: 'int256[]' }],
  },
] as const;

// SushiSwap Router ABI fragments
export const SUSHISWAP_ROUTER_ABI = [
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
] as const;

export interface GnosisQuote extends AggregatorQuote {
  aggregator: DexAggregator;
  dexName?: string;
  poolId?: string;
}

/**
 * Get quote from Balancer V2 using Smart Order Router (SOR)
 */
export async function getBalancerQuote(
  request: SwapRequest
): Promise<GnosisQuote | null> {
  if (request.chainId !== 'gnosis') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenOut;

    // Use Balancer SOR API for optimal routing
    const sorResponse = await fetch(BALANCER_SOR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sellToken: tokenIn,
        buyToken: tokenOut,
        orderKind: 'sell',
        amount: request.amountIn.toString(),
        gasPrice: '1000000000', // 1 gwei default for Gnosis
      }),
    });

    if (sorResponse.ok) {
      const data = (await sorResponse.json()) as {
        returnAmount?: string;
        swaps?: Array<{
          poolId?: string;
          assetInIndex?: number;
          assetOutIndex?: number;
          amount?: string;
        }>;
        tokenAddresses?: string[];
        gasEstimate?: string;
        priceImpact?: string;
      };

      const route = parseBalancerRoute(data.swaps, data.tokenAddresses, tokenIn, tokenOut);

      return {
        aggregator: '1inch' as DexAggregator, // Placeholder for 'balancer'
        amountOut: BigInt(data.returnAmount || '0'),
        estimatedGas: BigInt(data.gasEstimate || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route,
        txData: encodeBalancerSwap(data.swaps, data.tokenAddresses, request),
        txTo: GNOSIS_ROUTERS.balancerVault,
        txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
        dexName: 'Balancer V2',
        poolId: data.swaps?.[0]?.poolId,
      };
    }

    return buildBalancerFallbackQuote(request);
  } catch {
    return buildBalancerFallbackQuote(request);
  }
}

/**
 * Get quote from CoW Protocol (MEV-protected)
 */
export async function getCowSwapQuote(
  request: SwapRequest
): Promise<GnosisQuote | null> {
  if (request.chainId !== 'gnosis') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenOut;

    const quoteResponse = await fetch(`${COW_API}/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        sellToken: tokenIn,
        buyToken: tokenOut,
        sellAmountBeforeFee: request.amountIn.toString(),
        kind: 'sell',
        receiver: request.recipient || '0x0000000000000000000000000000000000000000',
        validTo: Math.floor(Date.now() / 1000) + 1800, // 30 min validity
        appData: '0x0000000000000000000000000000000000000000000000000000000000000000',
        partiallyFillable: false,
        from: request.recipient || '0x0000000000000000000000000000000000000000',
      }),
    });

    if (quoteResponse.ok) {
      const data = (await quoteResponse.json()) as {
        quote?: {
          sellAmount?: string;
          buyAmount?: string;
          feeAmount?: string;
        };
        id?: string;
      };

      if (data.quote) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder for 'cow'
          amountOut: BigInt(data.quote.buyAmount || '0'),
          estimatedGas: 0n, // CoW Protocol is gasless for users
          priceImpact: 0, // MEV-protected, minimal price impact
          route: [
            {
              dex: 'CoW Protocol',
              poolAddress: GNOSIS_ROUTERS.cowSettlement,
              tokenIn: request.tokenIn,
              tokenOut: request.tokenOut,
              percentage: 100,
            },
          ],
          txData: '0x', // CoW uses off-chain signing
          txTo: GNOSIS_ROUTERS.cowSettlement,
          txValue: 0n,
          dexName: 'CoW Protocol',
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from SushiSwap
 */
export async function getSushiSwapGnosisQuote(
  request: SwapRequest
): Promise<GnosisQuote | null> {
  if (request.chainId !== 'gnosis') {
    return null;
  }

  try {
    const tokenIn = isNativeToken(request.tokenIn)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenOut;

    // Build path through WXDAI if needed
    const path =
      tokenIn === GNOSIS_TOKENS.WXDAI || tokenOut === GNOSIS_TOKENS.WXDAI
        ? [tokenIn, tokenOut]
        : [tokenIn, GNOSIS_TOKENS.WXDAI, tokenOut];

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
          dex: 'SushiSwap',
          poolAddress: GNOSIS_FACTORIES.sushiswapFactory,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: encodeSushiSwap(request, path),
      txTo: GNOSIS_ROUTERS.sushiswapRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      dexName: 'SushiSwap',
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from Curve Finance
 */
export async function getCurveGnosisQuote(
  request: SwapRequest
): Promise<GnosisQuote | null> {
  if (request.chainId !== 'gnosis') {
    return null;
  }

  try {
    // Curve is best for stable-to-stable swaps
    const stableTokens = [
      GNOSIS_TOKENS.WXDAI.toLowerCase(),
      GNOSIS_TOKENS.USDC.toLowerCase(),
      GNOSIS_TOKENS.USDT.toLowerCase(),
      GNOSIS_TOKENS.sDAI.toLowerCase(),
    ];

    const tokenIn = isNativeToken(request.tokenIn)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenOut;

    const isStableSwap =
      stableTokens.includes(tokenIn.toLowerCase()) &&
      stableTokens.includes(tokenOut.toLowerCase());

    if (!isStableSwap) {
      return null; // Curve is mainly for stables on Gnosis
    }

    // Curve has minimal slippage for stable swaps
    const estimatedOutput = calculateEstimatedOutput(
      request.amountIn,
      0.05 // 0.05% slippage for stables
    );

    return {
      aggregator: '1inch' as DexAggregator,
      amountOut: estimatedOutput,
      estimatedGas: 180000n,
      priceImpact: 0.01, // Very low for stable swaps
      route: [
        {
          dex: 'Curve',
          poolAddress: GNOSIS_ROUTERS.curveRouter,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: '0x', // Would need proper Curve encoding
      txTo: GNOSIS_ROUTERS.curveRouter,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      dexName: 'Curve',
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote for Gnosis chain
 */
export async function getGnosisBestQuote(
  request: SwapRequest
): Promise<GnosisQuote | null> {
  if (request.chainId !== 'gnosis') {
    return null;
  }

  const quotes = await Promise.all([
    getBalancerQuote(request),
    getCowSwapQuote(request),
    getSushiSwapGnosisQuote(request),
    getCurveGnosisQuote(request),
  ]);

  const validQuotes = quotes.filter(
    (q): q is GnosisQuote => q !== null && q.amountOut > 0n
  );

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Gnosis
 */
export function buildGnosisSwapTransaction(
  quote: GnosisQuote,
  recipient: string
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || GNOSIS_ROUTERS.balancerVault,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Gnosis
 */
export function getGnosisDexes(): { name: string; type: string; router: string }[] {
  return [
    { name: 'Balancer V2', type: 'weighted-pools', router: GNOSIS_ROUTERS.balancerVault },
    { name: 'CoW Protocol', type: 'batch-auction', router: GNOSIS_ROUTERS.cowSettlement },
    { name: 'Curve', type: 'stable-swap', router: GNOSIS_ROUTERS.curveRouter },
    { name: 'SushiSwap', type: 'amm', router: GNOSIS_ROUTERS.sushiswapRouter },
    { name: 'Honeyswap', type: 'amm', router: GNOSIS_ROUTERS.honeyswapRouter },
  ];
}

/**
 * Check if chain is Gnosis
 */
export function isGnosisChain(chainId: string): boolean {
  return chainId === 'gnosis';
}

/**
 * Get Gnosis chain ID
 */
export function getGnosisChainId(): number {
  return EVM_CHAIN_IDS.gnosis;
}

/**
 * Get popular trading pairs on Gnosis
 */
export function getGnosisPopularPairs(): Array<{
  tokenIn: string;
  tokenOut: string;
  name: string;
}> {
  return [
    { tokenIn: GNOSIS_TOKENS.XDAI, tokenOut: GNOSIS_TOKENS.WETH, name: 'xDAI/WETH' },
    { tokenIn: GNOSIS_TOKENS.XDAI, tokenOut: GNOSIS_TOKENS.GNO, name: 'xDAI/GNO' },
    { tokenIn: GNOSIS_TOKENS.WXDAI, tokenOut: GNOSIS_TOKENS.USDC, name: 'WXDAI/USDC' },
    { tokenIn: GNOSIS_TOKENS.WETH, tokenOut: GNOSIS_TOKENS.GNO, name: 'WETH/GNO' },
    { tokenIn: GNOSIS_TOKENS.WXDAI, tokenOut: GNOSIS_TOKENS.sDAI, name: 'WXDAI/sDAI' },
    { tokenIn: GNOSIS_TOKENS.WETH, tokenOut: GNOSIS_TOKENS.WBTC, name: 'WETH/WBTC' },
    { tokenIn: GNOSIS_TOKENS.XDAI, tokenOut: GNOSIS_TOKENS.COW, name: 'xDAI/COW' },
  ];
}

// Helper functions

function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address === GNOSIS_TOKENS.XDAI ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  );
}

function parseBalancerRoute(
  swaps: unknown,
  tokenAddresses: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(swaps) || !Array.isArray(tokenAddresses)) {
    return [
      {
        dex: 'Balancer V2',
        poolAddress: '',
        tokenIn,
        tokenOut,
        percentage: 100,
      },
    ];
  }

  try {
    return swaps.map((swap: { poolId?: string; assetInIndex?: number; assetOutIndex?: number }) => ({
      dex: 'Balancer V2',
      poolAddress: swap.poolId || '',
      tokenIn: tokenAddresses[swap.assetInIndex || 0] || tokenIn,
      tokenOut: tokenAddresses[swap.assetOutIndex || 0] || tokenOut,
      percentage: 100 / swaps.length,
    }));
  } catch {
    return [
      {
        dex: 'Balancer V2',
        poolAddress: '',
        tokenIn,
        tokenOut,
        percentage: 100,
      },
    ];
  }
}

function buildBalancerFallbackQuote(request: SwapRequest): GnosisQuote | null {
  try {
    const isNativeIn = isNativeToken(request.tokenIn);
    const tokenIn = isNativeIn ? GNOSIS_TOKENS.WXDAI : request.tokenIn;
    const tokenOut = isNativeToken(request.tokenOut)
      ? GNOSIS_TOKENS.WXDAI
      : request.tokenOut;

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
          dex: 'Balancer V2',
          poolAddress: GNOSIS_ROUTERS.balancerVault,
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: '0x',
      txTo: GNOSIS_ROUTERS.balancerVault,
      txValue: isNativeIn ? request.amountIn : 0n,
      dexName: 'Balancer V2',
    };
  } catch {
    return null;
  }
}

function calculateEstimatedOutput(amountIn: bigint, slippage: number): bigint {
  const slippageBps = BigInt(Math.floor(slippage * 10000));
  return (amountIn * (10000n - slippageBps)) / 10000n;
}

function encodeBalancerSwap(
  swaps: unknown,
  tokenAddresses: unknown,
  request: SwapRequest
): string {
  // Simplified encoding - in production use viem for proper ABI encoding
  // Single swap selector
  const SWAP_SELECTOR = '0x52bbbe29';
  return SWAP_SELECTOR;
}

function encodeSushiSwap(request: SwapRequest, path: string[]): string {
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
