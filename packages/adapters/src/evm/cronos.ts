/**
 * Cronos Chain DEX Integrations
 *
 * Cronos is Crypto.com's EVM-compatible chain.
 * Uses CRO as the native gas token.
 *
 * Native DEXes:
 * - VVS Finance - Primary DEX on Cronos
 * - MM Finance - Major DEX with advanced features
 * - Crodex - Native Cronos DEX
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS } from './chains.js';
import type { AggregatorQuote } from './aggregators.js';

// Cronos Chain ID
export const CRONOS_CHAIN_ID = 25;

// Cronos DEX Router Addresses
export const CRONOS_ROUTERS = {
  vvs: '0x145863Eb42Cf62847A6Ca784e6416C1682b1b2Ae', // VVS Finance Router
  mmFinance: '0x145677FC4d9b8F19B5D56d1820c48e0443049a30', // MM Finance Router
  crodex: '0xeC0A7a0C2439E8Cb67b992b12ecd020Ea943c7Be', // Crodex Router
} as const;

// Cronos Factory Addresses
export const CRONOS_FACTORIES = {
  vvs: '0x3B44B2a187a7b3824131F8db5a74194D0a42Fc15', // VVS Finance Factory
  mmFinance: '0xd590cC180601AEcD6eeADD9B7f2B7611519544f4', // MM Finance Factory
  crodex: '0xe9c29cB475C0ADe80bE0319B74AD112F1e80058F', // Crodex Factory
} as const;

// Common Cronos Tokens
export const CRONOS_TOKENS = {
  CRO: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native CRO
  WCRO: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // Wrapped CRO
  USDC: '0xc21223249CA28397B4B6541dfFaEcC539BfF0c59', // USDC
  USDT: '0x66e428c3f67a68878562e79A0234c1F83c208770', // USDT
  WETH: '0xe44Fd7fCb2b1581822D0c862B68222998a0c299a', // Wrapped ETH
  WBTC: '0x062E66477Faf219F25D27dCED647BF57C3107d52', // Wrapped BTC
  VVS: '0x2D03bECE6747ADC00E1a131BBA1469C15fD11e03', // VVS token
  MMF: '0x97749c9B61F878a880DfE312d2594AE07AEd7656', // MM Finance token
  DAI: '0xF2001B145b43032AAF5Ee2884e456CCd805F677D', // DAI
};

// VVS Finance API endpoint
const VVS_API = 'https://api.vvs.finance/v1';

// VVS Finance Router ABI fragments (Uniswap V2 style)
export const VVS_ROUTER_ABI = [
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

// MM Finance Router ABI (same as VVS, Uniswap V2 style)
export const MM_FINANCE_ROUTER_ABI = VVS_ROUTER_ABI;

export interface CronosQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from VVS Finance
 */
export async function getVVSFinanceQuote(
  request: SwapRequest
): Promise<CronosQuote | null> {
  if (request.chainId !== 'cronos') {
    return null;
  }

  try {
    const quoteResponse = await fetch(`${VVS_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '200000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'vvs-finance',
          poolAddress: data.route?.[0]?.pool || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || CRONOS_ROUTERS.vvs,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from MM Finance
 */
export async function getMMFinanceQuote(
  request: SwapRequest
): Promise<CronosQuote | null> {
  if (request.chainId !== 'cronos') {
    return null;
  }

  try {
    const params = new URLSearchParams({
      chainId: CRONOS_CHAIN_ID.toString(),
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountIn: request.amountIn.toString(),
    });

    const quoteResponse = await fetch(
      `https://api.mm.finance/v1/quote?${params}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      if (data.amountOut) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder
          amountOut: BigInt(data.amountOut),
          estimatedGas: BigInt(data.estimatedGas || '200000'),
          priceImpact: parseFloat(data.priceImpact || '0'),
          route: [{
            dex: 'mm-finance',
            poolAddress: data.route?.[0]?.pool || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: data.tx?.data || '0x',
          txTo: data.tx?.to || CRONOS_ROUTERS.mmFinance,
          txValue: BigInt(data.tx?.value || '0'),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Crodex
 */
export async function getCrodexQuote(
  request: SwapRequest
): Promise<CronosQuote | null> {
  if (request.chainId !== 'cronos') {
    return null;
  }

  try {
    const params = new URLSearchParams({
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountIn: request.amountIn.toString(),
    });

    const quoteResponse = await fetch(
      `https://api.crodex.app/v1/quote?${params}`,
      { method: 'GET', headers: { 'Content-Type': 'application/json' } }
    );

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      if (data.amountOut) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder
          amountOut: BigInt(data.amountOut),
          estimatedGas: BigInt(data.estimatedGas || '180000'),
          priceImpact: parseFloat(data.priceImpact || '0'),
          route: [{
            dex: 'crodex',
            poolAddress: data.route?.[0]?.pool || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: data.tx?.data || '0x',
          txTo: data.tx?.to || CRONOS_ROUTERS.crodex,
          txValue: BigInt(data.tx?.value || '0'),
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Cronos
 */
export async function getCronosBestQuote(
  request: SwapRequest
): Promise<CronosQuote | null> {
  if (request.chainId !== 'cronos') {
    return null;
  }

  const quotes = await Promise.all([
    getVVSFinanceQuote(request),
    getMMFinanceQuote(request),
    getCrodexQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is CronosQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Cronos
 */
export function buildCronosSwapTransaction(
  quote: CronosQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || CRONOS_ROUTERS.vvs,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Cronos
 */
export function getCronosDexes(): string[] {
  return ['vvs-finance', 'mm-finance', 'crodex'];
}

/**
 * Check if chain is Cronos
 */
export function isCronosChain(chainId: string): boolean {
  return chainId === 'cronos';
}

/**
 * Get Cronos chain ID
 */
export function getCronosChainId(): number {
  return CRONOS_CHAIN_ID;
}

/**
 * Get popular trading pairs on Cronos
 */
export function getCronosPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: CRONOS_TOKENS.CRO, tokenOut: CRONOS_TOKENS.USDC, name: 'CRO/USDC' },
    { tokenIn: CRONOS_TOKENS.WCRO, tokenOut: CRONOS_TOKENS.USDC, name: 'WCRO/USDC' },
    { tokenIn: CRONOS_TOKENS.CRO, tokenOut: CRONOS_TOKENS.USDT, name: 'CRO/USDT' },
    { tokenIn: CRONOS_TOKENS.WETH, tokenOut: CRONOS_TOKENS.WCRO, name: 'WETH/WCRO' },
    { tokenIn: CRONOS_TOKENS.WBTC, tokenOut: CRONOS_TOKENS.WCRO, name: 'WBTC/WCRO' },
    { tokenIn: CRONOS_TOKENS.VVS, tokenOut: CRONOS_TOKENS.WCRO, name: 'VVS/WCRO' },
    { tokenIn: CRONOS_TOKENS.USDC, tokenOut: CRONOS_TOKENS.USDT, name: 'USDC/USDT' },
  ];
}
