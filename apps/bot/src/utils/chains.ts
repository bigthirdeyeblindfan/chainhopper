import type { ChainId } from '../types.js';

export interface ChainConfig {
  id: ChainId;
  name: string;
  emoji: string;
  nativeToken: string;
  explorerUrl: string;
}

export const CHAIN_CONFIGS: Record<ChainId, ChainConfig> = {
  ton: {
    id: 'ton',
    name: 'TON',
    emoji: '\u{1F48E}',
    nativeToken: 'TON',
    explorerUrl: 'https://tonscan.org',
  },
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    emoji: '\u{1F535}',
    nativeToken: 'ETH',
    explorerUrl: 'https://etherscan.io',
  },
  base: {
    id: 'base',
    name: 'Base',
    emoji: '\u{1F7E6}',
    nativeToken: 'ETH',
    explorerUrl: 'https://basescan.org',
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    emoji: '\u{1F539}',
    nativeToken: 'ETH',
    explorerUrl: 'https://arbiscan.io',
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    emoji: '\u{1F534}',
    nativeToken: 'ETH',
    explorerUrl: 'https://optimistic.etherscan.io',
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    emoji: '\u{1F7E3}',
    nativeToken: 'MATIC',
    explorerUrl: 'https://polygonscan.com',
  },
  avalanche: {
    id: 'avalanche',
    name: 'Avalanche',
    emoji: '\u{1F3D4}',
    nativeToken: 'AVAX',
    explorerUrl: 'https://snowtrace.io',
  },
  bsc: {
    id: 'bsc',
    name: 'BNB Chain',
    emoji: '\u{1F7E1}',
    nativeToken: 'BNB',
    explorerUrl: 'https://bscscan.com',
  },
  sonic: {
    id: 'sonic',
    name: 'Sonic',
    emoji: '\u{1F994}',
    nativeToken: 'S',
    explorerUrl: 'https://sonicscan.org',
  },
  kaia: {
    id: 'kaia',
    name: 'Kaia',
    emoji: '\u{1F535}',
    nativeToken: 'KAIA',
    explorerUrl: 'https://kaiascan.io',
  },
  sui: {
    id: 'sui',
    name: 'Sui',
    emoji: '\u{1F30A}',
    nativeToken: 'SUI',
    explorerUrl: 'https://suiscan.xyz',
  },
  berachain: {
    id: 'berachain',
    name: 'Berachain',
    emoji: '\u{1F43B}',
    nativeToken: 'BERA',
    explorerUrl: 'https://beratrail.io',
  },
  sei: {
    id: 'sei',
    name: 'Sei',
    emoji: '\u{1F3AF}',
    nativeToken: 'SEI',
    explorerUrl: 'https://seistream.app',
  },
  linea: {
    id: 'linea',
    name: 'Linea',
    emoji: '\u{1F7E2}',
    nativeToken: 'ETH',
    explorerUrl: 'https://lineascan.build',
  },
  scroll: {
    id: 'scroll',
    name: 'Scroll',
    emoji: '\u{1F4DC}',
    nativeToken: 'ETH',
    explorerUrl: 'https://scrollscan.com',
  },
};

export const SUPPORTED_CHAINS: ChainId[] = Object.keys(
  CHAIN_CONFIGS
) as ChainId[];

export function getChainConfig(chainId: ChainId): ChainConfig {
  return CHAIN_CONFIGS[chainId];
}

export function getChainName(chainId: ChainId): string {
  return CHAIN_CONFIGS[chainId].name;
}

export function getChainEmoji(chainId: ChainId): string {
  return CHAIN_CONFIGS[chainId].emoji;
}

export function getExplorerUrl(chainId: ChainId, txHash: string): string {
  const config = CHAIN_CONFIGS[chainId];
  return `${config.explorerUrl}/tx/${txHash}`;
}

export function isValidChainId(value: string): value is ChainId {
  return value in CHAIN_CONFIGS;
}
