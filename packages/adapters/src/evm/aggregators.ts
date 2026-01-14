import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS, type EvmChainId } from './chains.js';

// Aggregator API endpoints
const AGGREGATOR_APIS = {
  '1inch': 'https://api.1inch.dev/swap/v6.0',
  paraswap: 'https://apiv5.paraswap.io',
} as const;

// Aggregator support per chain
const AGGREGATOR_CHAIN_SUPPORT: Record<DexAggregator, EvmChainId[]> = {
  '1inch': ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche'],
  paraswap: ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche'],
  '0x': ['ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche'],
  // Non-EVM aggregators
  jupiter: [],
  stonfi: [],
  dedust: [],
  cetus: [],
  turbos: [],
};

export interface AggregatorQuote {
  aggregator: DexAggregator;
  amountOut: bigint;
  estimatedGas: bigint;
  priceImpact: number;
  route: SwapRoute[];
  txData: string;
  txTo: string;
  txValue: bigint;
}

/**
 * Get quote from 1inch API
 */
export async function get1inchQuote(
  request: SwapRequest,
  apiKey?: string
): Promise<AggregatorQuote | null> {
  const chainId = EVM_CHAIN_IDS[request.chainId as EvmChainId];
  if (!chainId) return null;

  if (!AGGREGATOR_CHAIN_SUPPORT['1inch'].includes(request.chainId as EvmChainId)) {
    return null;
  }

  try {
    const params = new URLSearchParams({
      src: request.tokenIn,
      dst: request.tokenOut,
      amount: request.amountIn.toString(),
      from: request.recipient,
      slippage: request.slippage.toString(),
      disableEstimate: 'true',
    });

    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(
      `${AGGREGATOR_APIS['1inch']}/${chainId}/swap?${params}`,
      { headers }
    );

    if (!response.ok) {
      // Try quote endpoint instead of swap
      const quoteParams = new URLSearchParams({
        src: request.tokenIn,
        dst: request.tokenOut,
        amount: request.amountIn.toString(),
      });

      const quoteResponse = await fetch(
        `${AGGREGATOR_APIS['1inch']}/${chainId}/quote?${quoteParams}`,
        { headers }
      );

      if (!quoteResponse.ok) return null;

      const quoteData = await quoteResponse.json();
      return {
        aggregator: '1inch',
        amountOut: BigInt(quoteData.dstAmount || quoteData.toAmount || '0'),
        estimatedGas: BigInt(quoteData.gas || '200000'),
        priceImpact: 0,
        route: parseProtocols(quoteData.protocols, request.tokenIn, request.tokenOut),
        txData: '0x',
        txTo: '',
        txValue: 0n,
      };
    }

    const data = await response.json();
    return {
      aggregator: '1inch',
      amountOut: BigInt(data.dstAmount || data.toAmount || '0'),
      estimatedGas: BigInt(data.tx?.gas || '200000'),
      priceImpact: 0,
      route: parseProtocols(data.protocols, request.tokenIn, request.tokenOut),
      txData: data.tx?.data || '0x',
      txTo: data.tx?.to || '',
      txValue: BigInt(data.tx?.value || '0'),
    };
  } catch {
    return null;
  }
}

/**
 * Get quote from ParaSwap API
 */
export async function getParaSwapQuote(
  request: SwapRequest
): Promise<AggregatorQuote | null> {
  const chainId = EVM_CHAIN_IDS[request.chainId as EvmChainId];
  if (!chainId) return null;

  if (!AGGREGATOR_CHAIN_SUPPORT.paraswap.includes(request.chainId as EvmChainId)) {
    return null;
  }

  try {
    // Get price first
    const priceParams = new URLSearchParams({
      srcToken: request.tokenIn,
      destToken: request.tokenOut,
      amount: request.amountIn.toString(),
      srcDecimals: '18', // Will be overridden by actual decimals
      destDecimals: '18',
      side: 'SELL',
      network: chainId.toString(),
    });

    const priceResponse = await fetch(
      `${AGGREGATOR_APIS.paraswap}/prices?${priceParams}`
    );

    if (!priceResponse.ok) return null;

    const priceData = await priceResponse.json();
    const bestRoute = priceData.priceRoute;

    if (!bestRoute) return null;

    // Build transaction
    const txResponse = await fetch(`${AGGREGATOR_APIS.paraswap}/transactions/${chainId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        srcToken: request.tokenIn,
        destToken: request.tokenOut,
        srcAmount: request.amountIn.toString(),
        destAmount: bestRoute.destAmount,
        priceRoute: bestRoute,
        userAddress: request.recipient,
        slippage: request.slippage * 100, // ParaSwap uses basis points
        deadline: request.deadline || Math.floor(Date.now() / 1000) + 1200,
      }),
    });

    if (!txResponse.ok) {
      // Return quote without tx data
      return {
        aggregator: 'paraswap',
        amountOut: BigInt(bestRoute.destAmount || '0'),
        estimatedGas: BigInt(bestRoute.gasCost || '200000'),
        priceImpact: parseFloat(bestRoute.priceImpact || '0'),
        route: parseParaSwapRoute(bestRoute.bestRoute, request.tokenIn, request.tokenOut),
        txData: '0x',
        txTo: '',
        txValue: 0n,
      };
    }

    const txData = await txResponse.json();
    return {
      aggregator: 'paraswap',
      amountOut: BigInt(bestRoute.destAmount || '0'),
      estimatedGas: BigInt(bestRoute.gasCost || '200000'),
      priceImpact: parseFloat(bestRoute.priceImpact || '0'),
      route: parseParaSwapRoute(bestRoute.bestRoute, request.tokenIn, request.tokenOut),
      txData: txData.data || '0x',
      txTo: txData.to || '',
      txValue: BigInt(txData.value || '0'),
    };
  } catch {
    return null;
  }
}

/**
 * Get best quote from all aggregators
 */
export async function getBestQuote(
  request: SwapRequest,
  options?: { oneInchApiKey?: string }
): Promise<AggregatorQuote | null> {
  const quotes = await Promise.all([
    get1inchQuote(request, options?.oneInchApiKey),
    getParaSwapQuote(request),
  ]);

  const validQuotes = quotes.filter((q): q is AggregatorQuote => q !== null && q.amountOut > 0n);

  if (validQuotes.length === 0) return null;

  // Return quote with highest output
  return validQuotes.reduce((best, current) =>
    current.amountOut > best.amountOut ? current : best
  );
}

/**
 * Check which aggregators support a chain
 */
export function getSupportedAggregators(chainId: EvmChainId): DexAggregator[] {
  const supported: DexAggregator[] = [];
  for (const [aggregator, chains] of Object.entries(AGGREGATOR_CHAIN_SUPPORT)) {
    if (chains.includes(chainId)) {
      supported.push(aggregator as DexAggregator);
    }
  }
  return supported;
}

// Helper to parse 1inch protocols into our route format
function parseProtocols(
  protocols: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(protocols)) {
    return [{
      dex: 'unknown',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }

  try {
    // 1inch protocols is a nested array structure
    const routes: SwapRoute[] = [];
    const flatProtocols = protocols.flat(3);

    for (const step of flatProtocols) {
      if (step && typeof step === 'object' && 'name' in step) {
        routes.push({
          dex: String(step.name || 'unknown'),
          poolAddress: String(step.pool || step.fromTokenAddress || ''),
          tokenIn: String(step.fromTokenAddress || tokenIn),
          tokenOut: String(step.toTokenAddress || tokenOut),
          percentage: Number(step.part || 100),
        });
      }
    }

    return routes.length > 0 ? routes : [{
      dex: 'unknown',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  } catch {
    return [{
      dex: 'unknown',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }
}

// Helper to parse ParaSwap route
function parseParaSwapRoute(
  bestRoute: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(bestRoute)) {
    return [{
      dex: 'unknown',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }

  try {
    const routes: SwapRoute[] = [];

    for (const path of bestRoute) {
      if (path && typeof path === 'object' && 'swaps' in path && Array.isArray(path.swaps)) {
        for (const swap of path.swaps) {
          if (swap && typeof swap === 'object' && 'swapExchanges' in swap && Array.isArray(swap.swapExchanges)) {
            for (const exchange of swap.swapExchanges) {
              routes.push({
                dex: String(exchange.exchange || 'unknown'),
                poolAddress: String(exchange.poolAddresses?.[0] || ''),
                tokenIn: String(swap.srcToken || tokenIn),
                tokenOut: String(swap.destToken || tokenOut),
                percentage: Number(exchange.percent || 100),
              });
            }
          }
        }
      }
    }

    return routes.length > 0 ? routes : [{
      dex: 'paraswap',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  } catch {
    return [{
      dex: 'paraswap',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }
}
