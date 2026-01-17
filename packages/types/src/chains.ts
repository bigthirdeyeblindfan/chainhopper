/**
 * Supported blockchain networks
 */
export type ChainId =
  // Original chains
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
  | 'cosmos'
  // Phase 7B: Originally Planned (11 chains)
  | 'monad'        // Chain ID: 143
  | 'abstract'     // Chain ID: 2741
  | 'scroll'       // Chain ID: 534352
  | 'soneium'      // Chain ID: 1868
  | 'xlayer'       // Chain ID: 196
  | 'ink'          // Chain ID: 57073
  | 'zerog'        // Chain ID: TBD
  | 'astar'        // Chain ID: 592
  | 'apechain'     // Chain ID: 33139
  | 'ronin'        // Chain ID: 2020
  | 'stable'       // Chain ID: 988
  // Phase 7C: Tier 1A - High TVL (9 chains, hyperliquid already exists)
  | 'linea'        // Chain ID: 59144
  | 'zksync'       // Chain ID: 324
  | 'blast'        // Chain ID: 238
  | 'mantle'       // Chain ID: 5000
  | 'manta'        // Chain ID: 169
  | 'mode'         // Chain ID: 34443
  | 'gnosis'       // Chain ID: 100
  | 'fantom'       // Chain ID: 250
  // Phase 7D: Tier 1B - Strategic (9 chains)
  | 'unichain'     // Chain ID: 130
  | 'taiko'        // Chain ID: 167000
  | 'metis'        // Chain ID: 1088
  | 'zora'         // Chain ID: 7777777
  | 'fraxtal'      // Chain ID: 252
  | 'worldchain'   // Chain ID: 480
  | 'celo'         // Chain ID: 42220
  | 'cronos'       // Chain ID: 25
  | 'bob'          // Chain ID: 60808
  // Phase 7E: Tier 1C - Emerging (8 chains)
  | 'cyber'        // Chain ID: 7560
  | 'lisk'         // Chain ID: 1135
  | 'mint'         // Chain ID: 185
  | 'redstone'     // Chain ID: 690
  | 'derive'       // Chain ID: 957
  | 'moonbeam'     // Chain ID: 1284
  | 'moonriver'    // Chain ID: 1285
  | 'starknet'     // Non-EVM (Cairo)
  // Solana Virtual Machine
  | 'solana';      // Solana Mainnet

export type ChainType = 'evm' | 'ton' | 'sui' | 'cosmos' | 'svm' | 'starknet';

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
