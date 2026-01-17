/**
 * Jupiter DEX Aggregator Integration
 *
 * Complete Jupiter v6 API integration for Solana swaps.
 * Jupiter aggregates liquidity from 30+ DEXes on Solana.
 *
 * API Documentation: https://station.jup.ag/docs/apis/swap-api
 */

import type { SolanaSwapQuote, SolanaSwapHop, SolanaDex } from '@chainhopper/types';

/**
 * Jupiter API v6 endpoints
 */
export const JUPITER_V6_API = {
  // Core swap endpoints
  quote: 'https://quote-api.jup.ag/v6/quote',
  swap: 'https://quote-api.jup.ag/v6/swap',
  swapInstructions: 'https://quote-api.jup.ag/v6/swap-instructions',

  // Token endpoints
  tokens: 'https://token.jup.ag/all',
  strictTokens: 'https://token.jup.ag/strict',

  // Price endpoints
  price: 'https://price.jup.ag/v6/price',

  // Program addresses endpoint
  programIdToLabel: 'https://quote-api.jup.ag/v6/program-id-to-label',

  // Indexed route map (for optimized routing)
  indexedRouteMap: 'https://quote-api.jup.ag/v6/indexed-route-map',
} as const;

/**
 * Jupiter program ID
 */
export const JUPITER_PROGRAM_ID = 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4';

/**
 * Swap modes supported by Jupiter
 */
export type JupiterSwapMode = 'ExactIn' | 'ExactOut';

/**
 * Full quote request parameters for Jupiter v6
 */
export interface JupiterV6QuoteRequest {
  /** Input token mint address */
  inputMint: string;
  /** Output token mint address */
  outputMint: string;
  /** Amount in smallest unit (lamports for SOL) */
  amount: string;
  /** Slippage tolerance in basis points (default: 50 = 0.5%) */
  slippageBps?: number;
  /** Swap mode: ExactIn or ExactOut (default: ExactIn) */
  swapMode?: JupiterSwapMode;
  /** Only include these DEXes */
  dexes?: string[];
  /** Exclude these DEXes */
  excludeDexes?: string[];
  /** Restrict intermediate tokens (for multi-hop) */
  restrictIntermediateTokens?: boolean;
  /** Only return direct routes (no multi-hop) */
  onlyDirectRoutes?: boolean;
  /** Use legacy transaction format */
  asLegacyTransaction?: boolean;
  /** Platform fee in basis points */
  platformFeeBps?: number;
  /** Max accounts in transaction (for compute limits) */
  maxAccounts?: number;
  /** Auto slippage mode */
  autoSlippage?: boolean;
  /** Max auto slippage in basis points */
  maxAutoSlippageBps?: number;
  /** Auto slippage collision USD value */
  autoSlippageCollisionUsdValue?: number;
}

/**
 * Jupiter v6 quote response
 */
export interface JupiterV6QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: JupiterSwapMode;
  slippageBps: number;
  platformFee?: {
    amount: string;
    feeBps: number;
  };
  priceImpactPct: string;
  routePlan: JupiterV6RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

/**
 * Route plan step
 */
export interface JupiterV6RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

/**
 * Full swap request parameters for Jupiter v6
 */
export interface JupiterV6SwapRequest {
  /** Quote response from /quote endpoint */
  quoteResponse: JupiterV6QuoteResponse;
  /** User's wallet public key */
  userPublicKey: string;
  /** Wrap/unwrap SOL automatically (default: true) */
  wrapAndUnwrapSol?: boolean;
  /** Use shared accounts to reduce tx size (default: true) */
  useSharedAccounts?: boolean;
  /** Fee account for platform fees */
  feeAccount?: string;
  /** Tracking account for analytics */
  trackingAccount?: string;
  /** Compute unit price in microlamports */
  computeUnitPriceMicroLamports?: number;
  /** Priority fee in lamports or 'auto' */
  prioritizationFeeLamports?: number | 'auto';
  /** Use legacy transaction format */
  asLegacyTransaction?: boolean;
  /** Use token ledger for exact output */
  useTokenLedger?: boolean;
  /** Custom destination token account */
  destinationTokenAccount?: string;
  /** Dynamic compute unit limit (default: true) */
  dynamicComputeUnitLimit?: boolean;
  /** Skip RPC calls for user accounts */
  skipUserAccountsRpcCalls?: boolean;
  /** Dynamic slippage settings */
  dynamicSlippage?: {
    minBps: number;
    maxBps: number;
  };
}

/**
 * Jupiter v6 swap response
 */
export interface JupiterV6SwapResponse {
  /** Base64 encoded versioned transaction */
  swapTransaction: string;
  /** Last valid block height for transaction */
  lastValidBlockHeight: number;
  /** Priority fee used */
  prioritizationFeeLamports?: number;
  /** Compute unit limit */
  computeUnitLimit?: number;
  /** Prioritization type details */
  prioritizationType?: {
    computeBudget?: {
      microLamports: number;
      estimatedMicroLamports: number;
    };
  };
  /** Dynamic slippage report */
  dynamicSlippageReport?: {
    slippageBps: number;
    otherAmount: number;
    simulatedIncurredSlippageBps: number;
    amplificationRatio: string;
  };
  /** Simulation error if any */
  simulationError?: string | null;
}

/**
 * Swap instructions response (for advanced usage)
 */
export interface JupiterV6SwapInstructionsResponse {
  tokenLedgerInstruction?: any;
  computeBudgetInstructions: any[];
  setupInstructions: any[];
  swapInstruction: any;
  cleanupInstruction?: any;
  addressLookupTableAddresses: string[];
}

/**
 * Jupiter token info
 */
export interface JupiterTokenInfo {
  address: string;
  chainId: number;
  decimals: number;
  name: string;
  symbol: string;
  logoURI?: string;
  tags?: string[];
  extensions?: {
    coingeckoId?: string;
    website?: string;
    twitter?: string;
    discord?: string;
  };
}

/**
 * Jupiter price response
 */
export interface JupiterPriceResponse {
  data: {
    [mintAddress: string]: {
      id: string;
      mintSymbol: string;
      vsToken: string;
      vsTokenSymbol: string;
      price: number;
      timeTaken: number;
    };
  };
  timeTaken: number;
}

/**
 * Jupiter client for v6 API
 */
export class JupiterClient {
  private baseUrl: string;
  private defaultSlippageBps: number;

  constructor(options?: { baseUrl?: string; defaultSlippageBps?: number }) {
    this.baseUrl = options?.baseUrl || 'https://quote-api.jup.ag/v6';
    this.defaultSlippageBps = options?.defaultSlippageBps || 50;
  }

  /**
   * Get a swap quote from Jupiter
   */
  async getQuote(params: JupiterV6QuoteRequest): Promise<JupiterV6QuoteResponse> {
    const searchParams = new URLSearchParams();

    // Required parameters
    searchParams.set('inputMint', params.inputMint);
    searchParams.set('outputMint', params.outputMint);
    searchParams.set('amount', params.amount);

    // Optional parameters
    searchParams.set('slippageBps', (params.slippageBps ?? this.defaultSlippageBps).toString());

    if (params.swapMode) {
      searchParams.set('swapMode', params.swapMode);
    }
    if (params.dexes?.length) {
      searchParams.set('dexes', params.dexes.join(','));
    }
    if (params.excludeDexes?.length) {
      searchParams.set('excludeDexes', params.excludeDexes.join(','));
    }
    if (params.restrictIntermediateTokens) {
      searchParams.set('restrictIntermediateTokens', 'true');
    }
    if (params.onlyDirectRoutes) {
      searchParams.set('onlyDirectRoutes', 'true');
    }
    if (params.asLegacyTransaction) {
      searchParams.set('asLegacyTransaction', 'true');
    }
    if (params.platformFeeBps !== undefined) {
      searchParams.set('platformFeeBps', params.platformFeeBps.toString());
    }
    if (params.maxAccounts !== undefined) {
      searchParams.set('maxAccounts', params.maxAccounts.toString());
    }
    if (params.autoSlippage) {
      searchParams.set('autoSlippage', 'true');
    }
    if (params.maxAutoSlippageBps !== undefined) {
      searchParams.set('maxAutoSlippageBps', params.maxAutoSlippageBps.toString());
    }
    if (params.autoSlippageCollisionUsdValue !== undefined) {
      searchParams.set('autoSlippageCollisionUsdValue', params.autoSlippageCollisionUsdValue.toString());
    }

    const response = await fetch(`${this.baseUrl}/quote?${searchParams}`);

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(`Quote failed: ${error}`, 'QUOTE_ERROR', response.status);
    }

    return response.json();
  }

  /**
   * Build a swap transaction
   */
  async getSwapTransaction(params: JupiterV6SwapRequest): Promise<JupiterV6SwapResponse> {
    const response = await fetch(`${this.baseUrl}/swap`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: params.quoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
        useSharedAccounts: params.useSharedAccounts ?? true,
        feeAccount: params.feeAccount,
        trackingAccount: params.trackingAccount,
        computeUnitPriceMicroLamports: params.computeUnitPriceMicroLamports,
        prioritizationFeeLamports: params.prioritizationFeeLamports,
        asLegacyTransaction: params.asLegacyTransaction ?? false,
        useTokenLedger: params.useTokenLedger ?? false,
        destinationTokenAccount: params.destinationTokenAccount,
        dynamicComputeUnitLimit: params.dynamicComputeUnitLimit ?? true,
        skipUserAccountsRpcCalls: params.skipUserAccountsRpcCalls ?? false,
        dynamicSlippage: params.dynamicSlippage,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(`Swap build failed: ${error}`, 'SWAP_BUILD_ERROR', response.status);
    }

    return response.json();
  }

  /**
   * Get swap instructions (for manual transaction building)
   */
  async getSwapInstructions(params: JupiterV6SwapRequest): Promise<JupiterV6SwapInstructionsResponse> {
    const response = await fetch(`${this.baseUrl}/swap-instructions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: params.quoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
        useSharedAccounts: params.useSharedAccounts ?? true,
        feeAccount: params.feeAccount,
        trackingAccount: params.trackingAccount,
        computeUnitPriceMicroLamports: params.computeUnitPriceMicroLamports,
        prioritizationFeeLamports: params.prioritizationFeeLamports,
        useTokenLedger: params.useTokenLedger ?? false,
        destinationTokenAccount: params.destinationTokenAccount,
        dynamicComputeUnitLimit: params.dynamicComputeUnitLimit ?? true,
        skipUserAccountsRpcCalls: params.skipUserAccountsRpcCalls ?? false,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(`Swap instructions failed: ${error}`, 'SWAP_INSTRUCTIONS_ERROR', response.status);
    }

    return response.json();
  }

  /**
   * Get token price from Jupiter
   */
  async getPrice(mintAddresses: string[], vsToken: string = 'USDC'): Promise<JupiterPriceResponse> {
    const ids = mintAddresses.join(',');
    const response = await fetch(`${JUPITER_V6_API.price}?ids=${ids}&vsToken=${vsToken}`);

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(`Price fetch failed: ${error}`, 'PRICE_ERROR', response.status);
    }

    return response.json();
  }

  /**
   * Get all Jupiter tokens
   */
  async getTokens(strict: boolean = false): Promise<JupiterTokenInfo[]> {
    const url = strict ? JUPITER_V6_API.strictTokens : JUPITER_V6_API.tokens;
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(`Token fetch failed: ${error}`, 'TOKEN_ERROR', response.status);
    }

    return response.json();
  }

  /**
   * Get program ID to DEX label mapping
   */
  async getProgramIdToLabel(): Promise<Record<string, string>> {
    const response = await fetch(`${this.baseUrl}/program-id-to-label`);

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(`Program ID mapping failed: ${error}`, 'PROGRAM_ID_ERROR', response.status);
    }

    return response.json();
  }

  /**
   * Get indexed route map for optimized routing
   */
  async getIndexedRouteMap(onlyDirectRoutes: boolean = false): Promise<{
    mintKeys: string[];
    indexedRouteMap: Record<number, number[]>;
  }> {
    const params = onlyDirectRoutes ? '?onlyDirectRoutes=true' : '';
    const response = await fetch(`${this.baseUrl}/indexed-route-map${params}`);

    if (!response.ok) {
      const error = await response.text();
      throw new JupiterError(`Route map fetch failed: ${error}`, 'ROUTE_MAP_ERROR', response.status);
    }

    return response.json();
  }
}

/**
 * Jupiter-specific error class
 */
export class JupiterError extends Error {
  code: string;
  statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'JupiterError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Convert Jupiter quote to internal SolanaSwapQuote format
 */
export function convertJupiterQuote(quote: JupiterV6QuoteResponse): SolanaSwapQuote {
  const route: SolanaSwapHop[] = quote.routePlan.map((step) => ({
    dex: mapLabelToDex(step.swapInfo.label),
    poolAddress: step.swapInfo.ammKey,
    inputMint: step.swapInfo.inputMint,
    outputMint: step.swapInfo.outputMint,
    inAmount: BigInt(step.swapInfo.inAmount),
    outAmount: BigInt(step.swapInfo.outAmount),
    feeAmount: BigInt(step.swapInfo.feeAmount),
    feeMint: step.swapInfo.feeMint,
  }));

  return {
    inputMint: quote.inputMint,
    outputMint: quote.outputMint,
    inAmount: BigInt(quote.inAmount),
    outAmount: BigInt(quote.outAmount),
    otherAmountThreshold: BigInt(quote.otherAmountThreshold),
    slippageBps: quote.slippageBps,
    priceImpactPct: parseFloat(quote.priceImpactPct),
    route,
    fees: {
      networkFee: 5000n, // Base SOL transaction fee
      platformFee: quote.platformFee ? BigInt(quote.platformFee.amount) : 0n,
      priorityFee: 0n,
    },
    expiresAt: Date.now() + 60000, // 1 minute
    source: 'jupiter',
  };
}

/**
 * Map Jupiter DEX label to SolanaDex type
 */
function mapLabelToDex(label: string): SolanaDex {
  const l = label.toLowerCase();

  // Raydium variants
  if (l.includes('raydium') && l.includes('clmm')) return 'raydium-clmm';
  if (l.includes('raydium')) return 'raydium';

  // Orca variants
  if (l.includes('whirlpool')) return 'orca-whirlpool';
  if (l.includes('orca')) return 'orca';

  // Meteora variants
  if (l.includes('meteora') && l.includes('dlmm')) return 'meteora-dlmm';
  if (l.includes('meteora')) return 'meteora';

  // Other DEXes
  if (l.includes('phoenix')) return 'phoenix';
  if (l.includes('lifinity')) return 'lifinity';
  if (l.includes('openbook') && l.includes('v2')) return 'openbook-v2';
  if (l.includes('openbook')) return 'openbook';
  if (l.includes('aldrin')) return 'aldrin';
  if (l.includes('saber')) return 'saber';
  if (l.includes('marinade')) return 'marinade';
  if (l.includes('goosefx')) return 'goosefx';
  if (l.includes('fluxbeam')) return 'fluxbeam';

  return 'jupiter';
}

/**
 * List of DEXes available through Jupiter
 */
export const JUPITER_SUPPORTED_DEXES = [
  'Raydium',
  'Raydium CLMM',
  'Orca',
  'Orca (Whirlpools)',
  'Meteora',
  'Meteora DLMM',
  'Phoenix',
  'Lifinity',
  'Lifinity V2',
  'OpenBook',
  'OpenBook V2',
  'Aldrin',
  'Aldrin V2',
  'Saber',
  'Saber (Decimals)',
  'Marinade',
  'GooseFX',
  'Fluxbeam',
  'Crema',
  'Cropper',
  'Cykura',
  'Dradex',
  'Invariant',
  'Penguin',
  'Sanctum',
  'Saros',
  'Serum',
  'Step',
  'Symmetry',
] as const;

/**
 * Popular Jupiter routing tokens (for intermediate hops)
 */
export const JUPITER_ROUTING_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  mSOL: 'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So',
  jitoSOL: 'J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn',
  bSOL: 'bSo13r4TkiE4KumL71LsHTPpL2euBYLFx6h9HP3piy1',
} as const;

/**
 * Create a default Jupiter client instance
 */
export function createJupiterClient(options?: {
  baseUrl?: string;
  defaultSlippageBps?: number;
}): JupiterClient {
  return new JupiterClient(options);
}

/**
 * Quick quote helper function
 */
export async function quickQuote(
  inputMint: string,
  outputMint: string,
  amount: string | bigint,
  slippageBps: number = 50
): Promise<JupiterV6QuoteResponse | null> {
  try {
    const client = createJupiterClient({ defaultSlippageBps: slippageBps });
    return await client.getQuote({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps,
    });
  } catch (error) {
    console.error('Jupiter quick quote failed:', error);
    return null;
  }
}

/**
 * Quick swap helper function
 */
export async function quickSwap(
  inputMint: string,
  outputMint: string,
  amount: string | bigint,
  userPublicKey: string,
  slippageBps: number = 50
): Promise<JupiterV6SwapResponse | null> {
  try {
    const client = createJupiterClient({ defaultSlippageBps: slippageBps });

    // Get quote
    const quote = await client.getQuote({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps,
    });

    // Build swap transaction
    return await client.getSwapTransaction({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports: 'auto',
      dynamicComputeUnitLimit: true,
    });
  } catch (error) {
    console.error('Jupiter quick swap failed:', error);
    return null;
  }
}

/**
 * Get best route analysis
 */
export function analyzeRoute(quote: JupiterV6QuoteResponse): {
  hops: number;
  dexes: string[];
  priceImpact: number;
  effectivePrice: number;
  inputAmount: bigint;
  outputAmount: bigint;
} {
  const dexes = quote.routePlan.map((step) => step.swapInfo.label);
  const inputAmount = BigInt(quote.inAmount);
  const outputAmount = BigInt(quote.outAmount);

  return {
    hops: quote.routePlan.length,
    dexes: [...new Set(dexes)], // Unique DEXes
    priceImpact: parseFloat(quote.priceImpactPct),
    effectivePrice: Number(outputAmount) / Number(inputAmount),
    inputAmount,
    outputAmount,
  };
}
