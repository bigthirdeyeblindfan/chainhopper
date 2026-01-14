/**
 * Contract Integration Module
 *
 * Provides TypeScript bindings for ChainHopper smart contracts:
 * - FeeCollector: Profit-share fee collection
 * - SwapRouter: Multi-DEX swap routing
 * - ReferralRegistry: Referral code management
 */

// ABIs
export { FeeCollectorABI, SwapRouterABI, ReferralRegistryABI } from './abis.js';

// Addresses
export {
  CONTRACT_ADDRESSES,
  TESTNET_ADDRESSES,
  SUPPORTED_CONTRACT_CHAINS,
  getContractAddresses,
  areContractsDeployed,
  type ContractAddresses,
} from './addresses.js';

// FeeCollector client
export {
  FeeCollectorClient,
  type FeeCollectorConfig,
  type UserAccount,
  type FeeCalculationResult,
  type TierInfo,
  type ProtocolStats,
} from './fee-collector.js';

// SwapRouter client
export {
  SwapRouterClient,
  DEX_IDS,
  type SwapRouterConfig,
  type DexInfo,
  type SwapParams,
  type BestQuoteResult,
  type DexName,
} from './swap-router.js';

// ReferralRegistry client
export {
  ReferralRegistryClient,
  type ReferralRegistryConfig,
  type ReferrerStats,
  type ReferralDetails,
  type ProtocolReferralStats,
} from './referral-registry.js';

// Unified service
export {
  ContractService,
  createContractService,
  createContractServices,
  type ContractServiceConfig,
  type EnhancedSwapQuote,
  type UserFeeInfo,
  type TradingStats,
} from './service.js';
