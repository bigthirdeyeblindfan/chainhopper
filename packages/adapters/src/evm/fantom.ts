/**
 * Fantom Chain DEX Integrations
 *
 * Fantom is a high-performance EVM-compatible L1 blockchain
 * using FTM as native gas token. Known for fast finality.
 *
 * Native DEXes:
 * - SpookySwap - Primary DEX (Uniswap V2 fork)
 * - SpiritSwap - Popular V2/V3 DEX
 * - Beethoven X - Balancer fork for weighted pools
 * - Equalizer - ve(3,3) DEX
 */

import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import type { AggregatorQuote } from './aggregators.js';

// Fantom Chain ID
export const FANTOM_CHAIN_ID = 250;

// Fantom DEX Router Addresses
export const FANTOM_ROUTERS = {
  spookyswap: '0xF491e7B69E4244ad4002BC14e878a34207E38c29', // SpookySwap Router
  spiritswap: '0x16327E3FbDaCA3bcF7E38F5Af2599D2DDc33aE52', // SpiritSwap Router
  beethovenx: '0x20dd72Ed959b6147912C2e529F0a0C651c33c9ce', // Beethoven X Vault
  equalizer: '0x1A05EB736873485655F29a37DEf8a0AA87F5a447', // Equalizer Router
} as const;

// Fantom Factory Addresses
export const FANTOM_FACTORIES = {
  spookyswap: '0x152eE697f2E276fA89E96742e9bB9aB1F2E61bE3', // SpookySwap Factory
  spiritswap: '0xEF45d134b73241eDa7703fa787148D9C9F4950b0', // SpiritSwap Factory
} as const;

// Common Fantom Tokens
export const FANTOM_TOKENS = {
  FTM: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native FTM
  WFTM: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // Wrapped FTM
  USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75', // USDC
  USDT: '0x049d68029688eAbF473097a2fC38ef61633A3C7A', // fUSDT
  DAI: '0x8D11eC38a3EB5E956B052f67Da8Bdc9bef8Abf3E', // DAI
  WETH: '0x74b23882a30290451A17c44f4F05243b6b58C76d', // Wrapped ETH
  WBTC: '0x321162Cd933E2Be498Cd2267a90534A804051b11', // Wrapped BTC
  BOO: '0x841FAD6EAe12c286d1Fd18d1d525DFfA75C7EFFE', // SpookySwap token
  SPIRIT: '0x5Cc61A78F164885776AA610fb0FE1257df78E59B', // SpiritSwap token
  BEETS: '0xF24Bcf4d1e507740041C9cFd2DddB29585aDCe1e', // Beethoven X token
};

// SpookySwap API endpoint
const SPOOKYSWAP_API = 'https://api.spooky.fi/v1';

// SpookySwap Router ABI (Uniswap V2 style)
export const SPOOKYSWAP_ROUTER_ABI = [
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

// Beethoven X Vault ABI (Balancer style)
export const BEETHOVENX_VAULT_ABI = [
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
] as const;

export interface FantomQuote extends AggregatorQuote {
  aggregator: DexAggregator;
}

/**
 * Get quote from SpookySwap
 */
export async function getSpookySwapQuote(
  request: SwapRequest
): Promise<FantomQuote | null> {
  if (request.chainId !== 'fantom') {
    return null;
  }

  try {
    // Try SpookySwap API for quote
    const quoteResponse = await fetch(`${SPOOKYSWAP_API}/quote`, {
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
        aggregator: '1inch' as DexAggregator, // Placeholder for 'spookyswap'
        amountOut: BigInt(data.amountOut || '0'),
        estimatedGas: BigInt(data.estimatedGas || '150000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'spookyswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || FANTOM_ROUTERS.spookyswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from SpiritSwap
 */
export async function getSpiritSwapQuote(
  request: SwapRequest
): Promise<FantomQuote | null> {
  if (request.chainId !== 'fantom') {
    return null;
  }

  try {
    // SpiritSwap API
    const quoteResponse = await fetch('https://api.spiritswap.finance/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chainId: FANTOM_CHAIN_ID,
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
        estimatedGas: BigInt(data.estimatedGas || '160000'),
        priceImpact: parseFloat(data.priceImpact || '0'),
        route: [{
          dex: 'spiritswap',
          poolAddress: data.poolAddress || '',
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          percentage: 100,
        }],
        txData: data.tx?.data || '0x',
        txTo: data.tx?.to || FANTOM_ROUTERS.spiritswap,
        txValue: BigInt(data.tx?.value || '0'),
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get quote from Beethoven X
 */
export async function getBeethovenXQuote(
  request: SwapRequest
): Promise<FantomQuote | null> {
  if (request.chainId !== 'fantom') {
    return null;
  }

  try {
    // Beethoven X API (uses Balancer SOR)
    const quoteResponse = await fetch('https://backend-v3.beets-ftm-node.com/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
          query GetSwap($tokenIn: String!, $tokenOut: String!, $swapAmount: BigDecimal!) {
            sorGetSwapPaths(
              chain: FANTOM
              tokenIn: $tokenIn
              tokenOut: $tokenOut
              swapType: EXACT_IN
              swapAmount: $swapAmount
            ) {
              returnAmount
              priceImpact
              routes {
                share
                hops {
                  pool { address }
                  tokenIn
                  tokenOut
                }
              }
            }
          }
        `,
        variables: {
          tokenIn: request.tokenIn,
          tokenOut: request.tokenOut,
          swapAmount: request.amountIn.toString(),
        },
      }),
    });

    if (quoteResponse.ok) {
      const data: any = await quoteResponse.json();
      const swapData = data.data?.sorGetSwapPaths;
      if (swapData) {
        return {
          aggregator: '1inch' as DexAggregator, // Placeholder
          amountOut: BigInt(swapData.returnAmount || '0'),
          estimatedGas: BigInt('250000'), // Balancer swaps tend to use more gas
          priceImpact: parseFloat(swapData.priceImpact || '0'),
          route: [{
            dex: 'beethovenx',
            poolAddress: swapData.routes?.[0]?.hops?.[0]?.pool?.address || '',
            tokenIn: request.tokenIn,
            tokenOut: request.tokenOut,
            percentage: 100,
          }],
          txData: '0x',
          txTo: FANTOM_ROUTERS.beethovenx,
          txValue: 0n,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Get best quote for Fantom chain
 * Note: Fantom also has 1inch/ParaSwap support, this provides native DEX fallback
 */
export async function getFantomBestQuote(
  request: SwapRequest
): Promise<FantomQuote | null> {
  if (request.chainId !== 'fantom') {
    return null;
  }

  const quotes = await Promise.all([
    getSpookySwapQuote(request),
    getSpiritSwapQuote(request),
    getBeethovenXQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is FantomQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Build swap transaction for Fantom
 */
export function buildFantomSwapTransaction(
  quote: FantomQuote,
  request: SwapRequest
): { to: string; data: string; value: bigint } {
  return {
    to: quote.txTo || FANTOM_ROUTERS.spookyswap,
    data: quote.txData || '0x',
    value: quote.txValue || 0n,
  };
}

/**
 * Get list of supported DEXes on Fantom
 */
export function getFantomDexes(): string[] {
  return ['spookyswap', 'spiritswap', 'beethovenx', 'equalizer'];
}

/**
 * Check if chain is Fantom
 */
export function isFantomChain(chainId: string): boolean {
  return chainId === 'fantom';
}

/**
 * Get Fantom chain ID
 */
export function getFantomChainId(): number {
  return FANTOM_CHAIN_ID;
}

/**
 * Get popular trading pairs on Fantom
 */
export function getFantomPopularPairs(): Array<{ tokenIn: string; tokenOut: string; name: string }> {
  return [
    { tokenIn: FANTOM_TOKENS.FTM, tokenOut: FANTOM_TOKENS.USDC, name: 'FTM/USDC' },
    { tokenIn: FANTOM_TOKENS.WFTM, tokenOut: FANTOM_TOKENS.USDC, name: 'WFTM/USDC' },
    { tokenIn: FANTOM_TOKENS.FTM, tokenOut: FANTOM_TOKENS.USDT, name: 'FTM/USDT' },
    { tokenIn: FANTOM_TOKENS.WETH, tokenOut: FANTOM_TOKENS.WFTM, name: 'WETH/WFTM' },
    { tokenIn: FANTOM_TOKENS.WBTC, tokenOut: FANTOM_TOKENS.WFTM, name: 'WBTC/WFTM' },
    { tokenIn: FANTOM_TOKENS.USDC, tokenOut: FANTOM_TOKENS.USDT, name: 'USDC/USDT' },
    { tokenIn: FANTOM_TOKENS.BOO, tokenOut: FANTOM_TOKENS.WFTM, name: 'BOO/WFTM' },
  ];
}
