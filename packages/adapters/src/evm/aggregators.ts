import type { SwapRequest, SwapRoute, DexAggregator } from '@chainhopper/types';
import { EVM_CHAIN_IDS, type EvmChainId } from './chains.js';
import { getSonicBestQuote, isSonicChain } from './sonic.js';
import { getKaiaBestQuote } from './kaia.js';

// Aggregator API endpoints
const AGGREGATOR_APIS = {
  '1inch': 'https://api.1inch.dev/swap/v6.0',
  paraswap: 'https://apiv5.paraswap.io',
  oogabooga: 'https://api.oogabooga.io/v1',
} as const;

// Aggregator support per chain
const AGGREGATOR_CHAIN_SUPPORT: Record<DexAggregator, EvmChainId[]> = {
  '1inch': [
    // Original chains
    'ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche',
    // Phase 7 chains with 1inch support
    'gnosis', 'fantom', 'linea', 'zksync', 'scroll', 'mantle', 'blast', 'mode',
    'aurora' as EvmChainId, // Cast for future support
  ],
  paraswap: [
    // Original chains
    'ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche',
    // Phase 7 chains with ParaSwap support
    'gnosis', 'fantom',
  ],
  '0x': [
    // Original chains
    'ethereum', 'base', 'arbitrum', 'optimism', 'polygon', 'bsc', 'avalanche',
    // Phase 7 chains with 0x support
    'linea', 'scroll', 'blast', 'mantle',
  ],
  oogabooga: ['berachain'],
  dragonswap: ['kaia'],
  klayswap: ['kaia'],
  // Non-EVM aggregators
  jupiter: [],
  stonfi: [],
  dedust: [],
  cetus: [],
  turbos: [],
};

// Chains with native DEX routing (bypass aggregators)
// These chains have specific DEX integrations in separate files
const NATIVE_DEX_CHAINS: EvmChainId[] = [
  'sonic',      // SwapX, Shadow DEX
  'kaia',       // DragonSwap, KLAYswap
  'ronin',      // Katana DEX
  'apechain',   // Ape Portal / Camelot
  'monad',      // Kuru Exchange
  'soneium',    // Kyo Finance
  'ink',        // Velodrome, Nado
  'cronos',     // VVS Finance
  'celo',       // Ubeswap
  'metis',      // Netswap
  'moonbeam',   // StellaSwap
  'moonriver',  // Solarbeam
];

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

      const quoteData: any = await quoteResponse.json();
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

    const data: any = await response.json();
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

    const priceData: any = await priceResponse.json();
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

    const txData: any = await txResponse.json();
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
 * Get quote from OogaBooga API (Berachain native aggregator)
 */
export async function getOogaBoogaQuote(
  request: SwapRequest,
  apiKey?: string
): Promise<AggregatorQuote | null> {
  if (request.chainId !== 'berachain') {
    return null;
  }

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    // OogaBooga uses a similar API structure to other aggregators
    const quoteResponse = await fetch(`${AGGREGATOR_APIS.oogabooga}/quote`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        slippage: request.slippage,
        sender: request.recipient,
      }),
    });

    if (!quoteResponse.ok) return null;

    const quoteData: any = await quoteResponse.json();

    // Build swap transaction
    const swapResponse = await fetch(`${AGGREGATOR_APIS.oogabooga}/swap`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        amount: request.amountIn.toString(),
        slippage: request.slippage,
        sender: request.recipient,
        recipient: request.recipient,
      }),
    });

    let txData = '0x';
    let txTo = '';
    let txValue = 0n;

    if (swapResponse.ok) {
      const swapData: any = await swapResponse.json();
      txData = swapData.tx?.data || swapData.data || '0x';
      txTo = swapData.tx?.to || swapData.to || '';
      txValue = BigInt(swapData.tx?.value || swapData.value || '0');
    }

    return {
      aggregator: 'oogabooga' as DexAggregator,
      amountOut: BigInt(quoteData.amountOut || quoteData.expectedOutput || '0'),
      estimatedGas: BigInt(quoteData.estimatedGas || quoteData.gas || '300000'),
      priceImpact: parseFloat(quoteData.priceImpact || '0'),
      route: parseOogaBoogaRoute(quoteData.route, request.tokenIn, request.tokenOut),
      txData,
      txTo,
      txValue,
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
  options?: { oneInchApiKey?: string; oogaBoogaApiKey?: string }
): Promise<AggregatorQuote | null> {
  // Route Sonic chain to native DEXes
  if (isSonicChain(request.chainId)) {
    return getSonicBestQuote(request);
  }

  // Route Kaia chain to native DEXes (DragonSwap, KLAYswap)
  if (request.chainId === 'kaia') {
    const kaiaQuote = await getKaiaBestQuote(request);
    if (kaiaQuote) {
      return {
        aggregator: kaiaQuote.aggregator,
        amountOut: kaiaQuote.amountOut,
        estimatedGas: kaiaQuote.estimatedGas,
        priceImpact: kaiaQuote.priceImpact,
        route: kaiaQuote.route,
        txData: kaiaQuote.txData,
        txTo: kaiaQuote.txTo,
        txValue: kaiaQuote.txValue,
      };
    }
    return null;
  }

  const quotes = await Promise.all([
    get1inchQuote(request, options?.oneInchApiKey),
    getParaSwapQuote(request),
    getOogaBoogaQuote(request, options?.oogaBoogaApiKey),
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

// Helper to parse OogaBooga route (Berachain)
function parseOogaBoogaRoute(
  route: unknown,
  tokenIn: string,
  tokenOut: string
): SwapRoute[] {
  if (!Array.isArray(route)) {
    return [{
      dex: 'bex',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }

  try {
    const routes: SwapRoute[] = [];

    for (const step of route) {
      if (step && typeof step === 'object') {
        routes.push({
          dex: String((step as Record<string, unknown>).dex || (step as Record<string, unknown>).protocol || 'bex'),
          poolAddress: String((step as Record<string, unknown>).pool || (step as Record<string, unknown>).poolAddress || ''),
          tokenIn: String((step as Record<string, unknown>).tokenIn || tokenIn),
          tokenOut: String((step as Record<string, unknown>).tokenOut || tokenOut),
          percentage: Number((step as Record<string, unknown>).percentage || (step as Record<string, unknown>).percent || 100),
        });
      }
    }

    return routes.length > 0 ? routes : [{
      dex: 'bex',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  } catch {
    return [{
      dex: 'bex',
      poolAddress: '',
      tokenIn,
      tokenOut,
      percentage: 100,
    }];
  }
}
