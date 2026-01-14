/**
 * API Module for ChainHopper Web Panel
 */

// Client
export { apiClient, type ApiResponse, type ApiClientConfig } from './client';

// Endpoints
export { api, auth, portfolio, trading, analytics, user, chains, health } from './endpoints';

// Types
export type {
  Chain,
  Token,
  User,
  AuthResponse,
  Holding,
  Portfolio,
  PortfolioByChain,
  Quote,
  SwapRequest,
  SwapResponse,
  Trade,
  TradingStats,
  ChainStats,
  PnLHistory,
  Analytics,
  UserSettings,
  ApiKey,
  ReferralStats,
  HealthStatus,
} from './types';
