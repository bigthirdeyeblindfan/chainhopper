import type { ChainId } from './chains.js';
import type { Token } from './tokens.js';

export interface SwapQuote {
  id: string;
  chainId: ChainId;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: bigint;
  amountOut: bigint;
  amountOutMin: bigint; // after slippage
  priceImpact: number; // percentage
  route: SwapRoute[];
  estimatedGas: bigint;
  gasPrice: bigint;
  fee: FeeBreakdown;
  expiresAt: Date;
  dexAggregator: DexAggregator;
}

export interface SwapRoute {
  dex: string;
  poolAddress: string;
  tokenIn: string;
  tokenOut: string;
  percentage: number; // of total amount
}

export type DexAggregator =
  | 'jupiter'    // Solana
  | '1inch'      // EVM
  | 'paraswap'   // EVM
  | '0x'         // EVM
  | 'stonfi'     // TON
  | 'dedust'     // TON
  | 'cetus'      // Sui
  | 'turbos';    // Sui

export interface SwapRequest {
  chainId: ChainId;
  tokenIn: string; // address
  tokenOut: string; // address
  amountIn: bigint;
  slippage: number; // percentage, e.g., 0.5 for 0.5%
  recipient: string;
  deadline?: number; // unix timestamp
}

export interface SwapTransaction {
  id: string;
  quoteId: string;
  userId: string;
  chainId: ChainId;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: bigint;
  amountOut: bigint;
  txHash?: string;
  status: SwapStatus;
  fee: FeeBreakdown;
  profit?: bigint; // calculated after sell
  createdAt: Date;
  executedAt?: Date;
  confirmedAt?: Date;
}

export type SwapStatus =
  | 'pending'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'expired';

export interface FeeBreakdown {
  totalFeeUsd: number;
  protocolFee: bigint;      // our fee
  protocolFeeUsd: number;
  networkFee: bigint;       // gas
  networkFeeUsd: number;
  dexFee?: bigint;          // LP fee
  dexFeeUsd?: number;
}

export interface Position {
  id: string;
  userId: string;
  chainId: ChainId;
  token: Token;
  entryTx: SwapTransaction;
  exitTx?: SwapTransaction;
  entryPrice: number;
  exitPrice?: number;
  amount: bigint;
  costBasis: number;        // USD
  currentValue?: number;    // USD
  unrealizedPnl?: number;   // USD
  realizedPnl?: number;     // USD
  realizedPnlPercent?: number;
  isOpen: boolean;
  openedAt: Date;
  closedAt?: Date;
}
