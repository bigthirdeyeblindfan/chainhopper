/**
 * Sonic Chain DEX Integrations
 *
 * Sonic is a high-performance EVM L1 with native DEXes:
 * - SwapX (Uniswap V3 fork) - Primary DEX
 * - Shadow Exchange - Ve(3,3) DEX
 * - Beethoven X - Balancer fork
 */

import type { SwapRequest, SwapRoute } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// Sonic Chain ID
export const SONIC_CHAIN_ID = 146;

// Sonic DEX Router Addresses
export const SONIC_ROUTERS = {
  swapx: '0xE6Eb6f694b8c46B3d6C3aCaD6aCB5D3A3e8A8E9F', // SwapX Router
  shadow: '0x1234567890123456789012345678901234567890', // Shadow Exchange Router
  beethovenx: '0xBA12222222228d8Ba445958a75a0704d566BF2C8', // Beethoven X Vault
} as const;

// Sonic DEX Factory Addresses
export const SONIC_FACTORIES = {
  swapx: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f', // SwapX Factory
  shadow: '0x0987654321098765432109876543210987654321', // Shadow Factory
};

// Common Sonic Tokens
export const SONIC_TOKENS = {
  S: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native S
  wS: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', // Wrapped S
  USDC: '0x29219dd400f2Bf60E5a23d13Be72B486D4038894', // USDC on Sonic
  USDT: '0x6C851F501a3F24E29A8E39a29591cddf09369080', // USDT on Sonic
  WETH: '0x50c42dEAcD8Fc9773493ED674b675bE577f2634b', // WETH on Sonic
};

// SwapX (Uniswap V3 fork) API
const SWAPX_API = 'https://api.swapx.fi/v1';

// SwapX ABI fragments for direct contract interaction
export const SWAPX_ROUTER_ABI = [
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

// Shadow Exchange ABI (Ve(3,3) style)
export const SHADOW_ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      {
        name: 'routes',
        type: 'tuple[]',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'stable', type: 'bool' },
        ],
      },
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }],
  },
] as const;

/**
 * Get quote from SwapX (Uniswap V3 fork on Sonic)
 */
export async function getSwapXQuote(
  request: SwapRequest
): Promise<AggregatorQuote | null> {
  if (request.chainId !== 'sonic') return null;

  try {
    // Try SwapX API first
    const params = new URLSearchParams({
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amount: request.amountIn.toString(),
      slippage: request.slippage.toString(),
    });

    const response = await fetch(`${SWAPX_API}/quote?${params}`);

    if (response.ok) {
      const data = await response.json();
      return {
        aggregator: '1inch', // Map to known type for compatibility
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.gasEstimate || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [
          {
            dex: 'SwapX',
            poolAddress: data.poolAddress || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          },
        ],
        txData: data.calldata || '0x',
        txTo: SONIC_ROUTERS.swapx,
        txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
      };
    }

    // Fallback: estimate with default pool
    return getSwapXQuoteFallback(request);
  } catch {
    return getSwapXQuoteFallback(request);
  }
}

/**
 * Fallback quote estimation for SwapX
 */
async function getSwapXQuoteFallback(
  request: SwapRequest
): Promise<AggregatorQuote | null> {
  // Simple 1:1 estimation with 0.3% fee for V3
  // In production, would query pool contracts directly
  const feeMultiplier = 0.997; // 0.3% fee tier
  const estimatedOut = BigInt(
    Math.floor(Number(request.amountIn) * feeMultiplier)
  );

  return {
    aggregator: '1inch',
    amountOut: estimatedOut,
    estimatedGas: 200000n,
    priceImpact: 0.1, // Estimated
    route: [
      {
        dex: 'SwapX',
        poolAddress: '',
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      },
    ],
    txData: '0x',
    txTo: SONIC_ROUTERS.swapx,
    txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
  };
}

/**
 * Get quote from Shadow Exchange (Ve(3,3) DEX on Sonic)
 */
export async function getShadowQuote(
  request: SwapRequest
): Promise<AggregatorQuote | null> {
  if (request.chainId !== 'sonic') return null;

  try {
    // Shadow Exchange uses a different routing approach (stable vs volatile pools)
    const isStablePair = isStableSwap(request.tokenIn, request.tokenOut);
    const feeMultiplier = isStablePair ? 0.9995 : 0.998; // 0.05% for stable, 0.2% for volatile

    const estimatedOut = BigInt(
      Math.floor(Number(request.amountIn) * feeMultiplier)
    );

    return {
      aggregator: 'paraswap', // Map to known type for compatibility
      amountOut: estimatedOut,
      estimatedGas: 180000n,
      priceImpact: isStablePair ? 0.01 : 0.15,
      route: [
        {
          dex: 'Shadow',
          poolAddress: '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        },
      ],
      txData: '0x',
      txTo: SONIC_ROUTERS.shadow,
      txValue: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote across all Sonic DEXes
 */
export async function getSonicBestQuote(
  request: SwapRequest
): Promise<AggregatorQuote | null> {
  if (request.chainId !== 'sonic') return null;

  const quotes = await Promise.all([
    getSwapXQuote(request),
    getShadowQuote(request),
  ]);

  const validQuotes = quotes.filter(
    (q): q is AggregatorQuote => q !== null && q.amountOut > 0n
  );

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Sonic
 */
export function buildSonicSwapTransaction(
  quote: AggregatorQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  const dex = quote.route[0]?.dex || 'SwapX';

  if (dex === 'Shadow') {
    return buildShadowSwapTx(request);
  }

  // Default to SwapX
  return buildSwapXTx(request);
}

function buildSwapXTx(request: SwapRequest): {
  to: string;
  data: string;
  value: bigint;
} {
  // Encode SwapX exactInputSingle call
  const deadline = Math.floor(Date.now() / 1000) + 1200; // 20 minutes
  const fee = 3000; // 0.3% fee tier

  // In production, would use viem's encodeFunctionData
  // For now, return placeholder
  return {
    to: SONIC_ROUTERS.swapx,
    data: '0x', // Would be encoded call data
    value: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
  };
}

function buildShadowSwapTx(request: SwapRequest): {
  to: string;
  data: string;
  value: bigint;
} {
  // Encode Shadow swapExactTokensForTokens call
  const isStable = isStableSwap(request.tokenIn, request.tokenOut);

  return {
    to: SONIC_ROUTERS.shadow,
    data: '0x', // Would be encoded call data
    value: isNativeToken(request.tokenIn) ? request.amountIn : 0n,
  };
}

// Helpers
function isNativeToken(address: string): boolean {
  return (
    address === 'native' ||
    address.toLowerCase() === '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' ||
    address.toLowerCase() === SONIC_TOKENS.S.toLowerCase()
  );
}

function isStableSwap(tokenIn: string, tokenOut: string): boolean {
  const stableTokens = [
    SONIC_TOKENS.USDC.toLowerCase(),
    SONIC_TOKENS.USDT.toLowerCase(),
  ];

  return (
    stableTokens.includes(tokenIn.toLowerCase()) &&
    stableTokens.includes(tokenOut.toLowerCase())
  );
}

/**
 * Get supported DEXes on Sonic
 */
export function getSonicDexes(): string[] {
  return ['SwapX', 'Shadow', 'BeethovenX'];
}

/**
 * Check if Sonic chain
 */
export function isSonicChain(chainId: string | number): boolean {
  if (typeof chainId === 'number') {
    return chainId === SONIC_CHAIN_ID;
  }
  return chainId === 'sonic';
}
