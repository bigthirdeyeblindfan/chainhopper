/**
 * ReferralRegistry Contract Client
 * TypeScript bindings for the ReferralRegistry smart contract
 */

import type { ChainId, ReferralTier } from '@chainhopper/types';
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  encodeFunctionData,
  encodeAbiParameters,
  parseAbiParameters,
  keccak256,
  toHex,
  stringToHex,
} from 'viem';
import { ReferralRegistryABI } from './abis.js';
import { getContractAddresses } from './addresses.js';

// Tier mapping (matches Solidity enum)
const TierMap: Record<number, ReferralTier> = {
  0: 'bronze',
  1: 'silver',
  2: 'gold',
  3: 'diamond',
};

export interface ReferrerStats {
  totalReferrals: bigint;
  activeReferrals: bigint;
  totalVolume: bigint;
  weeklyVolume: bigint;
  totalEarnings: bigint;
  pendingEarnings: bigint;
  tier: ReferralTier;
}

export interface ReferralDetails {
  referrer: Address;
  code: `0x${string}`;
  referrerTier: ReferralTier;
}

export interface ProtocolReferralStats {
  totalCodes: bigint;
  totalReferrals: bigint;
  totalVolume: bigint;
  totalEarnings: bigint;
}

export interface ReferralRegistryConfig {
  chainId: ChainId;
  rpcUrl: string;
  contractAddress?: Address;
}

/**
 * ReferralRegistry Contract Client
 * Manages referral codes, relationships, and rewards tracking
 */
export class ReferralRegistryClient {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private contractAddress: Address;
  private chainId: ChainId;

  constructor(config: ReferralRegistryConfig) {
    this.chainId = config.chainId;

    const addresses = getContractAddresses(config.chainId);
    this.contractAddress = config.contractAddress || addresses?.referralRegistry || '0x0';

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
   * Get the owner of a referral code
   */
  async getCodeOwner(code: `0x${string}`): Promise<Address> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'getCodeOwner',
      args: [code],
    });
    return result as Address;
  }

  /**
   * Get the referral code for an address
   */
  async getCode(owner: Address): Promise<`0x${string}`> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'getCode',
      args: [owner],
    });
    return result as `0x${string}`;
  }

  /**
   * Get the referrer for a user
   */
  async getReferrer(user: Address): Promise<Address> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'getReferrer',
      args: [user],
    });
    return result as Address;
  }

  /**
   * Check if a referral code is available
   */
  async isCodeAvailable(code: `0x${string}`): Promise<boolean> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'isCodeAvailable',
      args: [code],
    });
    return result as boolean;
  }

  /**
   * Get referrer statistics
   */
  async getReferrerStats(referrer: Address): Promise<ReferrerStats> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'getReferrerStats',
      args: [referrer],
    });

    const stats = result as {
      totalReferrals: bigint;
      activeReferrals: bigint;
      totalVolume: bigint;
      weeklyVolume: bigint;
      totalEarnings: bigint;
      pendingEarnings: bigint;
      tier: number;
    };

    return {
      totalReferrals: stats.totalReferrals,
      activeReferrals: stats.activeReferrals,
      totalVolume: stats.totalVolume,
      weeklyVolume: stats.weeklyVolume,
      totalEarnings: stats.totalEarnings,
      pendingEarnings: stats.pendingEarnings,
      tier: TierMap[stats.tier] || 'bronze',
    };
  }

  /**
   * Get full referral details for a user
   */
  async getReferralDetails(user: Address): Promise<ReferralDetails> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'getReferralDetails',
      args: [user],
    });

    const [referrer, code, tierNum] = result as [Address, `0x${string}`, number];

    return {
      referrer,
      code,
      referrerTier: TierMap[tierNum] || 'bronze',
    };
  }

  /**
   * Get protocol-wide referral statistics
   */
  async getProtocolStats(): Promise<ProtocolReferralStats> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'getProtocolStats',
    });

    const [codes, referrals, volume, earnings] = result as [bigint, bigint, bigint, bigint];

    return {
      totalCodes: codes,
      totalReferrals: referrals,
      totalVolume: volume,
      totalEarnings: earnings,
    };
  }

  // ============================================================================
  // Write Methods (require wallet connection)
  // ============================================================================

  /**
   * Register a new referral code
   */
  async registerCode(code: `0x${string}`): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    return await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'registerCode',
      args: [code],
    });
  }

  /**
   * Register a new referral code from a string
   */
  async registerCodeFromString(codeString: string): Promise<Hash> {
    const code = this.stringToCode(codeString);
    return await this.registerCode(code);
  }

  /**
   * Use a referral code (become a referee)
   */
  async useCode(code: `0x${string}`): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    return await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: ReferralRegistryABI,
      functionName: 'useCode',
      args: [code],
    });
  }

  /**
   * Use a referral code from a string
   */
  async useCodeFromString(codeString: string): Promise<Hash> {
    const code = this.stringToCode(codeString);
    return await this.useCode(code);
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Convert a string to a bytes32 referral code
   */
  stringToCode(codeString: string): `0x${string}` {
    // Pad or truncate to 32 bytes
    const hex = stringToHex(codeString, { size: 32 });
    return hex;
  }

  /**
   * Convert a bytes32 code to a readable string
   */
  codeToString(code: `0x${string}`): string {
    // Remove trailing zeros and convert to string
    let hex = code.slice(2); // Remove 0x prefix
    // Remove trailing zeros
    while (hex.endsWith('00') && hex.length > 0) {
      hex = hex.slice(0, -2);
    }
    // Convert hex to string
    let str = '';
    for (let i = 0; i < hex.length; i += 2) {
      const charCode = parseInt(hex.slice(i, i + 2), 16);
      if (charCode > 0) {
        str += String.fromCharCode(charCode);
      }
    }
    return str;
  }

  /**
   * Generate a unique referral code
   */
  generateCode(prefix = 'HOPPER'): `0x${string}` {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    return this.stringToCode(`${prefix}_${randomPart}`);
  }

  /**
   * Check if code string is valid (3-32 characters, alphanumeric + underscore)
   */
  isValidCodeString(codeString: string): boolean {
    if (codeString.length < 3 || codeString.length > 32) {
      return false;
    }
    return /^[A-Za-z0-9_]+$/.test(codeString);
  }

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
