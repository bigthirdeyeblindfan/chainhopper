/**
 * Solana Chain Adapter
 *
 * Main adapter implementation for Solana mainnet.
 * Implements the SvmAdapter interface with Jupiter DEX integration.
 */

import type {
  SvmAdapter,
  ChainConfig,
  ChainStatus,
  Token,
  TokenBalance,
  TokenPrice,
  SwapQuote,
  SwapRequest,
  SwapTransaction,
  SwapRoute,
  FeeBreakdown,
  UnsignedTransaction,
  SvmTokenAccount,
  SvmSimulationResult,
  SolanaConfig,
} from '@chainhopper/types';
import { DEFAULT_SOLANA_CONFIG } from '@chainhopper/types';
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMint,
  createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';

import {
  SOLANA_TOKEN_ADDRESSES,
  SOLANA_TOKEN_LIST,
  getTokenByAddress,
  isWrappedSol,
  fetchJupiterTokenList,
} from './tokens.js';
import {
  getJupiterQuote,
  buildJupiterSwapTransaction,
  jupiterQuoteToSolanaQuote,
  getPriorityFeeEstimate,
  type JupiterQuoteResponse,
} from './dex.js';

// Re-export submodules
export * from './tokens.js';
export * from './dex.js';
export * from './jupiter.js';
export * from './raydium.js';
export * from './orca.js';
export * from './aggregator.js';

// Solana native token
const SOLANA_NATIVE: Token = {
  address: 'native',
  chainId: 'solana',
  symbol: 'SOL',
  name: 'Solana',
  decimals: 9,
  isNative: true,
  isVerified: true,
};

/**
 * Solana Chain Adapter
 *
 * Provides trading functionality on Solana mainnet via Jupiter aggregator.
 */
export class SolanaChainAdapter implements SvmAdapter {
  readonly chainId = 'solana' as const;
  readonly config: ChainConfig;

  private connection: Connection;
  private currentRpcIndex = 0;
  private tokenCache: Map<string, Token> = new Map();
  private priorityFee: number = 1000; // Default priority fee in microlamports

  constructor(config?: Partial<SolanaConfig>) {
    const defaultConfig = DEFAULT_SOLANA_CONFIG as SolanaConfig;
    this.config = {
      ...defaultConfig,
      ...config,
    } as ChainConfig;

    this.connection = new Connection(
      this.config.rpcUrls[0] || 'https://api.mainnet-beta.solana.com',
      {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 60000,
      }
    );

    // Pre-populate token cache
    for (const token of SOLANA_TOKEN_LIST) {
      this.tokenCache.set(token.address, {
        address: token.address,
        chainId: 'solana',
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        logoUri: token.logoURI,
        isNative: false,
        isVerified: token.isVerified,
      });
    }
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
    // Optionally fetch full token list from Jupiter
    // const tokens = await fetchJupiterTokenList();
    // for (const token of tokens) { ... }
  }

  async shutdown(): Promise<void> {
    // Connection doesn't require explicit cleanup
  }

  async healthCheck(): Promise<ChainStatus> {
    const start = Date.now();
    try {
      const slot = await this.connection.getSlot();
      return {
        chainId: this.chainId,
        isHealthy: true,
        blockNumber: BigInt(slot),
        latency: Date.now() - start,
        lastUpdated: new Date(),
      };
    } catch {
      await this.failoverRpc();
      return {
        chainId: this.chainId,
        isHealthy: false,
        blockNumber: 0n,
        latency: Date.now() - start,
        lastUpdated: new Date(),
      };
    }
  }

  async getToken(address: string): Promise<Token | null> {
    // Handle native SOL
    if (address === 'native' || address === 'SOL') {
      return SOLANA_NATIVE;
    }

    // Check cache first
    if (this.tokenCache.has(address)) {
      return this.tokenCache.get(address)!;
    }

    try {
      const mintPubkey = new PublicKey(address);
      const mintInfo = await getMint(this.connection, mintPubkey);

      // Try to get metadata from known tokens
      const knownToken = getTokenByAddress(address);

      const token: Token = {
        address,
        chainId: this.chainId,
        symbol: knownToken?.symbol || 'UNKNOWN',
        name: knownToken?.name || 'Unknown Token',
        decimals: mintInfo.decimals,
        logoUri: knownToken?.logoURI,
        isNative: false,
        isVerified: knownToken?.isVerified || false,
      };

      this.tokenCache.set(address, token);
      return token;
    } catch {
      return null;
    }
  }

  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string
  ): Promise<TokenBalance> {
    const ownerPubkey = new PublicKey(walletAddress);

    // Handle native SOL
    if (tokenAddress === 'native' || tokenAddress === 'SOL') {
      const balance = await this.connection.getBalance(ownerPubkey);
      return {
        token: SOLANA_NATIVE,
        balance: BigInt(balance),
        balanceFormatted: this.formatUnits(BigInt(balance), 9),
      };
    }

    try {
      const mintPubkey = new PublicKey(tokenAddress);
      const ata = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);

      const accountInfo = await this.connection.getTokenAccountBalance(ata);
      const token = await this.getToken(tokenAddress);

      if (!token) {
        throw new Error(`Token not found: ${tokenAddress}`);
      }

      const balance = BigInt(accountInfo.value.amount);

      return {
        token,
        balance,
        balanceFormatted: accountInfo.value.uiAmountString || '0',
      };
    } catch {
      const token = await this.getToken(tokenAddress);
      return {
        token: token || {
          address: tokenAddress,
          chainId: this.chainId,
          symbol: 'UNKNOWN',
          name: 'Unknown',
          decimals: 9,
          isNative: false,
          isVerified: false,
        },
        balance: 0n,
        balanceFormatted: '0',
      };
    }
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    const ownerPubkey = new PublicKey(walletAddress);
    const balances: TokenBalance[] = [];

    // Get native SOL balance
    const nativeBalance = await this.getTokenBalance(walletAddress, 'native');
    balances.push(nativeBalance);

    try {
      // Get all SPL token accounts
      const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
        ownerPubkey,
        { programId: TOKEN_PROGRAM_ID }
      );

      for (const account of tokenAccounts.value) {
        const parsedInfo = account.account.data.parsed.info;
        const mint = parsedInfo.mint;
        const token = await this.getToken(mint);

        if (token) {
          const balance = BigInt(parsedInfo.tokenAmount.amount);
          if (balance > 0n) {
            balances.push({
              token,
              balance,
              balanceFormatted: parsedInfo.tokenAmount.uiAmountString || '0',
            });
          }
        }
      }
    } catch {
      // Return just native balance if token fetch fails
    }

    return balances;
  }

  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    const token = await this.getToken(tokenAddress);
    if (!token) {
      throw new Error(`Token not found: ${tokenAddress}`);
    }

    try {
      // Fetch price from Jupiter Price API
      const mint = tokenAddress === 'native' ? SOLANA_TOKEN_ADDRESSES.SOL : tokenAddress;
      const response = await fetch(`https://price.jup.ag/v6/price?ids=${mint}`);

      if (response.ok) {
        const data = await response.json() as any;
        const price = data.data?.[mint]?.price || 0;
        return {
          token,
          priceUsd: price,
          source: 'dex',
          updatedAt: new Date(),
        };
      }
    } catch {
      // Fall back to default
    }

    return {
      token,
      priceUsd: 0,
      source: 'dex',
      updatedAt: new Date(),
    };
  }

  async getQuote(request: SwapRequest): Promise<SwapQuote> {
    const id = this.generateQuoteId();
    const tokenIn = await this.getToken(request.tokenIn);
    const tokenOut = await this.getToken(request.tokenOut);

    if (!tokenIn || !tokenOut) {
      throw new Error('Invalid token addresses');
    }

    // Map native to wrapped SOL for Jupiter
    const inputMint = request.tokenIn === 'native'
      ? SOLANA_TOKEN_ADDRESSES.SOL
      : request.tokenIn;
    const outputMint = request.tokenOut === 'native'
      ? SOLANA_TOKEN_ADDRESSES.SOL
      : request.tokenOut;

    // Get quote from Jupiter
    const jupiterQuote = await getJupiterQuote({
      inputMint,
      outputMint,
      amount: request.amountIn.toString(),
      slippageBps: Math.round(request.slippage * 100),
    });

    if (!jupiterQuote) {
      throw new Error('Failed to get quote from Jupiter');
    }

    const slippageMultiplier = 1 - request.slippage / 100;
    const amountOutMin = BigInt(
      Math.floor(Number(jupiterQuote.outAmount) * slippageMultiplier)
    );

    // Get priority fee estimate
    this.priorityFee = await getPriorityFeeEstimate(this.connection);

    // Estimate compute units (typical Jupiter swap ~300k-600k CU)
    const estimatedGas = 400_000n;
    const gasPrice = BigInt(this.priorityFee); // Microlamports per CU

    const fee: FeeBreakdown = {
      totalFeeUsd: 0.001, // Approximate
      protocolFee: 0n,
      protocolFeeUsd: 0,
      networkFee: estimatedGas * gasPrice / 1_000_000n + 5000n, // + base fee
      networkFeeUsd: 0.001,
    };

    const route: SwapRoute[] = jupiterQuote.routePlan?.map((step) => ({
      dex: step.swapInfo?.label || 'jupiter',
      poolAddress: step.swapInfo?.ammKey || '',
      tokenIn: step.swapInfo?.inputMint || inputMint,
      tokenOut: step.swapInfo?.outputMint || outputMint,
      percentage: step.percent || 100,
    })) || [{
      dex: 'jupiter',
      poolAddress: '',
      tokenIn: inputMint,
      tokenOut: outputMint,
      percentage: 100,
    }];

    // Store quote for later use in buildSwapTransaction
    (this as any)._lastJupiterQuote = jupiterQuote;

    return {
      id,
      chainId: this.chainId,
      tokenIn,
      tokenOut,
      amountIn: request.amountIn,
      amountOut: BigInt(jupiterQuote.outAmount || 0),
      amountOutMin,
      priceImpact: parseFloat(jupiterQuote.priceImpactPct || '0'),
      route,
      estimatedGas,
      gasPrice,
      fee,
      expiresAt: new Date(Date.now() + 60000), // 1 minute expiry
      dexAggregator: 'jupiter',
    };
  }

  async buildSwapTransaction(quote: SwapQuote): Promise<UnsignedTransaction> {
    // Get the stored Jupiter quote
    const jupiterQuote = (this as any)._lastJupiterQuote as JupiterQuoteResponse | undefined;

    if (!jupiterQuote) {
      throw new Error('No Jupiter quote available. Call getQuote first.');
    }

    // Note: Building a real transaction requires the user's public key
    // This will be provided by the caller
    // For now, return a placeholder that requires the userPublicKey to be set

    return {
      chainId: this.chainId,
      to: '', // SVM transactions don't have a single "to" address
      data: JSON.stringify({
        type: 'jupiter_swap',
        quoteResponse: jupiterQuote,
        priorityFee: this.priorityFee,
      }),
      value: 0n,
      gasLimit: quote.estimatedGas,
    };
  }

  /**
   * Build a complete swap transaction with user public key
   */
  async buildSwapTransactionWithUser(
    quote: SwapQuote,
    userPublicKey: string
  ): Promise<string | null> {
    const jupiterQuote = (this as any)._lastJupiterQuote as JupiterQuoteResponse | undefined;

    if (!jupiterQuote) {
      throw new Error('No Jupiter quote available. Call getQuote first.');
    }

    const swapResponse = await buildJupiterSwapTransaction({
      quoteResponse: jupiterQuote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      prioritizationFeeLamports: 'auto',
      dynamicComputeUnitLimit: true,
    });

    if (!swapResponse) {
      return null;
    }

    return swapResponse.swapTransaction;
  }

  async submitTransaction(signedTx: string): Promise<string> {
    const txBuffer = Buffer.from(signedTx, 'base64');

    let signature: string;
    try {
      // Try versioned transaction first (Jupiter uses these)
      const versionedTx = VersionedTransaction.deserialize(txBuffer);
      signature = await this.connection.sendTransaction(versionedTx, {
        skipPreflight: false,
        maxRetries: 3,
      });
    } catch {
      // Fall back to legacy transaction
      const legacyTx = Transaction.from(txBuffer);
      signature = await this.connection.sendRawTransaction(txBuffer, {
        skipPreflight: false,
        maxRetries: 3,
      });
    }

    return signature;
  }

  async waitForConfirmation(
    txHash: string,
    _confirmations = 1
  ): Promise<SwapTransaction> {
    try {
      const result = await this.connection.confirmTransaction(txHash, 'confirmed');

      if (result.value.err) {
        return this.createFailedTransaction(txHash, result.value.err);
      }

      // Get transaction details
      const txDetails = await this.connection.getTransaction(txHash, {
        maxSupportedTransactionVersion: 0,
      });

      const fee = BigInt(txDetails?.meta?.fee || 0);

      return {
        id: txHash,
        quoteId: '',
        userId: '',
        chainId: this.chainId,
        tokenIn: SOLANA_NATIVE,
        tokenOut: SOLANA_NATIVE,
        amountIn: 0n,
        amountOut: 0n,
        txHash,
        status: 'confirmed',
        fee: {
          totalFeeUsd: 0,
          protocolFee: 0n,
          protocolFeeUsd: 0,
          networkFee: fee,
          networkFeeUsd: 0,
        },
        createdAt: new Date(),
        confirmedAt: new Date(),
      };
    } catch (error) {
      return this.createFailedTransaction(txHash, error);
    }
  }

  isValidAddress(address: string): boolean {
    if (address === 'native' || address === 'SOL') return true;
    try {
      const pubkey = new PublicKey(address);
      return pubkey.toBytes().length === 32;
    } catch {
      return false;
    }
  }

  formatUnits(amount: bigint, decimals: number): string {
    const divisor = 10n ** BigInt(decimals);
    const integerPart = amount / divisor;
    const fractionalPart = amount % divisor;

    if (fractionalPart === 0n) {
      return integerPart.toString();
    }

    const fractionalStr = fractionalPart.toString().padStart(decimals, '0');
    const trimmed = fractionalStr.replace(/0+$/, '');
    return `${integerPart}.${trimmed}`;
  }

  parseUnits(amount: string, decimals: number): bigint {
    const [integerPart, fractionalPart = ''] = amount.split('.');
    const paddedFractional = fractionalPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(integerPart + paddedFractional);
  }

  // SVM-specific methods
  async getTokenAccounts(owner: string): Promise<SvmTokenAccount[]> {
    const ownerPubkey = new PublicKey(owner);

    const accounts = await this.connection.getParsedTokenAccountsByOwner(
      ownerPubkey,
      { programId: TOKEN_PROGRAM_ID }
    );

    return accounts.value.map((account) => {
      const info = account.account.data.parsed.info;
      return {
        mint: info.mint,
        owner: info.owner,
        amount: BigInt(info.tokenAmount.amount),
        decimals: info.tokenAmount.decimals,
      };
    });
  }

  async getRecentBlockhash(): Promise<string> {
    const { blockhash } = await this.connection.getLatestBlockhash();
    return blockhash;
  }

  async simulateTransaction(tx: string): Promise<SvmSimulationResult> {
    try {
      const txBuffer = Buffer.from(tx, 'base64');
      const versionedTx = VersionedTransaction.deserialize(txBuffer);

      const result = await this.connection.simulateTransaction(versionedTx);

      return {
        success: result.value.err === null,
        logs: result.value.logs || [],
        unitsConsumed: result.value.unitsConsumed || 0,
        error: result.value.err ? JSON.stringify(result.value.err) : undefined,
      };
    } catch (error) {
      return {
        success: false,
        logs: [],
        unitsConsumed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Additional Solana-specific methods

  /**
   * Get or create Associated Token Account
   */
  async getOrCreateATA(
    owner: string,
    mint: string
  ): Promise<{ address: string; instruction?: any }> {
    const ownerPubkey = new PublicKey(owner);
    const mintPubkey = new PublicKey(mint);
    const ata = await getAssociatedTokenAddress(mintPubkey, ownerPubkey);

    try {
      await this.connection.getTokenAccountBalance(ata);
      return { address: ata.toBase58() };
    } catch {
      // ATA doesn't exist, need to create
      const instruction = createAssociatedTokenAccountInstruction(
        ownerPubkey, // payer
        ata,
        ownerPubkey, // owner
        mintPubkey
      );
      return { address: ata.toBase58(), instruction };
    }
  }

  /**
   * Get current priority fee
   */
  async getCurrentPriorityFee(): Promise<number> {
    return getPriorityFeeEstimate(this.connection);
  }

  /**
   * Get connection instance (for advanced usage)
   */
  getConnection(): Connection {
    return this.connection;
  }

  // Private helper methods
  private async ensureConnection(): Promise<void> {
    try {
      await this.connection.getSlot();
    } catch {
      await this.failoverRpc();
    }
  }

  private async failoverRpc(): Promise<void> {
    if (this.config.rpcUrls.length <= 1) return;

    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.config.rpcUrls.length;
    this.connection = new Connection(
      this.config.rpcUrls[this.currentRpcIndex],
      { commitment: 'confirmed' }
    );
  }

  private generateQuoteId(): string {
    return `solana-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private createFailedTransaction(txHash: string, error: any): SwapTransaction {
    return {
      id: txHash,
      quoteId: '',
      userId: '',
      chainId: this.chainId,
      tokenIn: SOLANA_NATIVE,
      tokenOut: SOLANA_NATIVE,
      amountIn: 0n,
      amountOut: 0n,
      txHash,
      status: 'failed',
      fee: {
        totalFeeUsd: 0,
        protocolFee: 0n,
        protocolFeeUsd: 0,
        networkFee: 0n,
        networkFeeUsd: 0,
      },
      createdAt: new Date(),
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Create default Solana configuration
 */
export function createSolanaConfig(overrides?: Partial<SolanaConfig>): SolanaConfig {
  const config = DEFAULT_SOLANA_CONFIG as SolanaConfig;
  return {
    ...config,
    ...overrides,
  };
}

/**
 * Create Solana adapter with optional config
 */
export function createSolanaAdapter(config?: Partial<SolanaConfig>): SolanaChainAdapter {
  return new SolanaChainAdapter(config);
}

// Export token addresses constant
export { SOLANA_TOKEN_ADDRESSES };
