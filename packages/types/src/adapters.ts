import type { ChainId, ChainConfig, ChainStatus } from './chains.js';
import type { Token, TokenBalance, TokenPrice } from './tokens.js';
import type { SwapQuote, SwapRequest, SwapTransaction } from './trading.js';

/**
 * Base interface for all chain adapters
 * Each chain (TON, EVM, Sui, etc.) implements this interface
 */
export interface ChainAdapter {
  readonly chainId: ChainId;
  readonly config: ChainConfig;

  // Lifecycle
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
  healthCheck(): Promise<ChainStatus>;

  // Tokens
  getToken(address: string): Promise<Token | null>;
  getTokenBalance(walletAddress: string, tokenAddress: string): Promise<TokenBalance>;
  getTokenBalances(walletAddress: string): Promise<TokenBalance[]>;
  getTokenPrice(tokenAddress: string): Promise<TokenPrice>;

  // Trading
  getQuote(request: SwapRequest): Promise<SwapQuote>;
  buildSwapTransaction(quote: SwapQuote): Promise<UnsignedTransaction>;
  submitTransaction(signedTx: string): Promise<string>; // returns txHash
  waitForConfirmation(txHash: string, confirmations?: number): Promise<SwapTransaction>;

  // Utils
  isValidAddress(address: string): boolean;
  formatUnits(amount: bigint, decimals: number): string;
  parseUnits(amount: string, decimals: number): bigint;
}

export interface UnsignedTransaction {
  chainId: ChainId;
  to: string;
  data: string;
  value: bigint;
  gasLimit?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: number;
}

export interface SignedTransaction {
  chainId: ChainId;
  raw: string;
  hash: string;
}

/**
 * EVM-specific adapter interface
 */
export interface EvmAdapter extends ChainAdapter {
  getGasPrice(): Promise<bigint>;
  estimateGas(tx: UnsignedTransaction): Promise<bigint>;
  getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null>;
}

export interface TransactionReceipt {
  txHash: string;
  blockNumber: bigint;
  blockHash: string;
  status: 'success' | 'reverted';
  gasUsed: bigint;
  effectiveGasPrice: bigint;
  logs: EventLog[];
}

export interface EventLog {
  address: string;
  topics: string[];
  data: string;
  logIndex: number;
}

/**
 * TON-specific adapter interface
 */
export interface TonAdapter extends ChainAdapter {
  getJettonWallet(ownerAddress: string, jettonMaster: string): Promise<string>;
  getSeqno(address: string): Promise<number>;
}

/**
 * Sui-specific adapter interface
 */
export interface SuiAdapter extends ChainAdapter {
  getCoins(address: string, coinType: string): Promise<SuiCoin[]>;
  mergeCoins(coins: SuiCoin[]): Promise<string>;
}

export interface SuiCoin {
  objectId: string;
  coinType: string;
  balance: bigint;
}

/**
 * SVM-specific adapter interface (Solana Virtual Machine - Eclipse, Solana)
 */
export interface SvmAdapter extends ChainAdapter {
  getTokenAccounts(owner: string): Promise<SvmTokenAccount[]>;
  getRecentBlockhash(): Promise<string>;
  simulateTransaction(tx: string): Promise<SvmSimulationResult>;
}

export interface SvmTokenAccount {
  mint: string;
  owner: string;
  amount: bigint;
  decimals: number;
}

export interface SvmSimulationResult {
  success: boolean;
  logs: string[];
  unitsConsumed: number;
  error?: string;
}

/**
 * Adapter registry for managing multiple chain adapters
 */
export interface AdapterRegistry {
  register(adapter: ChainAdapter): void;
  get(chainId: ChainId): ChainAdapter | undefined;
  getAll(): ChainAdapter[];
  getEnabled(): ChainAdapter[];
}
