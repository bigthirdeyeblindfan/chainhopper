/**
 * Supported blockchain networks
 */
export type ChainId =
  | 'ton'
  | 'ethereum'
  | 'base'
  | 'arbitrum'
  | 'optimism'
  | 'polygon'
  | 'bsc'
  | 'avalanche'
  | 'sonic'
  | 'kaia'
  | 'berachain'
  | 'sui'
  | 'eclipse'
  | 'hyperliquid'
  | 'cosmos';

export type ChainType = 'evm' | 'ton' | 'sui' | 'cosmos' | 'svm';

export interface ChainConfig {
  id: ChainId;
  name: string;
  type: ChainType;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: string[];
  blockExplorerUrls: string[];
  contracts: {
    feeCollector?: string;
    swapRouter?: string;
    referralRegistry?: string;
  };
  isTestnet: boolean;
  isEnabled: boolean;
}

export interface ChainStatus {
  chainId: ChainId;
  isHealthy: boolean;
  blockNumber: bigint;
  latency: number; // ms
  lastUpdated: Date;
}
