// TON adapter exports
export { TonChainAdapter, createTonConfig, createTonTestnetConfig } from './ton/index.js';

// EVM adapter exports
export {
  EvmChainAdapter,
  createEvmAdapter,
  createAllEvmAdapters,
  // Chain configuration
  EVM_CHAIN_IDS,
  EVM_CHAIN_CONFIGS,
  NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS,
  WRAPPED_NATIVE_TOKENS,
  // Chain utilities
  isEvmChain,
  getEvmChainId,
  getEvmChainConfig,
  // Aggregator utilities
  getBestQuote,
  get1inchQuote,
  getParaSwapQuote,
  getSupportedAggregators,
  // Kaia-specific
  KAIA_CONTRACTS,
  KAIA_TOKENS,
  getDragonSwapQuote,
  getKlaySwapQuote,
  getKaiaBestQuote,
  getKaiaPopularPairs,
  // Sonic-specific
  SONIC_CHAIN_ID,
  SONIC_ROUTERS,
  SONIC_FACTORIES,
  SONIC_TOKENS,
  getSwapXQuote,
  getShadowQuote,
  getSonicBestQuote,
  buildSonicSwapTransaction,
  getSonicDexes,
  isSonicChain,
  // Monad-specific
  MONAD_CONTRACTS,
  MONAD_TOKENS,
  getKuruFlowQuote,
  getKuruOrderbookQuote,
  getMonadUniswapQuote,
  getMonadBestQuote,
  buildMonadSwapTransaction,
  getMonadDexes,
  isMonadChain,
  getMonadChainId,
  getMonadPopularPairs,
  // Types
  type EvmChainId,
  type AggregatorQuote,
  type KaiaQuote,
  type MonadQuote,
} from './evm/index.js';

// Sui adapter exports
export {
  SuiChainAdapter,
  createSuiAdapter,
  createSuiConfig,
  createSuiTestnetConfig,
  createSuiDevnetConfig,
  COIN_TYPES as SUI_COIN_TYPES,
} from './sui/index.js';

// SVM/Eclipse adapter exports
export {
  EclipseAdapter,
  createEclipseAdapter,
  createEclipseConfig,
  createEclipseTestnetConfig,
  createEclipseDevnetConfig,
  ECLIPSE_TOKENS,
} from './svm/index.js';