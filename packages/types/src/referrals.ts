/**
 * Referral program - competitive with Trojan's $65.8M payouts
 */

export type ReferralTier = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface ReferralTierConfig {
  tier: ReferralTier;
  minWeeklyVolume: number;  // USD
  referrerShare: number;    // percentage of fees
  refereeDiscount: number;  // percentage off fees
}

export const REFERRAL_TIERS: Record<ReferralTier, ReferralTierConfig> = {
  bronze: {
    tier: 'bronze',
    minWeeklyVolume: 0,
    referrerShare: 20,
    refereeDiscount: 5,
  },
  silver: {
    tier: 'silver',
    minWeeklyVolume: 10_000,
    referrerShare: 25,
    refereeDiscount: 7.5,
  },
  gold: {
    tier: 'gold',
    minWeeklyVolume: 50_000,
    referrerShare: 30,
    refereeDiscount: 10,
  },
  diamond: {
    tier: 'diamond',
    minWeeklyVolume: 200_000,
    referrerShare: 35,
    refereeDiscount: 10,
  },
};

export interface Referral {
  id: string;
  referrerId: string;
  refereeId: string;
  code: string;
  tier: ReferralTier;
  totalVolume: number;
  totalEarnings: number;
  isActive: boolean;
  createdAt: Date;
}

export interface ReferralStats {
  userId: string;
  code: string;
  currentTier: ReferralTier;
  totalReferrals: number;
  activeReferrals: number;
  weeklyVolume: number;
  totalVolume: number;
  totalEarningsUsd: number;
  pendingEarningsUsd: number;
}

export interface ReferralPayout {
  id: string;
  referralId: string;
  referrerId: string;
  chainId: string;
  txHash: string;
  amount: bigint;
  amountUsd: number;
  paidAt: Date;
}
