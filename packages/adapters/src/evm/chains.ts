import type { ChainConfig, ChainId } from '@chainhopper/types';

// EVM Chain IDs (numeric)
export const EVM_CHAIN_IDS = {
  // Original chains
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
  // Phase 7B: Originally Planned (11 chains)
  monad: 143,
  abstract: 2741,
  scroll: 534352,
  soneium: 1868,
  xlayer: 196,
  ink: 57073,
  zerog: 16600,
  astar: 592,
  apechain: 33139,
  ronin: 2020,
  stable: 988,
  // Phase 7C: Tier 1A - High TVL (9 chains)
  linea: 59144,
  zksync: 324,
  blast: 81457,
  mantle: 5000,
  manta: 169,
  mode: 34443,
  hyperliquid: 999,
  gnosis: 100,
  fantom: 250,
  // Phase 7D: Tier 1B - Strategic (9 chains)
  unichain: 130,
  taiko: 167000,
  metis: 1088,
  zora: 7777777,
  fraxtal: 252,
  worldchain: 480,
  celo: 42220,
  cronos: 25,
  bob: 60808,
  // Phase 7E: Tier 1C - Emerging (7 EVM chains, starknet is non-EVM)
  cyber: 7560,
  lisk: 1135,
  mint: 185,
  redstone: 690,
  derive: 957,
  moonbeam: 1284,
  moonriver: 1285,
} as const;

export type EvmChainId = keyof typeof EVM_CHAIN_IDS;

// Native token addresses (used as placeholder for native currency)
export const NATIVE_TOKEN_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';
export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

// Wrapped native token addresses per chain
export const WRAPPED_NATIVE_TOKENS: Record<EvmChainId, string> = {
  // Original chains
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
  // Phase 7B: Originally Planned
  monad: '0x760AfE86e5de5fa0Ee542fc7B7B713e1c5425701', // WMON
  abstract: '0x3439153EB7AF838Ad19d56E1571FBD09333C2809', // WETH
  scroll: '0x5300000000000000000000000000000000000004', // WETH
  soneium: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  xlayer: '0xe538905cf8410324e03A5A23C1c177a474D59b2b', // WOKB
  ink: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  zerog: '0x4200000000000000000000000000000000000006', // WETH (placeholder)
  astar: '0xAeaaf0e2c81Af264101B9129C00F4440cCF0F720', // WASTR
  apechain: '0x48b62137EdfA95a428D35C09E44256a739F6B557', // WAPE
  ronin: '0xe514d9DEB7966c8BE0ca922de8a064264eA6bcd4', // WRON
  stable: '0x0000000000000000000000000000000000000000', // USDT native (TBD)
  // Phase 7C: Tier 1A - High TVL
  linea: '0xe5D7C2a44FfDDf6b295A15c148167daaAf5Cf34f', // WETH
  zksync: '0x5AEa5775959fBC2557Cc8789bC1bf90A239D9a91', // WETH
  blast: '0x4300000000000000000000000000000000000004', // WETH
  mantle: '0x78c1b0C915c4FAA5FffA6CAbf0219DA63d7f4cb8', // WMNT
  manta: '0x0Dc808adcE2099A9F62AA87D9670745AbA741746', // WETH
  mode: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  hyperliquid: '0x5555555555555555555555555555555555555555', // WHYPE (placeholder)
  gnosis: '0xe91D153E0b41518A2Ce8Dd3D7944Fa863463a97d', // WXDAI
  fantom: '0x21be370D5312f44cB42ce377BC9b8a0cEF1A4C83', // WFTM
  // Phase 7D: Tier 1B - Strategic
  unichain: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  taiko: '0xA51894664A773981C6C112C43ce576f315d5b1B6', // WETH
  metis: '0x75cb093E4D61d2A2e65D8e0BBb01DE8d89b53481', // WMETIS
  zora: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  fraxtal: '0xFC00000000000000000000000000000000000006', // wfrxETH
  worldchain: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  celo: '0x471EcE3750Da237f93B8E339c536989b8978a438', // WCELO (native CELO)
  cronos: '0x5C7F8A570d578ED84E63fdFA7b1eE72dEae1AE23', // WCRO
  bob: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  // Phase 7E: Tier 1C - Emerging
  cyber: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  lisk: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  mint: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  redstone: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  derive: '0x4200000000000000000000000000000000000006', // WETH (OP Stack)
  moonbeam: '0xAcc15dC74880C9944775448304B263D191c6077F', // WGLMR
  moonriver: '0x98878B06940aE243284CA214f92Bb71a2b032B8A', // WMOVR
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

  // Phase 7B: Originally Planned (11 chains)
  monad: {
    id: 'monad',
    name: 'Monad',
    type: 'evm',
    nativeCurrency: { name: 'Monad', symbol: 'MON', decimals: 18 },
    rpcUrls: [
      'https://monad-mainnet.g.alchemy.com/v2/demo',
      'https://rpc.monad.xyz',
    ],
    blockExplorerUrls: ['https://explorer.monad.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  abstract: {
    id: 'abstract',
    name: 'Abstract',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://api.mainnet.abs.xyz',
      'https://abstract.drpc.org',
    ],
    blockExplorerUrls: ['https://abscan.org'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  scroll: {
    id: 'scroll',
    name: 'Scroll',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.scroll.io',
      'https://scroll.drpc.org',
      'https://scroll-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://scrollscan.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  soneium: {
    id: 'soneium',
    name: 'Soneium',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.soneium.org',
      'https://soneium.drpc.org',
    ],
    blockExplorerUrls: ['https://soneium.blockscout.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  xlayer: {
    id: 'xlayer',
    name: 'X Layer',
    type: 'evm',
    nativeCurrency: { name: 'OKB', symbol: 'OKB', decimals: 18 },
    rpcUrls: [
      'https://rpc.xlayer.tech',
      'https://xlayer.drpc.org',
    ],
    blockExplorerUrls: ['https://www.okx.com/explorer/xlayer'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  ink: {
    id: 'ink',
    name: 'Ink',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc-gel.inkonchain.com',
      'https://rpc-qnd.inkonchain.com',
    ],
    blockExplorerUrls: ['https://explorer.inkonchain.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  zerog: {
    id: 'zerog',
    name: '0G',
    type: 'evm',
    nativeCurrency: { name: '0G', symbol: 'A0GI', decimals: 18 },
    rpcUrls: [
      'https://evmrpc.0g.ai',
      'https://0g.drpc.org',
    ],
    blockExplorerUrls: ['https://chainscan.0g.ai'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  astar: {
    id: 'astar',
    name: 'Astar',
    type: 'evm',
    nativeCurrency: { name: 'Astar', symbol: 'ASTR', decimals: 18 },
    rpcUrls: [
      'https://evm.astar.network',
      'https://astar.drpc.org',
      'https://astar.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://astar.subscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  apechain: {
    id: 'apechain',
    name: 'ApeChain',
    type: 'evm',
    nativeCurrency: { name: 'ApeCoin', symbol: 'APE', decimals: 18 },
    rpcUrls: [
      'https://rpc.apechain.com/http',
      'https://apechain.drpc.org',
    ],
    blockExplorerUrls: ['https://apescan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  ronin: {
    id: 'ronin',
    name: 'Ronin',
    type: 'evm',
    nativeCurrency: { name: 'Ronin', symbol: 'RON', decimals: 18 },
    rpcUrls: [
      'https://api.roninchain.com/rpc',
      'https://ronin.drpc.org',
    ],
    blockExplorerUrls: ['https://app.roninchain.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  stable: {
    id: 'stable',
    name: 'Stable',
    type: 'evm',
    nativeCurrency: { name: 'USDT', symbol: 'USDT', decimals: 6 },
    rpcUrls: [
      'https://rpc.stable.io',
    ],
    blockExplorerUrls: ['https://explorer.stable.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },

  // Phase 7C: Tier 1A - High TVL (8 chains)
  linea: {
    id: 'linea',
    name: 'Linea',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.linea.build',
      'https://linea.drpc.org',
      'https://linea-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://lineascan.build'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  zksync: {
    id: 'zksync',
    name: 'zkSync Era',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://mainnet.era.zksync.io',
      'https://zksync.drpc.org',
      'https://zksync-era.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://explorer.zksync.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  blast: {
    id: 'blast',
    name: 'Blast',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.blast.io',
      'https://blast.drpc.org',
      'https://blast.blockpi.network/v1/rpc/public',
    ],
    blockExplorerUrls: ['https://blastscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  mantle: {
    id: 'mantle',
    name: 'Mantle',
    type: 'evm',
    nativeCurrency: { name: 'Mantle', symbol: 'MNT', decimals: 18 },
    rpcUrls: [
      'https://rpc.mantle.xyz',
      'https://mantle.drpc.org',
      'https://mantle-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://mantlescan.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  manta: {
    id: 'manta',
    name: 'Manta Pacific',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://pacific-rpc.manta.network/http',
      'https://manta-pacific.drpc.org',
    ],
    blockExplorerUrls: ['https://pacific-explorer.manta.network'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  mode: {
    id: 'mode',
    name: 'Mode',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://mainnet.mode.network',
      'https://mode.drpc.org',
    ],
    blockExplorerUrls: ['https://modescan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  hyperliquid: {
    id: 'hyperliquid',
    name: 'Hyperliquid',
    type: 'evm',
    nativeCurrency: { name: 'HYPE', symbol: 'HYPE', decimals: 18 },
    rpcUrls: [
      'https://rpc.hyperliquid.xyz/evm',
      'https://api.hyperliquid.xyz/evm',
    ],
    blockExplorerUrls: ['https://explorer.hyperliquid.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  gnosis: {
    id: 'gnosis',
    name: 'Gnosis',
    type: 'evm',
    nativeCurrency: { name: 'xDAI', symbol: 'xDAI', decimals: 18 },
    rpcUrls: [
      'https://rpc.gnosischain.com',
      'https://gnosis.drpc.org',
      'https://gnosis-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://gnosisscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  fantom: {
    id: 'fantom',
    name: 'Fantom',
    type: 'evm',
    nativeCurrency: { name: 'Fantom', symbol: 'FTM', decimals: 18 },
    rpcUrls: [
      'https://rpc.ftm.tools',
      'https://fantom.drpc.org',
      'https://fantom-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://ftmscan.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },

  // Phase 7D: Tier 1B - Strategic (9 chains)
  unichain: {
    id: 'unichain',
    name: 'Unichain',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://mainnet.unichain.org',
      'https://unichain.drpc.org',
    ],
    blockExplorerUrls: ['https://uniscan.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  taiko: {
    id: 'taiko',
    name: 'Taiko',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.mainnet.taiko.xyz',
      'https://taiko.drpc.org',
    ],
    blockExplorerUrls: ['https://taikoscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  metis: {
    id: 'metis',
    name: 'Metis',
    type: 'evm',
    nativeCurrency: { name: 'Metis', symbol: 'METIS', decimals: 18 },
    rpcUrls: [
      'https://andromeda.metis.io/?owner=1088',
      'https://metis.drpc.org',
    ],
    blockExplorerUrls: ['https://andromeda-explorer.metis.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  zora: {
    id: 'zora',
    name: 'Zora',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.zora.energy',
      'https://zora.drpc.org',
    ],
    blockExplorerUrls: ['https://explorer.zora.energy'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  fraxtal: {
    id: 'fraxtal',
    name: 'Fraxtal',
    type: 'evm',
    nativeCurrency: { name: 'Frax Ether', symbol: 'frxETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.frax.com',
      'https://fraxtal.drpc.org',
    ],
    blockExplorerUrls: ['https://fraxscan.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  worldchain: {
    id: 'worldchain',
    name: 'World Chain',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://worldchain-mainnet.g.alchemy.com/public',
      'https://worldchain.drpc.org',
    ],
    blockExplorerUrls: ['https://worldscan.org'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  celo: {
    id: 'celo',
    name: 'Celo',
    type: 'evm',
    nativeCurrency: { name: 'Celo', symbol: 'CELO', decimals: 18 },
    rpcUrls: [
      'https://forno.celo.org',
      'https://celo.drpc.org',
      'https://celo-mainnet.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://celoscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  cronos: {
    id: 'cronos',
    name: 'Cronos',
    type: 'evm',
    nativeCurrency: { name: 'Cronos', symbol: 'CRO', decimals: 18 },
    rpcUrls: [
      'https://evm.cronos.org',
      'https://cronos.drpc.org',
      'https://cronos-evm-rpc.publicnode.com',
    ],
    blockExplorerUrls: ['https://cronoscan.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  bob: {
    id: 'bob',
    name: 'BOB',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.gobob.xyz',
      'https://bob.drpc.org',
    ],
    blockExplorerUrls: ['https://explorer.gobob.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },

  // Phase 7E: Tier 1C - Emerging (7 EVM chains)
  cyber: {
    id: 'cyber',
    name: 'Cyber',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://cyber.alt.technology',
      'https://cyber.drpc.org',
    ],
    blockExplorerUrls: ['https://cyberscan.co'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  lisk: {
    id: 'lisk',
    name: 'Lisk',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.api.lisk.com',
      'https://lisk.drpc.org',
    ],
    blockExplorerUrls: ['https://blockscout.lisk.com'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  mint: {
    id: 'mint',
    name: 'Mint',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.mintchain.io',
      'https://mint.drpc.org',
    ],
    blockExplorerUrls: ['https://mintscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  redstone: {
    id: 'redstone',
    name: 'Redstone',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.redstonechain.com',
      'https://redstone.drpc.org',
    ],
    blockExplorerUrls: ['https://explorer.redstone.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  derive: {
    id: 'derive',
    name: 'Derive',
    type: 'evm',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: [
      'https://rpc.derive.xyz',
      'https://derive.drpc.org',
    ],
    blockExplorerUrls: ['https://explorer.derive.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  moonbeam: {
    id: 'moonbeam',
    name: 'Moonbeam',
    type: 'evm',
    nativeCurrency: { name: 'Glimmer', symbol: 'GLMR', decimals: 18 },
    rpcUrls: [
      'https://rpc.api.moonbeam.network',
      'https://moonbeam.drpc.org',
      'https://moonbeam.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://moonscan.io'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  },
  moonriver: {
    id: 'moonriver',
    name: 'Moonriver',
    type: 'evm',
    nativeCurrency: { name: 'Moonriver', symbol: 'MOVR', decimals: 18 },
    rpcUrls: [
      'https://rpc.api.moonriver.moonbeam.network',
      'https://moonriver.drpc.org',
      'https://moonriver.public.blastapi.io',
    ],
    blockExplorerUrls: ['https://moonriver.moonscan.io'],
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
