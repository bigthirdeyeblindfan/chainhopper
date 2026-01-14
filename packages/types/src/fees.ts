import type { ChainId } from './chains.js';
import type { UserTier } from './users.js';

/**
 * Profit-share fee model
 * "Free to trade. Pay only when you profit."
 */

export interface FeeTier {
  tier: UserTier;
  profitSharePercent: number;
  description: string;
}

export const FEE_TIERS: Record<UserTier, FeeTier> = {
  free: {
    tier: 'free',
    profitSharePercent: 15,
    description: 'Zero friction acquisition',
  },
  holder: {
    tier: 'holder',
    profitSharePercent: 10,
    description: 'Hold 1,000 $HOPPER',
  },
  staker: {
    tier: 'staker',
    profitSharePercent: 5,
    description: 'Stake 10,000 veHOPPER',
  },
  enterprise: {
    tier: 'enterprise',
    profitSharePercent: 3, // 2-5% custom
    description: 'Custom B2B deal',
  },
};

export interface FeeCalculation {
  positionId: string;
  userId: string;
  userTier: UserTier;
  chainId: ChainId;
  realizedProfit: bigint;
  realizedProfitUsd: number;
  profitSharePercent: number;
  feeAmount: bigint;
  feeAmountUsd: number;
  referrerShare?: bigint;     // if referred
  referrerShareUsd?: number;
  calculatedAt: Date;
}

export interface FeeCollection {
  id: string;
  feeCalculationId: string;
  chainId: ChainId;
  txHash: string;
  tokenAddress: string;
  amount: bigint;
  amountUsd: number;
  collectedAt: Date;
}

export interface ProtocolRevenue {
  period: 'daily' | 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  totalFeesCollectedUsd: number;
  totalReferralPaidUsd: number;
  netRevenueUsd: number;
  byChain: Record<ChainId, number>;
  byTier: Record<UserTier, number>;
}
