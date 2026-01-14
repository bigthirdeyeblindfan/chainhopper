/**
 * API Types for ChainHopper Web Panel
 *
 * Type definitions matching the backend API responses.
 */

// ============ Common Types ============

export interface Chain {
  chainId: string;
  name: string;
  nativeCurrency: {
    symbol: string;
    decimals: number;
  };
  rpcUrl: string;
  explorerUrl: string;
  status: 'up' | 'down';
}

export interface Token {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  chainId: string;
  logoUrl?: string;
  priceUsd?: string;
  change24h?: number;
}

// ============ Auth Types ============

export interface User {
  id: string;
  email?: string;
  telegramId?: string;
  tier: 'free' | 'holder' | 'staker' | 'enterprise';
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  expiresAt: string;
}

// ============ Portfolio Types ============

export interface Holding {
  token: Token;
  chainId: string;
  balance: string;
  balanceUsd: string;
  price: string;
  change24h: number;
  costBasis?: string;
  unrealizedPnl?: string;
  unrealizedPnlPercent?: number;
}

export interface Portfolio {
  totalValueUsd: string;
  change24h: number;
  change24hUsd: string;
  allTimePnl: string;
  allTimePnlPercent: number;
  holdings: Holding[];
}

export interface PortfolioByChain {
  chainId: string;
  chainName: string;
  totalValueUsd: string;
  holdings: Holding[];
}

// ============ Trading Types ============

export interface Quote {
  chainId: string;
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  route: string[];
  fee: {
    amount: string;
    percent: number;
    token: string;
  };
  estimatedGas: string;
  expiresAt: string;
}

export interface SwapRequest {
  chainId: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage: number;
  deadline?: number;
}

export interface SwapResponse {
  tradeId: string;
  status: 'pending' | 'confirmed' | 'failed';
  txHash?: string;
  quote: Quote;
}

export interface Trade {
  id: string;
  chainId: string;
  status: 'pending' | 'confirmed' | 'failed' | 'cancelled';
  tokenIn: Token;
  tokenOut: Token;
  amountIn: string;
  amountOut: string;
  txHash?: string;
  blockNumber?: number;
  fee?: {
    amount: string;
    token: string;
  };
  profit?: string;
  profitPercent?: number;
  createdAt: string;
  confirmedAt?: string;
}

// ============ Analytics Types ============

export interface TradingStats {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalVolume: string;
  totalProfit: string;
  totalFees: string;
  averageTradeSize: string;
}

export interface ChainStats {
  chainId: string;
  chainName: string;
  trades: number;
  volume: string;
  profit: string;
}

export interface PnLHistory {
  date: string;
  realizedPnl: string;
  unrealizedPnl: string;
  totalPnl: string;
  cumulativePnl: string;
}

export interface Analytics {
  stats: TradingStats;
  byChain: ChainStats[];
  pnlHistory: PnLHistory[];
}

// ============ User Settings Types ============

export interface UserSettings {
  defaultSlippage: number;
  defaultDeadline: number;
  preferredChains: string[];
  notifications: {
    email: boolean;
    telegram: boolean;
    tradeFills: boolean;
    priceAlerts: boolean;
  };
  theme: 'light' | 'dark' | 'system';
}

export interface ApiKey {
  id: string;
  name: string;
  key: string; // Only shown on creation
  permissions: string[];
  createdAt: string;
  lastUsed?: string;
}

// ============ Referral Types ============

export interface ReferralStats {
  code: string;
  referralCount: number;
  totalEarnings: string;
  pendingEarnings: string;
  tier: 'bronze' | 'silver' | 'gold' | 'diamond';
  referrerSharePercent: number;
}

// ============ Health Types ============

export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  chains: Array<{
    chainId: string;
    status: 'up' | 'down';
    latency: number;
  }>;
}
