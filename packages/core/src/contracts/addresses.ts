/**
 * Contract addresses per chain
 * Update these after deployment using deploy scripts
 */

import type { ChainId } from '@chainhopper/types';

export interface ContractAddresses {
  feeCollector: `0x${string}`;
  swapRouter: `0x${string}`;
  referralRegistry: `0x${string}`;
}

/**
 * Deployed contract addresses by chain ID
 * These are populated after running deployment scripts
 */
export const CONTRACT_ADDRESSES: Partial<Record<ChainId, ContractAddresses>> = {
  // Ethereum Mainnet
  ethereum: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Arbitrum
  arbitrum: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Base
  base: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Optimism
  optimism: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Polygon
  polygon: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // BSC
  bsc: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Avalanche
  avalanche: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Sonic (formerly Fantom)
  sonic: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Kaia (formerly Klaytn)
  kaia: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Berachain
  berachain: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },
};

/**
 * Testnet contract addresses
 */
export const TESTNET_ADDRESSES: Partial<Record<string, ContractAddresses>> = {
  // Sepolia (Ethereum testnet)
  sepolia: {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Arbitrum Sepolia
  'arbitrum-sepolia': {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },

  // Base Sepolia
  'base-sepolia': {
    feeCollector: '0x0000000000000000000000000000000000000000',
    swapRouter: '0x0000000000000000000000000000000000000000',
    referralRegistry: '0x0000000000000000000000000000000000000000',
  },
};

/**
 * Get contract addresses for a chain
 * @param chainId - The chain ID
 * @param isTestnet - Whether to use testnet addresses
 * @returns Contract addresses or undefined if not deployed
 */
export function getContractAddresses(
  chainId: ChainId,
  isTestnet = false
): ContractAddresses | undefined {
  if (isTestnet) {
    return TESTNET_ADDRESSES[chainId as string];
  }
  return CONTRACT_ADDRESSES[chainId];
}

/**
 * Check if contracts are deployed on a chain
 */
export function areContractsDeployed(chainId: ChainId, isTestnet = false): boolean {
  const addresses = getContractAddresses(chainId, isTestnet);
  if (!addresses) return false;

  const zeroAddress = '0x0000000000000000000000000000000000000000';
  return (
    addresses.feeCollector !== zeroAddress &&
    addresses.swapRouter !== zeroAddress &&
    addresses.referralRegistry !== zeroAddress
  );
}

/**
 * Supported chain IDs for contract interactions
 * Chains where contracts are deployed
 */
export const SUPPORTED_CONTRACT_CHAINS: ChainId[] = [
  'ethereum',
  'arbitrum',
  'base',
  'optimism',
  'polygon',
  'bsc',
  'avalanche',
  'sonic',
  'kaia',
  'berachain',
];
