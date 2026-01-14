/**
 * API client for ChainHopper backend integration
 *
 * Handles authentication, trading, portfolio, and user operations
 * by communicating with the REST API.
 */

import type { ChainId, SwapQuote, TokenInfo } from '../types.js';

// ============================================================================
// Types
// ============================================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface BalanceResponse {
  balances: TokenBalance[];
  totalValueUsd: number;
}

export interface TokenBalance {
  token: {
    address: string;
    chainId: ChainId;
    symbol: string;
    name: string;
    decimals: number;
    logoUri?: string;
  };
  balance: string;
  balanceFormatted: string;
  valueUsd: number;
  priceUsd?: number;
  priceChange24h?: number;
}

export interface QuoteRequest {
  chainId: ChainId;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippage?: string;
}

export interface QuoteResponse {
  id: string;
  chainId: ChainId;
  tokenIn: TokenInfo & { chainId: ChainId };
  tokenOut: TokenInfo & { chainId: ChainId };
  amountIn: string;
  amountOut: string;
  amountOutMin: string;
  priceImpact: number;
  route: Array<{
    dex: string;
    poolAddress: string;
    tokenIn: string;
    tokenOut: string;
    percentage: number;
  }>;
  estimatedGas: string;
  gasPrice: string;
  fee: {
    totalFeeUsd: number;
    protocolFee: string;
    protocolFeeUsd: number;
    networkFee: string;
    networkFeeUsd: number;
  };
  expiresAt: string;
  dexAggregator: string;
}

export interface SwapBuildRequest {
  quoteId: string;
  recipient: string;
  deadline?: number;
}

export interface SwapBuildResponse {
  quoteId: string;
  chainId: ChainId;
  to: string;
  data: string;
  value: string;
  gasLimit: string;
  expiresAt: string;
}

export interface SwapSubmitRequest {
  quoteId: string;
  txHash: string;
}

export interface SwapResponse {
  id: string;
  quoteId: string;
  status: 'pending' | 'submitted' | 'confirming' | 'confirmed' | 'failed' | 'expired';
  txHash?: string;
  chainId: ChainId;
  tokenIn: TokenInfo & { chainId: ChainId };
  tokenOut: TokenInfo & { chainId: ChainId };
  amountIn: string;
  amountOut?: string;
  fee: {
    totalFeeUsd: number;
    protocolFee: string;
    protocolFeeUsd: number;
    networkFee: string;
    networkFeeUsd: number;
  };
  createdAt: string;
  executedAt?: string;
  confirmedAt?: string;
}

export interface HistoryResponse {
  swaps: SwapResponse[];
  total: number;
  limit: number;
  offset: number;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  totalCostBasisUsd: number;
  totalUnrealizedPnlUsd: number;
  totalUnrealizedPnlPercent: number;
  totalRealizedPnlUsd: number;
  totalFeePaidUsd: number;
  byChain: Array<{
    chainId: ChainId;
    valueUsd: number;
    pnlUsd: number;
    pnlPercent: number;
  }>;
}

export interface UserProfile {
  id: string;
  telegramId?: string;
  telegramUsername?: string;
  tier: 'FREE' | 'HOLDER' | 'STAKER' | 'ENTERPRISE';
  referralCode: string;
  settings: {
    defaultSlippage: number;
    defaultChain: ChainId;
    notifications: {
      tradeConfirmations: boolean;
      priceAlerts: boolean;
      portfolioUpdates: boolean;
      newListings: boolean;
    };
    autoApprove: boolean;
  };
  createdAt: string;
}

export interface ApiError {
  error: string;
  code: string;
}

// ============================================================================
// API Client
// ============================================================================

const API_URL = process.env['API_URL'] ?? 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;
  private tokens: Map<number, AuthTokens> = new Map(); // userId -> tokens

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  // --------------------------------------------------------------------------
  // Authentication
  // --------------------------------------------------------------------------

  /**
   * Authenticate a Telegram user and get tokens
   */
  async authenticateTelegram(
    telegramId: number,
    authData: TelegramAuthData
  ): Promise<AuthTokens> {
    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
      isNewUser: boolean;
    }>('/auth/telegram', {
      method: 'POST',
      body: JSON.stringify(authData),
    });

    const tokens: AuthTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };

    this.tokens.set(telegramId, tokens);
    return tokens;
  }

  /**
   * Refresh access token for a user
   */
  async refreshAccessToken(telegramId: number): Promise<AuthTokens> {
    const existingTokens = this.tokens.get(telegramId);
    if (!existingTokens) {
      throw new Error('No tokens found for user');
    }

    const response = await this.request<{
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
      tokenType: string;
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: existingTokens.refreshToken }),
    });

    const tokens: AuthTokens = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      expiresAt: Date.now() + response.expiresIn * 1000,
    };

    this.tokens.set(telegramId, tokens);
    return tokens;
  }

  /**
   * Get valid access token, refreshing if needed
   */
  async getAccessToken(telegramId: number): Promise<string> {
    const tokens = this.tokens.get(telegramId);
    if (!tokens) {
      throw new Error('Not authenticated. Use /start to login.');
    }

    // Refresh if expiring within 5 minutes
    if (tokens.expiresAt < Date.now() + 5 * 60 * 1000) {
      const newTokens = await this.refreshAccessToken(telegramId);
      return newTokens.accessToken;
    }

    return tokens.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(telegramId: number): boolean {
    return this.tokens.has(telegramId);
  }

  /**
   * Store tokens (for session restoration)
   */
  setTokens(telegramId: number, tokens: AuthTokens): void {
    this.tokens.set(telegramId, tokens);
  }

  /**
   * Get stored tokens
   */
  getTokens(telegramId: number): AuthTokens | undefined {
    return this.tokens.get(telegramId);
  }

  /**
   * Clear tokens (logout)
   */
  clearTokens(telegramId: number): void {
    this.tokens.delete(telegramId);
  }

  // --------------------------------------------------------------------------
  // Trading
  // --------------------------------------------------------------------------

  /**
   * Get a swap quote
   */
  async getQuote(request: QuoteRequest): Promise<QuoteResponse> {
    const params = new URLSearchParams({
      chainId: request.chainId,
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      amountIn: request.amountIn,
    });
    if (request.slippage) {
      params.set('slippage', request.slippage);
    }

    return this.request<QuoteResponse>(`/quote?${params.toString()}`);
  }

  /**
   * Build a swap transaction
   */
  async buildSwap(
    telegramId: number,
    request: SwapBuildRequest
  ): Promise<SwapBuildResponse> {
    const token = await this.getAccessToken(telegramId);
    return this.request<SwapBuildResponse>('/swap/build', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
  }

  /**
   * Submit a swap transaction
   */
  async submitSwap(
    telegramId: number,
    request: SwapSubmitRequest
  ): Promise<SwapResponse> {
    const token = await this.getAccessToken(telegramId);
    return this.request<SwapResponse>('/swap/submit', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(request),
    });
  }

  /**
   * Get swap status
   */
  async getSwapStatus(telegramId: number, swapId: string): Promise<SwapResponse> {
    const token = await this.getAccessToken(telegramId);
    return this.request<SwapResponse>(`/swap/${swapId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * List user's swaps
   */
  async listSwaps(
    telegramId: number,
    options?: { chainId?: ChainId; status?: string; limit?: number; offset?: number }
  ): Promise<HistoryResponse> {
    const token = await this.getAccessToken(telegramId);
    const params = new URLSearchParams();
    if (options?.chainId) params.set('chainId', options.chainId);
    if (options?.status) params.set('status', options.status);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    return this.request<HistoryResponse>(`/swaps?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // --------------------------------------------------------------------------
  // Portfolio
  // --------------------------------------------------------------------------

  /**
   * Get token balances
   */
  async getBalances(
    telegramId: number,
    chainId?: ChainId
  ): Promise<BalanceResponse> {
    const token = await this.getAccessToken(telegramId);
    const params = chainId ? `?chainId=${chainId}` : '';
    return this.request<BalanceResponse>(`/portfolio/balances${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Get portfolio summary
   */
  async getPortfolioSummary(telegramId: number): Promise<PortfolioSummary> {
    const token = await this.getAccessToken(telegramId);
    return this.request<PortfolioSummary>('/portfolio/summary', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Get trade history with P&L
   */
  async getHistory(
    telegramId: number,
    options?: { chainId?: ChainId; limit?: number; offset?: number }
  ): Promise<{
    trades: Array<{
      id: string;
      chainId: ChainId;
      type: 'buy' | 'sell';
      tokenIn: { symbol: string; amount: string; amountUsd: number };
      tokenOut: { symbol: string; amount: string; amountUsd: number };
      profit?: number;
      profitPercent?: number;
      fee: number;
      txHash: string;
      executedAt: string;
    }>;
    total: number;
  }> {
    const token = await this.getAccessToken(telegramId);
    const params = new URLSearchParams();
    if (options?.chainId) params.set('chainId', options.chainId);
    if (options?.limit) params.set('limit', options.limit.toString());
    if (options?.offset) params.set('offset', options.offset.toString());

    return this.request(`/portfolio/history?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // --------------------------------------------------------------------------
  // User
  // --------------------------------------------------------------------------

  /**
   * Get user profile
   */
  async getProfile(telegramId: number): Promise<UserProfile> {
    const token = await this.getAccessToken(telegramId);
    return this.request<UserProfile>('/user/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Update user settings
   */
  async updateSettings(
    telegramId: number,
    settings: Partial<UserProfile['settings']>
  ): Promise<UserProfile['settings']> {
    const token = await this.getAccessToken(telegramId);
    return this.request<UserProfile['settings']>('/user/settings', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify(settings),
    });
  }

  /**
   * Add wallet address
   */
  async addWallet(
    telegramId: number,
    chainId: ChainId,
    address: string,
    label?: string
  ): Promise<{ id: string; chainId: ChainId; address: string; label?: string }> {
    const token = await this.getAccessToken(telegramId);
    return this.request('/user/wallets', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ chainId, address, label }),
    });
  }

  /**
   * Get user wallets
   */
  async getWallets(
    telegramId: number,
    chainId?: ChainId
  ): Promise<{
    wallets: Array<{
      id: string;
      chainId: ChainId;
      address: string;
      label?: string;
      isDefault: boolean;
    }>;
  }> {
    const token = await this.getAccessToken(telegramId);
    const params = chainId ? `?chainId=${chainId}` : '';
    return this.request(`/user/wallets${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Get referral stats
   */
  async getReferralStats(telegramId: number): Promise<{
    code: string;
    currentTier: string;
    totalReferrals: number;
    activeReferrals: number;
    totalEarningsUsd: number;
    pendingEarningsUsd: number;
  }> {
    const token = await this.getAccessToken(telegramId);
    return this.request('/user/referrals', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  /**
   * Get user points
   */
  async getPoints(telegramId: number): Promise<{
    totalPoints: number;
    tradingPoints: number;
    referralPoints: number;
    bonusPoints: number;
    rank?: number;
  }> {
    const token = await this.getAccessToken(telegramId);
    return this.request('/user/points', {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // --------------------------------------------------------------------------
  // Tokens
  // --------------------------------------------------------------------------

  /**
   * Search tokens
   */
  async searchTokens(
    chainId: ChainId,
    query?: string,
    verified?: boolean
  ): Promise<{
    tokens: Array<TokenInfo & { chainId: ChainId; priceUsd?: number; priceChange24h?: number }>;
  }> {
    const params = new URLSearchParams({ chainId });
    if (query) params.set('query', query);
    if (verified !== undefined) params.set('verified', verified.toString());

    return this.request(`/tokens?${params.toString()}`);
  }

  /**
   * Get token details
   */
  async getToken(
    chainId: ChainId,
    address: string
  ): Promise<TokenInfo & {
    chainId: ChainId;
    priceUsd?: number;
    priceChange24h?: number;
    volume24h?: number;
    marketCap?: number;
    isRugPull: boolean;
    rugScore?: number;
  }> {
    return this.request(`/tokens/${chainId}/${address}`);
  }

  // --------------------------------------------------------------------------
  // Internal
  // --------------------------------------------------------------------------

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ApiClientError(
        error.error || 'Request failed',
        error.code || 'UNKNOWN_ERROR',
        response.status
      );
    }

    return data as T;
  }
}

export class ApiClientError extends Error {
  code: string;
  status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

export const api = new ApiClient(API_URL);
