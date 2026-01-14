// @ts-nocheck
/**
 * SwapRouter Contract Client
 * TypeScript bindings for the SwapRouter smart contract
 */

import type { ChainId } from '@chainhopper/types';
import {
  createPublicClient,
  createWalletClient,
  http,
  type PublicClient,
  type WalletClient,
  type Address,
  type Hash,
  encodeFunctionData,
  keccak256,
  toHex,
} from 'viem';
import { SwapRouterABI } from './abis.js';
import { getContractAddresses } from './addresses.js';

// Common DEX identifiers
export const DEX_IDS = {
  'uniswap-v2': keccak256(toHex('uniswap-v2')),
  'uniswap-v3': keccak256(toHex('uniswap-v3')),
  sushiswap: keccak256(toHex('sushiswap')),
  pancakeswap: keccak256(toHex('pancakeswap')),
  quickswap: keccak256(toHex('quickswap')),
  traderjoe: keccak256(toHex('traderjoe')),
  camelot: keccak256(toHex('camelot')),
  velodrome: keccak256(toHex('velodrome')),
  aerodrome: keccak256(toHex('aerodrome')),
} as const;

export type DexName = keyof typeof DEX_IDS;

export interface DexInfo {
  router: Address;
  weth: Address;
  enabled: boolean;
  volume: bigint;
}

export interface SwapParams {
  dexId: `0x${string}`;
  tokenIn: Address;
  tokenOut: Address;
  amountIn: bigint;
  amountOutMin: bigint;
  deadline: bigint;
}

export interface BestQuoteResult {
  bestDexId: `0x${string}`;
  bestAmountOut: bigint;
}

export interface SwapRouterConfig {
  chainId: ChainId;
  rpcUrl: string;
  contractAddress?: Address;
}

/**
 * SwapRouter Contract Client
 * Routes swaps through various DEXs with automatic fee collection
 */
export class SwapRouterClient {
  private publicClient: PublicClient;
  private walletClient?: WalletClient;
  private contractAddress: Address;
  private chainId: ChainId;

  constructor(config: SwapRouterConfig) {
    this.chainId = config.chainId;

    const addresses = getContractAddresses(config.chainId);
    this.contractAddress = config.contractAddress || addresses?.swapRouter || '0x0';

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
   * Get the FeeCollector address
   */
  async getFeeCollector(): Promise<Address> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'feeCollector',
    });
    return result as Address;
  }

  /**
   * Get all registered DEX IDs
   */
  async getRegisteredDexes(): Promise<`0x${string}`[]> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'getRegisteredDexes',
    });
    return result as `0x${string}`[];
  }

  /**
   * Get info for a specific DEX
   */
  async getDexInfo(dexId: `0x${string}`): Promise<DexInfo> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'getDexInfo',
      args: [dexId],
    });

    return {
      router: result[0] as Address,
      weth: result[1] as Address,
      enabled: result[2] as boolean,
      volume: result[3] as bigint,
    };
  }

  /**
   * Check if a DEX is enabled
   */
  async isDexEnabled(dexId: `0x${string}`): Promise<boolean> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'dexEnabled',
      args: [dexId],
    });
    return result as boolean;
  }

  /**
   * Get a quote from a specific DEX
   */
  async getQuote(
    dexId: `0x${string}`,
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'getQuote',
      args: [dexId, tokenIn, tokenOut, amountIn],
    });
    return result as bigint;
  }

  /**
   * Get the best quote across all enabled DEXs
   */
  async getBestQuote(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint
  ): Promise<BestQuoteResult> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'getBestQuote',
      args: [tokenIn, tokenOut, amountIn],
    });

    return {
      bestDexId: result[0] as `0x${string}`,
      bestAmountOut: result[1] as bigint,
    };
  }

  /**
   * Get total volume routed through the contract
   */
  async getTotalVolumeRouted(): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'totalVolumeRouted',
    });
    return result as bigint;
  }

  /**
   * Get total number of swaps executed
   */
  async getTotalSwapsExecuted(): Promise<bigint> {
    const result = await this.publicClient.readContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'totalSwapsExecuted',
    });
    return result as bigint;
  }

  // ============================================================================
  // Write Methods (require wallet connection)
  // ============================================================================

  /**
   * Execute a swap through a specified DEX
   */
  async swap(params: SwapParams, value?: bigint): Promise<Hash> {
    if (!this.walletClient) {
      throw new Error('Wallet not connected. Call connectWallet() first.');
    }

    return await this.walletClient.writeContract({
      address: this.contractAddress,
      abi: SwapRouterABI,
      functionName: 'swap',
      args: [
        params.dexId,
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.amountOutMin,
        params.deadline,
      ],
      value: value || 0n,
    });
  }

  /**
   * Execute a swap using the best available DEX
   */
  async swapBestRoute(
    tokenIn: Address,
    tokenOut: Address,
    amountIn: bigint,
    slippageBps: number,
    deadlineSeconds: number
  ): Promise<Hash> {
    // Get best quote
    const { bestDexId, bestAmountOut } = await this.getBestQuote(tokenIn, tokenOut, amountIn);

    if (bestAmountOut === 0n) {
      throw new Error('No liquidity available for this swap');
    }

    // Calculate minimum output with slippage
    const amountOutMin = (bestAmountOut * BigInt(10000 - slippageBps)) / 10000n;
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineSeconds);

    // Check if native token swap
    const isNativeIn = tokenIn === '0x0000000000000000000000000000000000000000';

    return await this.swap(
      {
        dexId: bestDexId,
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMin,
        deadline,
      },
      isNativeIn ? amountIn : undefined
    );
  }

  /**
   * Build unsigned transaction data for a swap
   */
  buildSwapTransaction(params: SwapParams): {
    to: Address;
    data: `0x${string}`;
    value: bigint;
  } {
    const data = encodeFunctionData({
      abi: SwapRouterABI,
      functionName: 'swap',
      args: [
        params.dexId,
        params.tokenIn,
        params.tokenOut,
        params.amountIn,
        params.amountOutMin,
        params.deadline,
      ],
    });

    const isNativeIn = params.tokenIn === '0x0000000000000000000000000000000000000000';

    return {
      to: this.contractAddress,
      data,
      value: isNativeIn ? params.amountIn : 0n,
    };
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get DEX ID by name
   */
  getDexId(name: DexName): `0x${string}` {
    return DEX_IDS[name];
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

  /**
   * Calculate deadline timestamp
   */
  calculateDeadline(secondsFromNow: number): bigint {
    return BigInt(Math.floor(Date.now() / 1000) + secondsFromNow);
  }
}
