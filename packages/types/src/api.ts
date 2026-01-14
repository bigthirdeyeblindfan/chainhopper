import type { ChainId } from './chains.js';
import type { SwapQuote, SwapTransaction } from './trading.js';
import type { Position } from './trading.js';
import type { TokenBalance } from './tokens.js';

/**
 * REST API types
 */

// Request types
export interface GetQuoteRequest {
  chainId: ChainId;
  tokenIn: string;
  tokenOut: string;
  amountIn: string; // bigint as string
  slippage?: number;
}

export interface ExecuteSwapRequest {
  quoteId: string;
  signedTransaction: string;
}

export interface CreateApiKeyRequest {
  name: string;
  permissions: string[];
  expiresInDays?: number;
}

// Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  timestamp: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Endpoint responses
export interface QuoteResponse {
  quote: SwapQuote;
  warnings?: string[];
}

export interface SwapResponse {
  transaction: SwapTransaction;
}

export interface PortfolioResponse {
  balances: TokenBalance[];
  positions: Position[];
  totalValueUsd: number;
  totalPnlUsd: number;
  totalPnlPercent: number;
}

export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  chains: {
    chainId: ChainId;
    status: 'up' | 'down';
    latency: number;
  }[];
}

/**
 * WebSocket types
 */
export type WsMessageType =
  | 'subscribe'
  | 'unsubscribe'
  | 'price_update'
  | 'trade_update'
  | 'position_update'
  | 'error';

export interface WsMessage<T = unknown> {
  type: WsMessageType;
  channel?: string;
  data?: T;
  timestamp: string;
}

export interface WsSubscription {
  channel: 'prices' | 'trades' | 'positions';
  params?: {
    chainId?: ChainId;
    tokens?: string[];
  };
}

export interface WsPriceUpdate {
  chainId: ChainId;
  tokenAddress: string;
  price: number;
  change24h: number;
}

export interface WsTradeUpdate {
  transaction: SwapTransaction;
}
