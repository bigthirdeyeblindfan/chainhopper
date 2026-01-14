/**
 * Contract Integration Service
 * Unified service for interacting with ChainHopper smart contracts
 * Integrates with chain adapters for multi-chain trading
 */

import type {
  ChainId,
  SwapQuote,
  SwapRequest,
  FeeBreakdown,
  UserTier,
  ReferralTier,
} from '@chainhopper/types';
import type { Address } from 'viem';
import { FeeCollectorClient, type FeeCalculationResult } from './fee-collector.js';
import { SwapRouterClient, type SwapParams, DEX_IDS } from './swap-router.js';
import { ReferralRegistryClient, type ReferrerStats } from './referral-registry.js';
import {
  getContractAddresses,
  areContractsDeployed,
  type ContractAddresses,
} from './addresses.js';

export interface ContractServiceConfig {
  chainId: ChainId;
  rpcUrl: string;
  privateKey?: `0x${string}`;
  addresses?: Partial<ContractAddresses>;
}

export interface EnhancedSwapQuote extends SwapQuote {
  contractSwapAvailable: boolean;
  contractTxData?: {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  };
}

export interface UserFeeInfo {
  tier: UserTier;
  profitSharePercent: number;
  hasReferrer: boolean;
  referrerTier?: ReferralTier;
  referralDiscount?: number;
}

export interface TradingStats {
  totalVolume: bigint;
  totalFees: bigint;
  totalTrades: bigint;
  totalReferralsPaid: bigint;
  swapRouterVolume: bigint;
  swapRouterSwaps: bigint;
}

/**
 * Contract Integration Service
 * Provides a unified interface for:
 * - Getting fee quotes with referral discounts
 * - Building swap transactions through SwapRouter
 * - Managing referral relationships
 * - Tracking user and protocol statistics
 */
export class ContractService {
  private chainId: ChainId;
  private rpcUrl: string;

  private feeCollector: FeeCollectorClient;
  private swapRouter: SwapRouterClient;
  private referralRegistry: ReferralRegistryClient;

  private isInitialized = false;

  constructor(config: ContractServiceConfig) {
    this.chainId = config.chainId;
    this.rpcUrl = config.rpcUrl;

    // Initialize contract clients
    this.feeCollector = new FeeCollectorClient({
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      contractAddress: config.addresses?.feeCollector,
    });

    this.swapRouter = new SwapRouterClient({
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      contractAddress: config.addresses?.swapRouter,
    });

    this.referralRegistry = new ReferralRegistryClient({
      chainId: config.chainId,
      rpcUrl: config.rpcUrl,
      contractAddress: config.addresses?.referralRegistry,
    });

    // Connect wallet if provided
    if (config.privateKey) {
      this.feeCollector.connectWallet(config.privateKey, config.rpcUrl);
      this.swapRouter.connectWallet(config.privateKey, config.rpcUrl);
      this.referralRegistry.connectWallet(config.privateKey, config.rpcUrl);
    }
  }

  /**
   * Initialize the service and verify contract connectivity
   */
  async initialize(): Promise<void> {
    if (!areContractsDeployed(this.chainId)) {
      console.warn(`Contracts not deployed on ${this.chainId}, some features will be unavailable`);
    }

    this.isInitialized = true;
  }

  // ============================================================================
  // Fee Calculation
  // ============================================================================

  /**
   * Calculate fees for a trade including referral discounts
   */
  async calculateFee(
    userAddress: Address,
    profit: bigint
  ): Promise<FeeCalculationResult & { effectiveRate: number }> {
    const result = await this.feeCollector.calculateProfitFee(userAddress, profit);

    // Calculate effective rate in percentage
    const effectiveRate = profit > 0n
      ? Number((result.fee * 10000n) / profit) / 100
      : 0;

    return {
      ...result,
      effectiveRate,
    };
  }

  /**
   * Get user's fee tier and rate information
   */
  async getUserFeeInfo(userAddress: Address): Promise<UserFeeInfo> {
    const [tierInfo, referralDetails] = await Promise.all([
      this.feeCollector.getUserTierInfo(userAddress),
      this.referralRegistry.getReferralDetails(userAddress),
    ]);

    const hasReferrer = referralDetails.referrer !== '0x0000000000000000000000000000000000000000';

    return {
      tier: tierInfo.tier,
      profitSharePercent: Number(tierInfo.profitShareBps) / 100,
      hasReferrer,
      referrerTier: hasReferrer ? referralDetails.referrerTier : undefined,
      referralDiscount: hasReferrer ? this.getReferralDiscount(referralDetails.referrerTier) : undefined,
    };
  }

  /**
   * Get referral discount percentage based on tier
   */
  private getReferralDiscount(tier: ReferralTier): number {
    const discounts: Record<ReferralTier, number> = {
      bronze: 5,
      silver: 7.5,
      gold: 10,
      diamond: 10,
    };
    return discounts[tier];
  }

  // ============================================================================
  // Swap Integration
  // ============================================================================

  /**
   * Enhance a swap quote with contract execution data
   */
  async enhanceQuote(quote: SwapQuote, userAddress: Address): Promise<EnhancedSwapQuote> {
    // Check if contracts are deployed
    if (!areContractsDeployed(this.chainId)) {
      return {
        ...quote,
        contractSwapAvailable: false,
      };
    }

    try {
      // Get best on-chain quote
      const onChainQuote = await this.swapRouter.getBestQuote(
        quote.tokenIn.address as Address,
        quote.tokenOut.address as Address,
        quote.amountIn
      );

      // If on-chain quote is available and competitive
      if (onChainQuote.bestAmountOut > 0n) {
        const deadline = this.swapRouter.calculateDeadline(300); // 5 minutes

        const params: SwapParams = {
          dexId: onChainQuote.bestDexId,
          tokenIn: quote.tokenIn.address as Address,
          tokenOut: quote.tokenOut.address as Address,
          amountIn: quote.amountIn,
          amountOutMin: quote.amountOutMin,
          deadline,
        };

        const txData = this.swapRouter.buildSwapTransaction(params);

        return {
          ...quote,
          contractSwapAvailable: true,
          contractTxData: txData,
        };
      }
    } catch (error) {
      console.warn('Failed to get contract quote:', error);
    }

    return {
      ...quote,
      contractSwapAvailable: false,
    };
  }

  /**
   * Build a contract swap transaction
   */
  buildContractSwap(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    amountOutMin: bigint,
    dexId?: `0x${string}`
  ): { to: Address; data: `0x${string}`; value: bigint } {
    const deadline = this.swapRouter.calculateDeadline(300);

    return this.swapRouter.buildSwapTransaction({
      dexId: dexId || DEX_IDS['uniswap-v2'],
      tokenIn,
      tokenOut,
      amountIn,
      amountOutMin,
      deadline,
    });
  }

  /**
   * Execute a swap through the contract
   */
  async executeContractSwap(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    slippageBps: number
  ): Promise<string> {
    return await this.swapRouter.swapBestRoute(
      tokenIn,
      tokenOut,
      amountIn,
      slippageBps,
      300 // 5 minutes deadline
    );
  }

  // ============================================================================
  // Referral Management
  // ============================================================================

  /**
   * Register a new referral code for the connected wallet
   */
  async registerReferralCode(codeString: string): Promise<string> {
    if (!this.referralRegistry.isValidCodeString(codeString)) {
      throw new Error('Invalid referral code format');
    }

    const code = this.referralRegistry.stringToCode(codeString);

    // Check availability
    const isAvailable = await this.referralRegistry.isCodeAvailable(code);
    if (!isAvailable) {
      throw new Error('Referral code already taken');
    }

    return await this.referralRegistry.registerCode(code);
  }

  /**
   * Use a referral code (set referrer)
   */
  async useReferralCode(codeString: string): Promise<string> {
    return await this.referralRegistry.useCodeFromString(codeString);
  }

  /**
   * Get referrer stats for an address
   */
  async getReferrerStats(referrer: Address): Promise<ReferrerStats> {
    return await this.referralRegistry.getReferrerStats(referrer);
  }

  /**
   * Check if a referral code is available
   */
  async isReferralCodeAvailable(codeString: string): Promise<boolean> {
    const code = this.referralRegistry.stringToCode(codeString);
    return await this.referralRegistry.isCodeAvailable(code);
  }

  /**
   * Get referral code for an address
   */
  async getReferralCode(owner: Address): Promise<string | null> {
    const code = await this.referralRegistry.getCode(owner);
    if (code === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return null;
    }
    return this.referralRegistry.codeToString(code);
  }

  // ============================================================================
  // Statistics
  // ============================================================================

  /**
   * Get comprehensive trading statistics
   */
  async getTradingStats(): Promise<TradingStats> {
    const [feeStats, routerVolume, routerSwaps] = await Promise.all([
      this.feeCollector.getProtocolStats(),
      this.swapRouter.getTotalVolumeRouted(),
      this.swapRouter.getTotalSwapsExecuted(),
    ]);

    return {
      totalVolume: feeStats.totalVolume,
      totalFees: feeStats.totalFeesCollected,
      totalTrades: feeStats.totalTrades,
      totalReferralsPaid: feeStats.totalReferralsPaid,
      swapRouterVolume: routerVolume,
      swapRouterSwaps: routerSwaps,
    };
  }

  /**
   * Get user's complete stats
   */
  async getUserStats(userAddress: Address): Promise<{
    feeStats: Awaited<ReturnType<FeeCollectorClient['getUserStats']>>;
    referralStats: ReferrerStats | null;
    referralCode: string | null;
  }> {
    const [feeStats, referralCode] = await Promise.all([
      this.feeCollector.getUserStats(userAddress),
      this.getReferralCode(userAddress),
    ]);

    let referralStats: ReferrerStats | null = null;
    if (referralCode) {
      referralStats = await this.getReferrerStats(userAddress);
    }

    return {
      feeStats,
      referralStats,
      referralCode,
    };
  }

  // ============================================================================
  // Client Access
  // ============================================================================

  /**
   * Get the FeeCollector client for direct access
   */
  getFeeCollector(): FeeCollectorClient {
    return this.feeCollector;
  }

  /**
   * Get the SwapRouter client for direct access
   */
  getSwapRouter(): SwapRouterClient {
    return this.swapRouter;
  }

  /**
   * Get the ReferralRegistry client for direct access
   */
  getReferralRegistry(): ReferralRegistryClient {
    return this.referralRegistry;
  }

  /**
   * Get contract addresses
   */
  getAddresses(): ContractAddresses | undefined {
    return getContractAddresses(this.chainId);
  }

  /**
   * Check if contracts are deployed on this chain
   */
  isContractsDeployed(): boolean {
    return areContractsDeployed(this.chainId);
  }

  /**
   * Get the chain ID
   */
  getChainId(): ChainId {
    return this.chainId;
  }
}

/**
 * Create contract service for a chain
 */
export function createContractService(config: ContractServiceConfig): ContractService {
  return new ContractService(config);
}

/**
 * Create contract services for multiple chains
 */
export function createContractServices(
  configs: ContractServiceConfig[]
): Map<ChainId, ContractService> {
  const services = new Map<ChainId, ContractService>();

  for (const config of configs) {
    services.set(config.chainId, new ContractService(config));
  }

  return services;
}
