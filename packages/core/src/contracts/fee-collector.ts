/**
 * FeeCollector Contract Client
 * TypeScript bindings for the FeeCollector smart contract
 */

import type { ChainId, UserTier } from '@chainhopper/types';
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  encodeFunctionData,
} from 'viem';
import { FeeCollectorABI } from './abis.js';
import { getContractAddresses } from './addresses.js';

// Tier enum mapping (matches Solidity contract)
const TierMap: Record<number, UserTier> = {
  0: 'free',
  1: 'holder',
  2: 'staker',
  3: 'enterprise',
};

export interface UserAccount {
  referrer: Address;
  tier: UserTier;
  weeklyVolume: bigint;
  totalVolume: bigint;
  totalProfitsPaid: bigint;
  totalFeesPaid: bigint;
}

export interface FeeCalculationResult {
  fee: bigint;
  netProfit: bigint;
  referralReward: bigint;
}

export interface TierInfo {
  tier: UserTier;
  profitShareBps: bigint;
}

export interface ProtocolStats {
  totalVolume: bigint;
  totalFeesCollected: bigint;
  totalReferralsPaid: bigint;
  totalTrades: bigint;
}

export interface FeeCollectorConfig {
  chainId: ChainId;
  rpcUrl: string;
  contractAddress?: Address;
}

/**
 * FeeCollector Contract Client
 * Provides read/write methods for interacting with the FeeCollector contract
 */
export class FeeCollectorClient {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private contractAddress: Address;
  private chainId: ChainId;

  constructor(config: FeeCollectorConfig) {
    this.chainId = config.chainId;

    // Get contract address from config or deployed addresses
    const addresses = getContractAddresses(config.chainId);
    this.contractAddress = config.contractAddress || addresses?.feeCollector || '0x0';

    // Create public client for read operations
    this.publicClient = createPublicClient({
      transport: http(config.rpcUrl),
    });
  }

  /**
   * Connect a wallet for write operations
   */
  connectWallet(privateKey: `0x${string}`, rpcUrl: string): void {
    const { privateKeyToAccount } = require('viem/accounts');
    const account = privateKeyToAccount(privateKey);

    this.walletClient = createWalletClient({
      account,
      transport: http(rpcUrl),
    });
  }

  // ============================================================================
  // Read Methods
  // ============================================================================

  /**
   * Calculate the profit share fee for a given user and profit amount
   */
  async calculateProfitFee(
    userAddress: Address,
    profit: bigint
  ): Promise<FeeCalculationResult> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: FeeCollectorABI,
      functionName: 'calculateProfitFee',
      args: [userAddress, profit],
    });

    return {
      fee: result[0] as bigint,
      netProfit: result[1] as bigint,
      referralReward: result[2] as bigint,
    };
  }

  /**
   * Get user's tier and profit share rate
   */
  async getUserTierInfo(userAddress: Address): Promise<TierInfo> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: FeeCollectorABI,
      functionName: 'getUserTierInfo',
      args: [userAddress],
    });

    return {
      tier: TierMap[Number(result[0])] || 'free',
      profitShareBps: result[1] as bigint,
    };
  }

  /**
   * Get comprehensive user stats
   */
  async getUserStats(userAddress: Address): Promise<{
    account: UserAccount;
    currentReferralTier: number;
  }> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: FeeCollectorABI,
      functionName: 'getUserStats',
      args: [userAddress],
    });

    const accountTuple = result[0] as readonly [Address, number, bigint, bigint, bigint, bigint];

    return {
      account: {
        referrer: accountTuple[0],
        tier: TierMap[accountTuple[1]] || 'free',
        weeklyVolume: accountTuple[2],
        totalVolume: accountTuple[3],
        totalProfitsPaid: accountTuple[4],
        totalFeesPaid: accountTuple[5],
      },
      currentReferralTier: Number(result[1]),
    };
  }

  /**
   * Get protocol-wide statistics
   */
  async getProtocolStats(): Promise<ProtocolStats> {
    const [totalVolume, totalFeesCollected, totalReferralsPaid, totalTrades] =
      await Promise.all([
        this.publicClient.readContract({
          address: this.contractAddress,
          abi: FeeCollectorABI,
          functionName: 'totalVolume',
        }),
        this.publicClient.readContract({
          address: this.contractAddress,
          abi: FeeCollectorABI,
          functionName: 'totalFeesCollected',
        }),
        this.publicClient.readContract({
          address: this.contractAddress,
          abi: FeeCollectorABI,
          functionName: 'totalReferralsPaid',
        }),
        this.publicClient.readContract({
          address: this.contractAddress,
          abi: FeeCollectorABI,
          functionName: 'totalTrades',
        }),
      ]);

    return {
      totalVolume: totalVolume as bigint,
      totalFeesCollected: totalFeesCollected as bigint,
      totalReferralsPaid: totalReferralsPaid as bigint,
      totalTrades: totalTrades as bigint,
    };
  }

  /**
   * Get treasury address
   */
  async getTreasury(): Promise<Address> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: FeeCollectorABI,
      functionName: 'treasury',
    });
    return result as Address;
  }

  // ============================================================================
  // Write Methods (require wallet connection)
  // ============================================================================

  /**
   * Register a referrer for the user
   */
  async registerReferrer(referrerAddress: Address): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    return await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: FeeCollectorABI,
      functionName: 'registerReferrer',
      args: [referrerAddress],
    });
  }

  /**
   * Claim referral earnings for a token
   */
  async claimReferralEarnings(tokenAddress: Address): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    return await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: FeeCollectorABI,
      functionName: 'claimReferralEarnings',
      args: [tokenAddress],
    });
  }

  /**
   * Build unsigned transaction data for collecting profit fee
   * (Used by adapters when routing through contracts)
   */
  buildCollectFeeTransaction(
    userAddress: Address,
    tokenAddress: Address,
    profit: bigint
  ): { to: Address; data: `0x${string}`; value: bigint } {
    const data = encodeFunctionData({
      abi: FeeCollectorABI,
      functionName: 'collectProfitFee',
      args: [userAddress, tokenAddress, profit],
    });

    return {
      to: this.contractAddress,
      data,
      value: tokenAddress === '0x0000000000000000000000000000000000000000' ? profit : 0n,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get the contract address
   */
  getAddress(): Address {
    return this.contractAddress;
  }

  /**
   * Get the chain ID
   */
  getChainId(): ChainId {
    return this.chainId;
  }
}
