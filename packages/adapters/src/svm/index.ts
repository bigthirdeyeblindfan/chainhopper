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
} from '@chainhopper/types';
import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
  SystemProgram,
} from '@solana/web3.js';
import {
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getMint,
} from '@solana/spl-token';

// Eclipse native token (ETH on Eclipse L2)
const ECLIPSE_NATIVE: Token = {
  address: 'native',
  chainId: 'eclipse',
  symbol: 'ETH',
  name: 'Ether',
  decimals: 9, // Eclipse uses 9 decimals for native token
  isNative: true,
  isVerified: true,
};

// Common token addresses on Eclipse
const ECLIPSE_TOKENS = {
  ETH: 'native',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // Placeholder - actual Eclipse USDC
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // Placeholder
  SOL: 'So11111111111111111111111111111111111111112', // Wrapped SOL on Eclipse
} as const;

// Jupiter API configuration
const JUPITER_API = {
  quote: 'https://quote-api.jup.ag/v6/quote',
  swap: 'https://quote-api.jup.ag/v6/swap',
  tokens: 'https://token.jup.ag/all',
} as const;

// Eclipse-specific configuration
const ECLIPSE_CONFIG = {
  // Eclipse mainnet RPC endpoints
  mainnetRpc: 'https://mainnetbeta-rpc.eclipse.xyz',
  // Token list API
  tokenList: 'https://token-list.eclipse.xyz/tokens.json',
} as const;

export class EclipseAdapter implements SvmAdapter {
  readonly chainId = 'eclipse' as const;
  readonly config: ChainConfig;

  private connection: Connection;
  private currentRpcIndex = 0;

  constructor(config: ChainConfig) {
    this.config = config;
    this.connection = new Connection(
      config.rpcUrls[0] || ECLIPSE_CONFIG.mainnetRpc,
      'confirmed'
    );
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
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
    // Handle native token
    if (address === 'native' || address === ECLIPSE_TOKENS.ETH) {
      return ECLIPSE_NATIVE;
    }

    try {
      const mintPubkey = new PublicKey(address);
      const mintInfo = await getMint(this.connection, mintPubkey);

      // Try to get token metadata from token list
      const metadata = await this.fetchTokenMetadata(address);

      return {
        address,
        chainId: this.chainId,
        symbol: metadata?.symbol || 'UNKNOWN',
        name: metadata?.name || 'Unknown Token',
        decimals: mintInfo.decimals,
        logoUri: metadata?.logoURI,
        isNative: false,
        isVerified: metadata?.verified || false,
      };
    } catch {
      return null;
    }
  }

  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string
  ): Promise<TokenBalance> {
    const ownerPubkey = new PublicKey(walletAddress);

    // Handle native token (ETH on Eclipse)
    if (tokenAddress === 'native' || tokenAddress === ECLIPSE_TOKENS.ETH) {
      const balance = await this.connection.getBalance(ownerPubkey);
      return {
        token: ECLIPSE_NATIVE,
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

    // Get native balance
    const nativeBalance = await this.getTokenBalance(walletAddress, 'native');
    balances.push(nativeBalance);

    try {
      // Get all token accounts
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
          balances.push({
            token,
            balance,
            balanceFormatted: parsedInfo.tokenAmount.uiAmountString || '0',
          });
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

    // In production, fetch from Jupiter price API or CoinGecko
    // Jupiter Price API: https://price.jup.ag/v4/price?ids={mint}
    return {
      token,
      priceUsd: tokenAddress === 'native' ? 3500 : 0, // ETH price placeholder
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

    // Get quote from Jupiter
    const jupiterQuote = await this.getJupiterQuote(request);

    const slippageMultiplier = 1 - request.slippage / 100;
    const amountOutMin = BigInt(
      Math.floor(Number(jupiterQuote.outAmount) * slippageMultiplier)
    );

    // Estimate compute units (typical swap ~200k CU)
    const estimatedGas = 200_000n;
    const gasPrice = 5000n; // Lamports per CU (micro-lamports)

    const fee: FeeBreakdown = {
      totalFeeUsd: 0.01, // Very low fees on Eclipse
      protocolFee: 0n,
      protocolFeeUsd: 0,
      networkFee: estimatedGas * gasPrice,
      networkFeeUsd: 0.01,
    };

    const route: SwapRoute[] = jupiterQuote.routePlan?.map((step: any) => ({
      dex: step.swapInfo?.label || 'jupiter',
      poolAddress: step.swapInfo?.ammKey || '',
      tokenIn: step.swapInfo?.inputMint || request.tokenIn,
      tokenOut: step.swapInfo?.outputMint || request.tokenOut,
      percentage: step.percent || 100,
    })) || [{
      dex: 'jupiter',
      poolAddress: '',
      tokenIn: request.tokenIn,
      tokenOut: request.tokenOut,
      percentage: 100,
    }];

    return {
      id,
      chainId: this.chainId,
      tokenIn,
      tokenOut,
      amountIn: request.amountIn,
      amountOut: BigInt(jupiterQuote.outAmount || 0),
      amountOutMin,
      priceImpact: jupiterQuote.priceImpactPct || 0,
      route,
      estimatedGas,
      gasPrice,
      fee,
      expiresAt: new Date(Date.now() + 60000), // 1 minute expiry
      dexAggregator: 'jupiter',
    };
  }

  async buildSwapTransaction(quote: SwapQuote): Promise<UnsignedTransaction> {
    // Build Jupiter swap transaction
    const swapTx = await this.buildJupiterSwapTx(quote);

    return {
      chainId: this.chainId,
      to: '', // SVM transactions don't have a single "to" address
      data: swapTx,
      value: 0n,
      gasLimit: quote.estimatedGas,
    };
  }

  async submitTransaction(signedTx: string): Promise<string> {
    // signedTx is expected to be a base64-encoded serialized transaction
    const txBuffer = Buffer.from(signedTx, 'base64');

    // Try to deserialize as versioned transaction first
    let signature: string;
    try {
      const versionedTx = VersionedTransaction.deserialize(txBuffer);
      signature = await this.connection.sendTransaction(versionedTx);
    } catch {
      // Fall back to legacy transaction
      const legacyTx = Transaction.from(txBuffer);
      signature = await this.connection.sendRawTransaction(txBuffer);
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
        return {
          id: txHash,
          quoteId: '',
          userId: '',
          chainId: this.chainId,
          tokenIn: ECLIPSE_NATIVE,
          tokenOut: ECLIPSE_NATIVE,
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
        };
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
        tokenIn: ECLIPSE_NATIVE,
        tokenOut: ECLIPSE_NATIVE,
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
    } catch {
      return {
        id: txHash,
        quoteId: '',
        userId: '',
        chainId: this.chainId,
        tokenIn: ECLIPSE_NATIVE,
        tokenOut: ECLIPSE_NATIVE,
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
      };
    }
  }

  isValidAddress(address: string): boolean {
    if (address === 'native') return true;
    try {
      // Solana addresses are base58-encoded 32-byte public keys
      // Valid base58 addresses are 32-44 characters long
      if (address.length < 32 || address.length > 44) {
        return false;
      }
      // Must be valid base58 and decode to exactly 32 bytes
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

    this.currentRpcIndex =
      (this.currentRpcIndex + 1) % this.config.rpcUrls.length;
    this.connection = new Connection(
      this.config.rpcUrls[this.currentRpcIndex],
      'confirmed'
    );
  }

  private generateQuoteId(): string {
    return `eclipse-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private async fetchTokenMetadata(mint: string): Promise<{
    symbol?: string;
    name?: string;
    logoURI?: string;
    verified?: boolean;
  } | null> {
    try {
      // In production, would fetch from Eclipse token list or Jupiter token list
      // For now, check known tokens
      if (mint === ECLIPSE_TOKENS.USDC) {
        return { symbol: 'USDC', name: 'USD Coin', verified: true };
      }
      if (mint === ECLIPSE_TOKENS.USDT) {
        return { symbol: 'USDT', name: 'Tether USD', verified: true };
      }
      if (mint === ECLIPSE_TOKENS.SOL) {
        return { symbol: 'SOL', name: 'Wrapped SOL', verified: true };
      }
      return null;
    } catch {
      return null;
    }
  }

  private async getJupiterQuote(request: SwapRequest): Promise<{
    outAmount: string;
    priceImpactPct: number;
    routePlan?: any[];
  }> {
    // For Eclipse, we may need to use Eclipse-specific DEX or modified Jupiter
    // This is a simplified implementation
    try {
      // Map native to wrapped address for Jupiter
      const inputMint = request.tokenIn === 'native'
        ? ECLIPSE_TOKENS.SOL
        : request.tokenIn;
      const outputMint = request.tokenOut === 'native'
        ? ECLIPSE_TOKENS.SOL
        : request.tokenOut;

      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: request.amountIn.toString(),
        slippageBps: Math.round(request.slippage * 100).toString(),
      });

      // Note: Jupiter may not work directly on Eclipse
      // In production, would use Eclipse-specific DEX aggregator
      const response = await fetch(`${JUPITER_API.quote}?${params}`);

      if (!response.ok) {
        // Return simulated quote if Jupiter is not available
        return this.getSimulatedQuote(request);
      }

      const data = await response.json();
      return {
        outAmount: data.outAmount || '0',
        priceImpactPct: parseFloat(data.priceImpactPct || '0'),
        routePlan: data.routePlan,
      };
    } catch {
      // Return simulated quote on error
      return this.getSimulatedQuote(request);
    }
  }

  private getSimulatedQuote(request: SwapRequest): {
    outAmount: string;
    priceImpactPct: number;
    routePlan?: any[];
  } {
    // Simulate a quote with 0.3% fee (typical DEX fee)
    const feeMultiplier = 0.997;
    const outAmount = BigInt(Math.floor(Number(request.amountIn) * feeMultiplier));

    return {
      outAmount: outAmount.toString(),
      priceImpactPct: 0.3,
      routePlan: [{
        swapInfo: {
          label: 'simulated',
          inputMint: request.tokenIn,
          outputMint: request.tokenOut,
        },
        percent: 100,
      }],
    };
  }

  private async buildJupiterSwapTx(quote: SwapQuote): Promise<string> {
    try {
      // Build Jupiter swap transaction
      // In production, would call Jupiter swap API with quote
      const inputMint = quote.tokenIn.address === 'native'
        ? ECLIPSE_TOKENS.SOL
        : quote.tokenIn.address;
      const outputMint = quote.tokenOut.address === 'native'
        ? ECLIPSE_TOKENS.SOL
        : quote.tokenOut.address;

      // Note: This requires a user public key which we don't have in this context
      // In production, the caller would provide their public key
      const swapRequest = {
        quoteResponse: {
          inputMint,
          outputMint,
          inAmount: quote.amountIn.toString(),
          outAmount: quote.amountOut.toString(),
          otherAmountThreshold: quote.amountOutMin.toString(),
          slippageBps: Math.round(
            ((Number(quote.amountOut) - Number(quote.amountOutMin)) /
              Number(quote.amountOut)) *
              10000
          ),
          routePlan: quote.route.map((r) => ({
            swapInfo: {
              label: r.dex,
              ammKey: r.poolAddress,
              inputMint: r.tokenIn,
              outputMint: r.tokenOut,
            },
            percent: r.percentage,
          })),
        },
        userPublicKey: SystemProgram.programId.toBase58(), // Placeholder
        wrapAndUnwrapSol: true,
      };

      // In production, would call Jupiter swap API
      // const response = await fetch(JUPITER_API.swap, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(swapRequest),
      // });
      // const data = await response.json();
      // return data.swapTransaction;

      // Return placeholder - actual implementation needs user public key
      return Buffer.from('placeholder_transaction').toString('base64');
    } catch {
      return Buffer.from('placeholder_transaction').toString('base64');
    }
  }
}

// Export config helper
export function createEclipseConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'eclipse',
    name: 'Eclipse',
    type: 'svm',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 9,
    },
    rpcUrls: [
      'https://mainnetbeta-rpc.eclipse.xyz',
      'https://eclipse.helius-rpc.com',
    ],
    blockExplorerUrls: ['https://explorer.eclipse.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
    ...overrides,
  };
}

// Export testnet config
export function createEclipseTestnetConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'eclipse',
    name: 'Eclipse Testnet',
    type: 'svm',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 9,
    },
    rpcUrls: [
      'https://testnet.dev2.eclipsenetwork.xyz',
    ],
    blockExplorerUrls: ['https://explorer.dev.eclipsenetwork.xyz'],
    contracts: {},
    isTestnet: true,
    isEnabled: true,
    ...overrides,
  };
}

// Export devnet config
export function createEclipseDevnetConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'eclipse',
    name: 'Eclipse Devnet',
    type: 'svm',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 9,
    },
    rpcUrls: [
      'https://staging-rpc.dev2.eclipsenetwork.xyz',
    ],
    blockExplorerUrls: ['https://explorer.dev.eclipsenetwork.xyz'],
    contracts: {},
    isTestnet: true,
    isEnabled: true,
    ...overrides,
  };
}

// Token constants
export { ECLIPSE_TOKENS };

// Factory function
export function createEclipseAdapter(config?: Partial<ChainConfig>): EclipseAdapter {
  return new EclipseAdapter(createEclipseConfig(config));
}
