/**
 * Mantle Chain DEX Integrations
 *
 * Mantle is a high-performance Ethereum L2 with ~$1B TVL,
 * using MNT as native gas token. Built with modular architecture.
 *
 * Native DEXes:
 * - Merchant Moe - Primary DEX (Liquidity Book, similar to Trader Joe)
 * - Agni Finance - V3-style concentrated liquidity DEX
 * - FusionX - Another popular V3 DEX
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Mantle Chain ID
export const MANTLE_CHAIN_ID = 5000;

// Mantle DEX Router Addresses
export const MANTLE_ROUTERS = {
  merchantMoe: '0xeaEE7EE68874218c3558b40063c42B82D3E7232a', // Merchant Moe LB Router
  agni: '0x319B69888b0d11cEC22caA5034e25FfFBDc88421', // Agni Finance Router
  fusionx: '0x5989FB161568b9F133eDf5Cf6787f5597762797F', // FusionX V3 Router
} as const;

// Mantle Factory Addresses
export const MANTLE_FACTORIES = {
  merchantMoe: '0x8597db3ba8de6baadEda8cba4dAC653E24a0e57B', // LB Factory
  agni: '0x25780dc8Fc3cfBD75F33bFDAB65e969b603b2035', // Agni Factory
  fusionx: '0x530d2766D1988CC1c000C8b7d00334c14B69AD71', // FusionX Factory
} as const;

// Common Mantle Tokens
export const MANTLE_TOKENS = {
  MNT: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native MNT
  WMNT: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', // Wrapped MNT
  USDC: '0x09Bc4E0D864854c6aFB6eB9A9cdF58aC190D0dF9', // USDC
  USDT: '0x201EBa5CC46D216Ce6DC03F6a759e8E766e956aE', // USDT
  WETH: '0xdEAddEaDdeadDEadDEADDEAddEADDEAddead1111', // Wrapped ETH
  WBTC: '0xCAbAE6f6Ea1ecaB08Ad02fE02ce9A44F09aebfA2', // Wrapped BTC
  MOE: '0x4515A45337F461A11Ff0FE8aBF3c606AE5dC00c9', // Merchant Moe token
  METH: '0xcDA86A272531e8640cD7F1a92c01839911B90bb0', // mETH (Mantle staked ETH)
};

// Merchant Moe API endpoint
const MERCHANT_MOE_API = 'https://api.merchantmoe.com/v1';

// Merchant Moe LB Router ABI (Liquidity Book style)
export const MERCHANT_MOE_ROUTER_ABI = [
  {
    name: 'swapExactTokensForTokens',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'tuple[]', components: [
        { name: 'pairBinSteps', type: 'uint256[]' },
        { name: 'versions', type: 'uint8[]' },
        { name: 'tokenPath', type: 'address[]' },
      ]},
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'swapExactNATIVEForTokens',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path', type: 'tuple[]', components: [
        { name: 'pairBinSteps', type: 'uint256[]' },
        { name: 'versions', type: 'uint8[]' },
        { name: 'tokenPath', type: 'address[]' },
      ]},
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'swapExactTokensForNATIVE',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMinNATIVE', type: 'uint256' },
      { name: 'path', type: 'tuple[]', components: [
        { name: 'pairBinSteps', type: 'uint256[]' },
        { name: 'versions', type: 'uint8[]' },
        { name: 'tokenPath', type: 'address[]' },
      ]},
      { name: 'to', type: 'address' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'getSwapOut',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'pair', type: 'address' },
      { name: 'amountIn', type: 'uint128' },
      { name: 'swapForY', type: 'bool' },
    ],
    outputs: [
      { name: 'amountInLeft', type: 'uint128' },
      { name: 'amountOut', type: 'uint128' },
      { name: 'fee', type: 'uint128' },
    ],
  },
] as const;

// Agni Finance Router ABI (V3 style)
export const AGNI_ROUTER_ABI = [
  {
    name: 'exactInputSingle',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
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
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'exactInput',
    type: 'function',
    stateMutability: 'payable',
    inputs: [{
      name: 'params',
      type: 'tuple',
      components: [
        { name: 'path', type: 'bytes' },
        { name: 'recipient', type: 'address' },
        { name: 'deadline', type: 'uint256' },
        { name: 'amountIn', type: 'uint256' },
        { name: 'amountOutMinimum', type: 'uint256' },
      ],
    }],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
] as const;

export interface MantleQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from Merchant Moe
 */
export async function getMerchantMoeQuote(
  request: SwapRequest
): Promise<MantleQuote | null> {
  if (request.chainId !== 'mantle') {
    return null;
  }

  try {
    // Try Merchant Moe API for quote
    const quoteResponse = await fetch(`${MERCHANT_MOE_API}/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amountIn: request.amountIn.toString(),
        slippage: request.slippage,
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder for 'merchantmoe'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'merchantmoe',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || MANTLE_ROUTERS.merchantMoe,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Agni Finance
 */
export async function getAgniQuote(
  request: SwapRequest
): Promise<MantleQuote | null> {
  if (request.chainId !== 'mantle') {
    return null;
  }

  try {
    // Agni Finance API
    const quoteResponse = await fetch('https://api.agni.finance/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: MANTLE_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '180000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'agni',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || MANTLE_ROUTERS.agni,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from FusionX
 */
export async function getFusionXQuote(
  request: SwapRequest
): Promise<MantleQuote | null> {
  if (request.chainId !== 'mantle') {
    return null;
  }

  try {
    // FusionX API
    const quoteResponse = await fetch('https://api.fusionx.finance/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: MANTLE_CHAIN_ID,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      return {
        aggregator: '1inch' as DexAggregator, // Placeholder
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '180000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'fusionx',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || MANTLE_ROUTERS.fusionx,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Mantle chain
 * Note: Mantle also has 1inch support, this provides native DEX fallback
 */
export async function getMantleBestQuote(
  request: SwapRequest
): Promise<MantleQuote | null> {
  if (request.chainId !== 'mantle') {
    return null;
  }

  const quotes = await Promise.all([
    getMerchantMoeQuote(request),
    getAgniQuote(request),
    getFusionXQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is MantleQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Mantle
 */
export function buildMantleSwapTransaction(
  quote: MantleQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || MANTLE_ROUTERS.merchantMoe,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Mantle
 */
export function getMantleDexes(): string[] {
  return ['merchantmoe', 'agni', 'fusionx'];
}

/**
 * Check if chain is Mantle
 */
export function isMantleChain(chainId: string): boolean {
  return chainId === 'mantle';
}

/**
 * Get Mantle chain ID
 */
export function getMantleChainId(): number {
  return MANTLE_CHAIN_ID;
}

/**
 * Get popular trading pairs on Mantle
 */
export function getMantlePopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: MANTLE_TOKENS.MNT, tokenOut: MANTLE_TOKENS.USDC, name: 'MNT/USDC' },
    { tokenIn: MANTLE_TOKENS.WMNT, tokenOut: MANTLE_TOKENS.USDC, name: 'WMNT/USDC' },
    { tokenIn: MANTLE_TOKENS.MNT, tokenOut: MANTLE_TOKENS.USDT, name: 'MNT/USDT' },
    { tokenIn: MANTLE_TOKENS.WETH, tokenOut: MANTLE_TOKENS.WMNT, name: 'WETH/WMNT' },
    { tokenIn: MANTLE_TOKENS.METH, tokenOut: MANTLE_TOKENS.WETH, name: 'mETH/WETH' },
    { tokenIn: MANTLE_TOKENS.USDC, tokenOut: MANTLE_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: MANTLE_TOKENS.MOE, tokenOut: MANTLE_TOKENS.WMNT, name: 'MOE/WMNT' },
  ];
}
