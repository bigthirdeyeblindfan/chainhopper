import type { ChainId } from './chains.js';

export interface User {
  id: string;
  telegramId?: string;
  telegramUsername?: string;
  email?: string;
  tier: UserTier;
  referralCode: string;
  referredBy?: string;
  settings: UserSettings;
  stats: UserStats;
  createdAt: Date;
  updatedAt: Date;
}

export type UserTier =
  | 'free'        // 15% profit share
  | 'holder'      // 10% - holds 1,000 $HOPPER
  | 'staker'      // 5%  - stakes 10,000 veHOPPER
  | 'enterprise'; // 2-5% - custom deal

export interface UserSettings {
  defaultSlippage: number;
  defaultChain: ChainId;
  notifications: NotificationSettings;
  autoApprove: boolean;
  maxTradeSize?: number; // USD limit
}

export interface NotificationSettings {
  tradeConfirmations: boolean;
  priceAlerts: boolean;
  portfolioUpdates: boolean;
  newListings: boolean;
}

export interface UserStats {
  totalTrades: number;
  totalVolumeUsd: number;
  totalProfitUsd: number;
  totalLossUsd: number;
  totalFeePaidUsd: number;
  winRate: number; // percentage
  bestTrade?: {
    tokenSymbol: string;
    profitUsd: number;
    profitPercent: number;
  };
  worstTrade?: {
    tokenSymbol: string;
    lossUsd: number;
    lossPercent: number;
  };
}

export interface Wallet {
  id: string;
  userId: string;
  chainId: ChainId;
  address: string;
  label?: string;
  isDefault: boolean;
  createdAt: Date;
}

export interface ApiKey {
  id: string;
  userId: string;
  name: string;
  keyHash: string; // hashed, never store plain
  permissions: ApiPermission[];
  rateLimit: number; // requests per minute
  lastUsedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export type ApiPermission =
  | 'read:portfolio'
  | 'read:quotes'
  | 'write:trades'
  | 'write:settings';
