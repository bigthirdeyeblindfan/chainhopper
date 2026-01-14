/**
 * WebSocket Types for ChainHopper Real-Time API
 *
 * Events are categorized into:
 * - Price updates (token prices, charts)
 * - Trade events (order status, fills, cancellations)
 * - Portfolio events (balance changes, P&L updates)
 * - System events (connection status, errors, maintenance)
 */

// ============ Base Types ============

export type WebSocketEventType =
  // Price events
  | 'price:update'
  | 'price:subscribe'
  | 'price:unsubscribe'
  // Trade events
  | 'trade:pending'
  | 'trade:confirmed'
  | 'trade:failed'
  | 'trade:cancelled'
  // Portfolio events
  | 'portfolio:update'
  | 'portfolio:balance'
  | 'portfolio:pnl'
  // System events
  | 'system:connected'
  | 'system:error'
  | 'system:ping'
  | 'system:pong'
  | 'system:maintenance'
  // Subscription management
  | 'subscribe'
  | 'unsubscribe';

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
  timestamp: string;
  requestId?: string;
}

export interface WebSocketError {
  code: string;
  message: string;
  details?: unknown;
}

// ============ Price Events ============

export interface PriceUpdate {
  chainId: number;
  tokenAddress: string;
  symbol: string;
  priceUsd: string;
  priceNative: string;
  change24h: number;
  volume24h: string;
  marketCap?: string;
}

export interface PriceSubscription {
  chainId: number;
  tokenAddresses: string[];
}

// ============ Trade Events ============

export type TradeStatus = 'pending' | 'confirmed' | 'failed' | 'cancelled';

export interface TradeEvent {
  tradeId: string;
  userId: string;
  chainId: number;
  status: TradeStatus;
  tokenIn: {
    address: string;
    symbol: string;
    amount: string;
  };
  tokenOut: {
    address: string;
    symbol: string;
    amount: string;
    amountExpected?: string;
  };
  txHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  fee?: {
    amount: string;
    token: string;
  };
  error?: string;
  createdAt: string;
  updatedAt: string;
}

// ============ Portfolio Events ============

export interface PortfolioUpdate {
  userId: string;
  chainId: number;
  totalValueUsd: string;
  change24h: number;
  holdings: PortfolioHolding[];
}

export interface PortfolioHolding {
  tokenAddress: string;
  symbol: string;
  balance: string;
  valueUsd: string;
  price: string;
  change24h: number;
}

export interface BalanceUpdate {
  userId: string;
  chainId: number;
  tokenAddress: string;
  symbol: string;
  previousBalance: string;
  newBalance: string;
  changeAmount: string;
  valueUsd: string;
  reason: 'trade' | 'transfer_in' | 'transfer_out' | 'sync';
}

export interface PnLUpdate {
  userId: string;
  chainId?: number; // Optional - if not set, it's aggregate
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  totalPnlPercent: number;
  period: '24h' | '7d' | '30d' | 'all';
}

// ============ System Events ============

export interface SystemConnected {
  connectionId: string;
  userId?: string;
  serverTime: string;
  version: string;
}

export interface SystemMaintenance {
  scheduled: boolean;
  startTime: string;
  endTime?: string;
  message: string;
}

// ============ Subscription Types ============

export type SubscriptionChannel =
  | 'prices'
  | 'trades'
  | 'portfolio'
  | 'system';

export interface SubscriptionRequest {
  channel: SubscriptionChannel;
  params?: {
    chainId?: number;
    tokenAddresses?: string[];
    userId?: string;
  };
}

export interface SubscriptionResponse {
  channel: SubscriptionChannel;
  subscribed: boolean;
  params?: Record<string, unknown>;
}

// ============ Client Connection ============

export interface ClientConnection {
  id: string;
  userId?: string;
  socket: WebSocket;
  subscriptions: Set<string>;
  connectedAt: Date;
  lastPing: Date;
  authenticated: boolean;
  metadata: {
    ip?: string;
    userAgent?: string;
  };
}

// ============ Authentication ============

export interface AuthenticateMessage {
  type: 'authenticate';
  payload: {
    token?: string; // JWT
    apiKey?: string;
    telegramInitData?: string;
  };
}

export interface AuthenticateResponse {
  success: boolean;
  userId?: string;
  error?: string;
}
