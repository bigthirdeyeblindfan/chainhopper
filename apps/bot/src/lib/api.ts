/**
 * API client placeholder for backend integration
 *
 * This file will contain the API client for communicating with the
 * ChainHopper backend API (Agent B). Currently contains type definitions
 * and stub implementations.
 */

import type { ChainId, SwapQuote, TokenInfo } from '../types.js';

export interface BalanceResponse {
  nativeToken: string;
  nativeBalance: string;
  nativeBalanceFormatted: string;
  nativeValueUsd?: number;
  tokens: TokenBalance[];
  totalValueUsd?: number;
}

export interface TokenBalance {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  valueUsd?: number;
}

export interface QuoteRequest {
  chainId: ChainId;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  slippageBps: number;
}

export interface SwapBuildRequest extends SwapQuote {
  walletAddress: string;
}

export interface SwapBuildResponse {
  transaction: unknown;
  estimatedGas?: string;
}

export interface TransactionHistory {
  id: string;
  chainId: ChainId;
  type: 'swap';
  tokenIn: TokenInfo;
  tokenOut: TokenInfo;
  amountIn: string;
  amountOut: string;
  txHash: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  pnl?: number;
}

const API_URL = process.env['API_URL'] ?? 'http://localhost:3000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async getBalance(
    _chainId: ChainId,
    _walletAddress: string
  ): Promise<BalanceResponse> {
    // TODO: Implement actual API call
    throw new Error('API integration not yet implemented');
  }

  async getQuote(_request: QuoteRequest): Promise<SwapQuote> {
    // TODO: Implement actual API call
    throw new Error('API integration not yet implemented');
  }

  async buildSwap(_request: SwapBuildRequest): Promise<SwapBuildResponse> {
    // TODO: Implement actual API call
    throw new Error('API integration not yet implemented');
  }

  async getHistory(
    _chainId: ChainId,
    _walletAddress: string
  ): Promise<TransactionHistory[]> {
    // TODO: Implement actual API call
    throw new Error('API integration not yet implemented');
  }
}

export const api = new ApiClient(API_URL);
