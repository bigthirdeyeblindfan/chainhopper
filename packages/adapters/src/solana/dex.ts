/**
 * Solana DEX Integrations
 *
 * Jupiter, Raydium, Orca, and other DEX integrations for Solana.
 */

import type { SolanaSwapQuote, SolanaSwapHop, SolanaDex } from '@chainhopper/types';
import { JUPITER_API, SOLANA_TOKEN_ADDRESSES } from './tokens.js';

/**
 * Jupiter quote request parameters
 */
export interface JupiterQuoteParams {
  inputMint: string;
  outputMint: string;
  amount: string;
  slippageBps?: number;
  swapMode?: 'ExactIn' | 'ExactOut';
  dexes?: string[];
  excludeDexes?: string[];
  onlyDirectRoutes?: boolean;
  asLegacyTransaction?: boolean;
  maxAccounts?: number;
}

/**
 * Jupiter quote response
 */
export interface JupiterQuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: JupiterRoutePlan[];
  contextSlot?: number;
  timeTaken?: number;
}

export interface JupiterRoutePlan {
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
 * Jupiter swap request parameters
 */
export interface JupiterSwapParams {
  quoteResponse: JupiterQuoteResponse;
  userPublicKey: string;
  wrapAndUnwrapSol?: boolean;
  useSharedAccounts?: boolean;
  feeAccount?: string;
  computeUnitPriceMicroLamports?: number;
  prioritizationFeeLamports?: number | 'auto';
  asLegacyTransaction?: boolean;
  useTokenLedger?: boolean;
  destinationTokenAccount?: string;
  dynamicComputeUnitLimit?: boolean;
  skipUserAccountsRpcCalls?: boolean;
}

/**
 * Jupiter swap response
 */
export interface JupiterSwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: number;
  computeUnitLimit?: number;
  prioritizationType?: {
    computeBudget?: {
      microLamports: number;
      estimatedMicroLamports: number;
    };
  };
  simulationError?: string | null;
}

/**
 * Raydium AMM pool info
 */
export interface RaydiumPoolInfo {
  id: string;
  baseMint: string;
  quoteMint: string;
  lpMint: string;
  baseDecimals: number;
  quoteDecimals: number;
  lpDecimals: number;
  version: number;
  programId: string;
  authority: string;
  openOrders: string;
  targetOrders: string;
  baseVault: string;
  quoteVault: string;
  marketId: string;
  marketProgramId: string;
  marketAuthority: string;
  marketBaseVault: string;
  marketQuoteVault: string;
  marketBids: string;
  marketAsks: string;
  marketEventQueue: string;
}

/**
 * Get quote from Jupiter API
 */
export async function getJupiterQuote(
  params: JupiterQuoteParams
): Promise<JupiterQuoteResponse | null> {
  try {
    const searchParams = new URLSearchParams({
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      amount: params.amount,
      slippageBps: (params.slippageBps || 50).toString(),
    });

    if (params.swapMode) {
      searchParams.set('swapMode', params.swapMode);
    }
    if (params.dexes?.length) {
      searchParams.set('dexes', params.dexes.join(','));
    }
    if (params.excludeDexes?.length) {
      searchParams.set('excludeDexes', params.excludeDexes.join(','));
    }
    if (params.onlyDirectRoutes) {
      searchParams.set('onlyDirectRoutes', 'true');
    }
    if (params.asLegacyTransaction) {
      searchParams.set('asLegacyTransaction', 'true');
    }
    if (params.maxAccounts) {
      searchParams.set('maxAccounts', params.maxAccounts.toString());
    }

    const response = await fetch(`${JUPITER_API.quote}?${searchParams}`);

    if (!response.ok) {
      console.error('Jupiter quote error:', await response.text());
      return null;
    }

    return await response.json() as JupiterQuoteResponse;
  } catch (error) {
    console.error('Jupiter quote failed:', error);
    return null;
  }
}

/**
 * Build Jupiter swap transaction
 */
export async function buildJupiterSwapTransaction(
  params: JupiterSwapParams
): Promise<JupiterSwapResponse | null> {
  try {
    const response = await fetch(JUPITER_API.swap, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        quoteResponse: params.quoteResponse,
        userPublicKey: params.userPublicKey,
        wrapAndUnwrapSol: params.wrapAndUnwrapSol ?? true,
        useSharedAccounts: params.useSharedAccounts ?? true,
        feeAccount: params.feeAccount,
        computeUnitPriceMicroLamports: params.computeUnitPriceMicroLamports,
        prioritizationFeeLamports: params.prioritizationFeeLamports,
        asLegacyTransaction: params.asLegacyTransaction ?? false,
        useTokenLedger: params.useTokenLedger ?? false,
        destinationTokenAccount: params.destinationTokenAccount,
        dynamicComputeUnitLimit: params.dynamicComputeUnitLimit ?? true,
        skipUserAccountsRpcCalls: params.skipUserAccountsRpcCalls ?? false,
      }),
    });

    if (!response.ok) {
      console.error('Jupiter swap error:', await response.text());
      return null;
    }

    return await response.json() as JupiterSwapResponse;
  } catch (error) {
    console.error('Jupiter swap build failed:', error);
    return null;
  }
}

/**
 * Convert Jupiter quote to SolanaSwapQuote
 */
export function jupiterQuoteToSolanaQuote(
  jupiterQuote: JupiterQuoteResponse
): SolanaSwapQuote {
  const route: SolanaSwapHop[] = jupiterQuote.routePlan.map((step) => ({
    dex: mapJupiterLabelToDex(step.swapInfo.label),
    poolAddress: step.swapInfo.ammKey,
    inputMint: step.swapInfo.inputMint,
    outputMint: step.swapInfo.outputMint,
    inAmount: BigInt(step.swapInfo.inAmount),
    outAmount: BigInt(step.swapInfo.outAmount),
    feeAmount: BigInt(step.swapInfo.feeAmount),
    feeMint: step.swapInfo.feeMint,
  }));

  return {
    inputMint: jupiterQuote.inputMint,
    outputMint: jupiterQuote.outputMint,
    inAmount: BigInt(jupiterQuote.inAmount),
    outAmount: BigInt(jupiterQuote.outAmount),
    otherAmountThreshold: BigInt(jupiterQuote.otherAmountThreshold),
    slippageBps: jupiterQuote.slippageBps,
    priceImpactPct: parseFloat(jupiterQuote.priceImpactPct),
    route,
    fees: {
      networkFee: 5000n, // Base transaction fee
      platformFee: 0n,
      priorityFee: 0n,
    },
    expiresAt: Date.now() + 60000, // 1 minute
    source: 'jupiter',
  };
}

/**
 * Map Jupiter DEX label to SolanaDex type
 */
function mapJupiterLabelToDex(label: string): SolanaDex {
  const labelLower = label.toLowerCase();

  if (labelLower.includes('raydium') && labelLower.includes('clmm')) {
    return 'raydium-clmm';
  }
  if (labelLower.includes('raydium')) {
    return 'raydium';
  }
  if (labelLower.includes('orca') && labelLower.includes('whirlpool')) {
    return 'orca-whirlpool';
  }
  if (labelLower.includes('orca')) {
    return 'orca';
  }
  if (labelLower.includes('meteora') && labelLower.includes('dlmm')) {
    return 'meteora-dlmm';
  }
  if (labelLower.includes('meteora')) {
    return 'meteora';
  }
  if (labelLower.includes('phoenix')) {
    return 'phoenix';
  }
  if (labelLower.includes('lifinity')) {
    return 'lifinity';
  }
  if (labelLower.includes('openbook')) {
    return 'openbook';
  }
  if (labelLower.includes('aldrin')) {
    return 'aldrin';
  }
  if (labelLower.includes('saber')) {
    return 'saber';
  }
  if (labelLower.includes('marinade')) {
    return 'marinade';
  }
  if (labelLower.includes('goosefx')) {
    return 'goosefx';
  }

  return 'jupiter';
}

/**
 * Raydium API endpoints
 */
export const RAYDIUM_API = {
  poolInfo: 'https://api.raydium.io/v2/main/pool',
  pairs: 'https://api.raydium.io/v2/main/pairs',
  price: 'https://api.raydium.io/v2/main/price',
} as const;

/**
 * Orca Whirlpool API endpoints
 */
export const ORCA_API = {
  whirlpools: 'https://api.orca.so/allPools',
  quote: 'https://api.orca.so/v1/quote',
} as const;

/**
 * Get priority fee estimate from RPC
 */
export async function getPriorityFeeEstimate(
  connection: any,
  accountKeys?: string[]
): Promise<number> {
  try {
    // Use getRecentPrioritizationFees RPC method
    const fees = await connection.getRecentPrioritizationFees({
      lockedWritableAccounts: accountKeys,
    });

    if (fees.length === 0) return 1000; // Default 1000 microlamports

    // Get median fee
    const sortedFees = fees
      .map((f: any) => f.prioritizationFee)
      .sort((a: number, b: number) => a - b);
    const median = sortedFees[Math.floor(sortedFees.length / 2)];

    return Math.max(median, 1000); // Minimum 1000 microlamports
  } catch {
    return 1000; // Default on error
  }
}

/**
 * Get Jito tip amount for MEV protection
 */
export function getJitoTipAmount(priority: 'low' | 'medium' | 'high'): number {
  switch (priority) {
    case 'low':
      return 1000; // 0.000001 SOL
    case 'medium':
      return 10000; // 0.00001 SOL
    case 'high':
      return 100000; // 0.0001 SOL
    default:
      return 10000;
  }
}

/**
 * Jito block engine URLs
 */
export const JITO_ENDPOINTS = {
  mainnet: 'https://mainnet.block-engine.jito.wtf',
  amsterdam: 'https://amsterdam.mainnet.block-engine.jito.wtf',
  frankfurt: 'https://frankfurt.mainnet.block-engine.jito.wtf',
  ny: 'https://ny.mainnet.block-engine.jito.wtf',
  tokyo: 'https://tokyo.mainnet.block-engine.jito.wtf',
} as const;

/**
 * Supported DEX list for filtering
 */
export const SUPPORTED_DEXES: SolanaDex[] = [
  'jupiter',
  'raydium',
  'raydium-clmm',
  'orca',
  'orca-whirlpool',
  'meteora',
  'meteora-dlmm',
  'phoenix',
  'lifinity',
  'openbook',
  'openbook-v2',
  'aldrin',
  'saber',
  'marinade',
  'goosefx',
  'fluxbeam',
];

/**
 * Get best quote from multiple sources
 */
export async function getBestQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<SolanaSwapQuote | null> {
  // Jupiter aggregates most DEXes, so it's our primary source
  const jupiterQuote = await getJupiterQuote({
    inputMint,
    outputMint,
    amount,
    slippageBps,
  });

  if (!jupiterQuote) return null;

  return jupiterQuoteToSolanaQuote(jupiterQuote);
}
