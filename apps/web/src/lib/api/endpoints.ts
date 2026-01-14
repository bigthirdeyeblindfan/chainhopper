/**
 * API Endpoints for ChainHopper Web Panel
 *
 * Typed API functions for all backend endpoints.
 */

import { apiClient, ApiResponse } from './client';
import type {
  AuthResponse,
  User,
  Portfolio,
  PortfolioByChain,
  Quote,
  SwapRequest,
  SwapResponse,
  Trade,
  Analytics,
  UserSettings,
  ApiKey,
  ReferralStats,
  HealthStatus,
  Chain,
  Token,
} from './types';

// ============ Auth Endpoints ============

export const auth = {
  /**
   * Login with email/password
   */
  login: (email: string, password: string): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/login', { email, password }),

  /**
   * Register new account
   */
  register: (email: string, password: string): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/register', { email, password }),

  /**
   * Verify Telegram login
   */
  telegramLogin: (initData: string): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/telegram', { initData }),

  /**
   * Refresh access token
   */
  refresh: (refreshToken: string): Promise<ApiResponse<AuthResponse>> =>
    apiClient.post('/auth/refresh', { refreshToken }),

  /**
   * Get current user
   */
  me: (): Promise<ApiResponse<User>> => apiClient.get('/auth/me'),

  /**
   * Logout
   */
  logout: (): Promise<ApiResponse<void>> => apiClient.post('/auth/logout'),
};

// ============ Portfolio Endpoints ============

export const portfolio = {
  /**
   * Get user's full portfolio
   */
  get: (): Promise<ApiResponse<Portfolio>> => apiClient.get('/portfolio'),

  /**
   * Get portfolio by chain
   */
  getByChain: (chainId: string): Promise<ApiResponse<PortfolioByChain>> =>
    apiClient.get(`/portfolio/chain/${chainId}`),

  /**
   * Get all chains with user's holdings
   */
  getChains: (): Promise<ApiResponse<PortfolioByChain[]>> =>
    apiClient.get('/portfolio/chains'),

  /**
   * Sync portfolio (fetch latest balances)
   */
  sync: (chainId?: string): Promise<ApiResponse<Portfolio>> =>
    apiClient.post('/portfolio/sync', { chainId }),
};

// ============ Trading Endpoints ============

export const trading = {
  /**
   * Get swap quote
   */
  getQuote: (request: SwapRequest): Promise<ApiResponse<Quote>> =>
    apiClient.post('/trading/quote', request),

  /**
   * Execute swap
   */
  swap: (request: SwapRequest & { walletAddress: string }): Promise<ApiResponse<SwapResponse>> =>
    apiClient.post('/trading/swap', request),

  /**
   * Get user's trade history
   */
  getHistory: (params?: {
    chainId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ApiResponse<{ trades: Trade[]; total: number }>> =>
    apiClient.get('/trading/history', params as Record<string, string>),

  /**
   * Get trade by ID
   */
  getTrade: (tradeId: string): Promise<ApiResponse<Trade>> =>
    apiClient.get(`/trading/${tradeId}`),

  /**
   * Cancel pending trade
   */
  cancelTrade: (tradeId: string): Promise<ApiResponse<Trade>> =>
    apiClient.post(`/trading/${tradeId}/cancel`),
};

// ============ Analytics Endpoints ============

export const analytics = {
  /**
   * Get user analytics
   */
  get: (period?: '24h' | '7d' | '30d' | 'all'): Promise<ApiResponse<Analytics>> =>
    apiClient.get('/analytics', period ? { period } : undefined),

  /**
   * Get P&L history
   */
  getPnLHistory: (params?: {
    period?: '7d' | '30d' | '90d' | 'all';
  }): Promise<ApiResponse<{ history: Analytics['pnlHistory'] }>> =>
    apiClient.get('/analytics/pnl', params as Record<string, string>),
};

// ============ User Endpoints ============

export const user = {
  /**
   * Get user settings
   */
  getSettings: (): Promise<ApiResponse<UserSettings>> => apiClient.get('/user/settings'),

  /**
   * Update user settings
   */
  updateSettings: (settings: Partial<UserSettings>): Promise<ApiResponse<UserSettings>> =>
    apiClient.patch('/user/settings', settings),

  /**
   * Get user's API keys
   */
  getApiKeys: (): Promise<ApiResponse<ApiKey[]>> => apiClient.get('/user/api-keys'),

  /**
   * Create new API key
   */
  createApiKey: (
    name: string,
    permissions: string[]
  ): Promise<ApiResponse<ApiKey>> =>
    apiClient.post('/user/api-keys', { name, permissions }),

  /**
   * Delete API key
   */
  deleteApiKey: (keyId: string): Promise<ApiResponse<void>> =>
    apiClient.delete(`/user/api-keys/${keyId}`),

  /**
   * Get referral stats
   */
  getReferralStats: (): Promise<ApiResponse<ReferralStats>> =>
    apiClient.get('/user/referrals'),

  /**
   * Generate referral code
   */
  generateReferralCode: (): Promise<ApiResponse<{ code: string }>> =>
    apiClient.post('/user/referrals/generate'),
};

// ============ Chain/Token Endpoints ============

export const chains = {
  /**
   * Get all supported chains
   */
  getAll: (): Promise<ApiResponse<Chain[]>> => apiClient.get('/chains'),

  /**
   * Get chain by ID
   */
  get: (chainId: string): Promise<ApiResponse<Chain>> =>
    apiClient.get(`/chains/${chainId}`),

  /**
   * Get tokens for a chain
   */
  getTokens: (chainId: string, search?: string): Promise<ApiResponse<Token[]>> =>
    apiClient.get(`/chains/${chainId}/tokens`, search ? { search } : undefined),
};

// ============ Health Endpoints ============

export const health = {
  /**
   * Get health status
   */
  check: (): Promise<ApiResponse<HealthStatus>> => apiClient.get('/health'),

  /**
   * Get readiness status
   */
  ready: (): Promise<ApiResponse<{ ready: boolean }>> => apiClient.get('/ready'),
};

// Export all endpoints
export const api = {
  auth,
  portfolio,
  trading,
  analytics,
  user,
  chains,
  health,
};

export default api;
