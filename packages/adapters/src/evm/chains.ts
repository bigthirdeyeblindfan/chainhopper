import type { ChainConfig, ChainId } from '@chainhopper/types';

// EVM Chain IDs (numeric)
export const EVM_CHAIN_IDS = {
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  optimism: 10,
  polygon: 137,
  bsc: 56,
  avalanche: 43114,
  sonic: 146,
  kaia: 8217,
  berachain: 80094,
} as const;

export type EvmChainId = keyof typeof EVM_CHAIN_IDS;

// Native token addresses (used as placeholder for native currency)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Wrapped native token addresses per chain
export const WRAPPED_NATIVE_TOKENS: Record<EvmChainId, string> = {
  ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', // WETH
  base: '0x4200000000000000000000000000000000000006', // WETH
  arbitrum: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', // WETH
  optimism: '0x4200000000000000000000000000000000000006', // WETH
  polygon: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270', // WMATIC
  bsc: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c', // WBNB
  avalanche: '0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7', // WAVAX
  sonic: '0x039e2fB66102314Ce7b64Ce5Ce3E5183bc94aD38', // wS
  kaia: '0x19Aac5f612f524B754CA7e7c41cbFa2E981A4432', // WKLAY
  berachain: '0x7507c1dc16935B82698e4C63f2746A2fCf994dF8', // WBERA
};

// Chain configurations
export const EVM_CHAIN_CONFIGS: Record<EvmChainId, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://eth.llamarpc.com',
      'https://rpc.ankr.com/eth',
      'https://ethereum.publicnode.com',
    ],
    blockExplorerUrls: ['https://etherscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  base: {
    id: 'base',
    name: 'Base',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://base.llamarpc.com',
      'https://base.publicnode.com',
      'https://mainnet.base.org',
    ],
    blockExplorerUrls: ['https://basescan.org'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum One',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://arbitrum.llamarpc.com',
      'https://arb1.arbitrum.io/rpc',
      'https://arbitrum-one.publicnode.com',
    ],
    blockExplorerUrls: ['https://arbiscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://optimism.llamarpc.com',
      'https://mainnet.optimism.io',
      'https://optimism.publicnode.com',
    ],
    blockExplorerUrls: ['https://optimistic.etherscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    type: 'evm',
    nativeCurrency: { name: 'MATIC', symbol: 'MATIC', decimals: 18 },
    rpcUrls: [
      'https://polygon.llamarpc.com',
      'https://polygon-rpc.com',
      'https://polygon-bor.publicnode.com',
    ],
    blockExplorerUrls: ['https://polygonscan.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Smart Chain',
    type: 'evm',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
    rpcUrls: [
      'https://bsc.llamarpc.com',
      'https://bsc-dataseed.binance.org',
      'https://bsc.publicnode.com',
    ],
    blockExplorerUrls: ['https://bscscan.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    type: 'evm',
    nativeCurrency: { name: 'AVAX', symbol: 'AVAX', decimals: 18 },
    rpcUrls: [
      'https://api.avax.network/ext/bc/C/rpc',
      'https://avalanche.publicnode.com',
      'https://rpc.ankr.com/avalanche',
    ],
    blockExplorerUrls: ['https://snowtrace.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  sonic: {
    id: 'sonic',
    name: 'Sonic',
    type: 'evm',
    nativeCurrency: { name: 'Sonic', symbol: 'S', decimals: 18 },
    rpcUrls: [
      'https://rpc.soniclabs.com',
      'https://sonic.drpc.org',
    ],
    blockExplorerUrls: ['https://sonicscan.org'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  kaia: {
    id: 'kaia',
    name: 'Kaia',
    type: 'evm',
    nativeCurrency: { name: 'KAIA', symbol: 'KAIA', decimals: 18 },
    rpcUrls: [
      'https://public-en.node.kaia.io',
      'https://kaia.blockpi.network/v1/rpc/public',
    ],
    blockExplorerUrls: ['https://kaiascan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  berachain: {
    id: 'berachain',
    name: 'Berachain',
    type: 'evm',
    nativeCurrency: { name: 'BERA', symbol: 'BERA', decimals: 18 },
    rpcUrls: [
      'https://rpc.berachain.com',
      'https://berachain-mainnet.g.alchemy.com/v2/demo',
      'https://berachain.drpc.org',
      'https://berachain.publicnode.com',
    ],
    blockExplorerUrls: ['https://berascan.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
};

// Get numeric chain ID from our ChainId
export function getEvmChainId(chainId: ChainId): number | undefined {
  return EVM_CHAIN_IDS[chainId as EvmChainId];
}

// Check if a ChainId is an EVM chain
export function isEvmChain(chainId: ChainId): chainId is EvmChainId {
  return chainId in EVM_CHAIN_IDS;
}

// Get config for a chain
export function getEvmChainConfig(chainId: EvmChainId): ChainConfig {
  return EVM_CHAIN_CONFIGS[chainId];
}
