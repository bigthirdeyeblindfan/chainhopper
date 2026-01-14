// @ts-nocheck
import type {
  SuiAdapter,
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
  SuiCoin,
} from '@chainhopper/types';
import {
  SuiClient,
  getFullnodeUrl,
} from '@mysten/sui/client';
import {
  Transaction,
  TransactionBlock,
} from '@mysten/sui/transactions';

// SUI native token constant
const SUI_NATIVE: Token = {
  address: '0x2::sui::SUI',
  chainId: 'sui',
  symbol: 'SUI',
  name: 'Sui',
  decimals: 9,
  isNative: true,
  isVerified: true,
};

// Common coin types
const COIN_TYPES = {
  SUI: '0x2::sui::SUI',
  USDC: '0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN',
  USDT: '0xc060006111016b8a020ad5b33834984a437aaa7d3c74c18e09a95d48aceab08c::coin::COIN',
  WETH: '0xaf8cd5edc19c4512f4259f0bee101a40d41ebed738ade5874359610ef8eeced5::coin::COIN',
} as const;

// DEX router addresses
const DEX_ROUTERS = {
  cetus: {
    globalConfig: '0xdaa46292632c3c4d8f31f23ea0f9b36a28ff3677e9684980e4438403a67a3d8f',
    poolsRegistry: '0x4c9ab808d50ca1358cc699bb53b3480b92c8e9bab42c8b2fe7c7c4e5a8c38ff2',
  },
  turbos: {
    router: '0x91bfbc386a41afcfd9b2533058d7e915a1d3829089cc268ff4333d54d6339ca1',
  },
} as const;

// Common pool configurations for major pairs
const CETUS_POOLS = {
  'SUI-USDC': '0xcf994611fd4c48e277ce3ffd4d4364c914af2c3cbb05f7bf6facd371de688b3e',
  'SUI-USDT': '0x06d8af9e6afd27262db436f0d37b304a041f710c3ea1fa4c3a9bab36b3569ad3',
} as const;

const TURBOS_POOLS = {
  'SUI-USDC': '0x5eb2dfcdd1b15d2021328258f6d5ec081e9a0cdcfa9e13a0eaeb8b2d7b6ae4c3',
  'SUI-USDT': '0x2c6fc12bf0d093b5391e7c0fed7e044d52bc14eb29f6352a3fb358e33df73f5e',
} as const;

export class SuiChainAdapter implements SuiAdapter {
  readonly chainId = 'sui' as const;
  readonly config: ChainConfig;

  private client: SuiClient;
  private currentRpcIndex = 0;

  constructor(config: ChainConfig) {
    this.config = config;
    this.client = new SuiClient({
      url: config.rpcUrls[0] || getFullnodeUrl('mainnet'),
    });
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
  }

  async shutdown(): Promise<void> {
    // SuiClient doesn't require explicit cleanup
  }

  async healthCheck(): Promise<ChainStatus> {
    const start = Date.now();
    try {
      const checkpoint = await this.client.getLatestCheckpointSequenceNumber();
      return {
        chainId: this.chainId,
        isHealthy: true,
        blockNumber: BigInt(checkpoint),
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
    // Handle native SUI
    if (address === 'native' || address === COIN_TYPES.SUI) {
      return SUI_NATIVE;
    }

    try {
      const coinMetadata = await this.client.getCoinMetadata({
        coinType: address,
      });

      if (!coinMetadata) {
        return null;
      }

      return {
        address,
        chainId: this.chainId,
        symbol: coinMetadata.symbol,
        name: coinMetadata.name,
        decimals: coinMetadata.decimals,
        logoUri: coinMetadata.iconUrl || undefined,
        isNative: false,
        isVerified: false,
      };
    } catch {
      return null;
    }
  }

  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string
  ): Promise<TokenBalance> {
    const coinType = tokenAddress === 'native' ? COIN_TYPES.SUI : tokenAddress;

    try {
      const balance = await this.client.getBalance({
        owner: walletAddress,
        coinType,
      });

      const token = await this.getToken(coinType);

      if (!token) {
        throw new Error(`Token not found: ${tokenAddress}`);
      }

      const balanceBigInt = BigInt(balance.totalBalance);

      return {
        token,
        balance: balanceBigInt,
        balanceFormatted: this.formatUnits(balanceBigInt, token.decimals),
      };
    } catch (error) {
      const token = await this.getToken(coinType);
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
    try {
      const allBalances = await this.client.getAllBalances({
        owner: walletAddress,
      });

      const balances: TokenBalance[] = [];

      for (const balance of allBalances) {
        const token = await this.getToken(balance.coinType);
        if (token) {
          const balanceBigInt = BigInt(balance.totalBalance);
          balances.push({
            token,
            balance: balanceBigInt,
            balanceFormatted: this.formatUnits(balanceBigInt, token.decimals),
          });
        }
      }

      return balances;
    } catch {
      // Fallback to just native balance
      return [await this.getTokenBalance(walletAddress, 'native')];
    }
  }

  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    const token = await this.getToken(tokenAddress);
    if (!token) {
      throw new Error(`Token not found: ${tokenAddress}`);
    }

    // In production, fetch from DexScreener, CoinGecko, or DEX pools
    return {
      token,
      priceUsd: tokenAddress === 'native' || tokenAddress === COIN_TYPES.SUI ? 3.5 : 0,
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

    // Try Cetus first, then Turbos
    const cetusQuote = await this.getCetusQuote(request);
    const turbosQuote = await this.getTurbosQuote(request);

    // Use the better quote (higher amountOut)
    const bestQuote =
      cetusQuote.amountOut >= turbosQuote.amountOut ? cetusQuote : turbosQuote;

    const slippageMultiplier = 1 - request.slippage / 100;
    const amountOutMin = BigInt(
      Math.floor(Number(bestQuote.amountOut) * slippageMultiplier)
    );

    // Estimate gas (Sui uses gas budget, typical swap ~0.01 SUI)
    const estimatedGas = 10_000_000n; // 0.01 SUI in MIST
    const gasPrice = 1000n; // Reference gas price

    const fee: FeeBreakdown = {
      totalFeeUsd: 0.035, // ~0.01 SUI at $3.50
      protocolFee: 0n,
      protocolFeeUsd: 0,
      networkFee: estimatedGas,
      networkFeeUsd: 0.035,
    };

    const route: SwapRoute[] = [
      {
        dex: bestQuote.dex,
        poolAddress: bestQuote.poolAddress,
        tokenIn: request.tokenIn,
        tokenOut: request.tokenOut,
        percentage: 100,
      },
    ];

    return {
      id,
      chainId: this.chainId,
      tokenIn,
      tokenOut,
      amountIn: request.amountIn,
      amountOut: bestQuote.amountOut,
      amountOutMin,
      priceImpact: bestQuote.priceImpact,
      route,
      estimatedGas,
      gasPrice,
      fee,
      expiresAt: new Date(Date.now() + 60000), // 1 minute expiry
      dexAggregator: bestQuote.dex === 'cetus' ? 'cetus' : 'turbos',
    };
  }

  async buildSwapTransaction(quote: SwapQuote): Promise<UnsignedTransaction> {
    const route = quote.route[0];
    if (!route) {
      throw new Error('No route in quote');
    }

    let txData: string;

    if (quote.dexAggregator === 'cetus') {
      txData = await this.buildCetusSwapTx(quote);
    } else {
      txData = await this.buildTurbosSwapTx(quote);
    }

    return {
      chainId: this.chainId,
      to: route.poolAddress,
      data: txData,
      value: 0n, // Sui doesn't use value field like EVM
      gasLimit: quote.estimatedGas,
    };
  }

  async submitTransaction(signedTx: string): Promise<string> {
    // signedTx is expected to be a serialized signed transaction
    const result = await this.client.executeTransactionBlock({
      transactionBlock: signedTx,
      options: {
        showEffects: true,
        showEvents: true,
      },
    });

    return result.digest;
  }

  async waitForConfirmation(
    txHash: string,
    _confirmations = 1
  ): Promise<SwapTransaction> {
    try {
      const result = await this.client.waitForTransaction({
        digest: txHash,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      const status = result.effects?.status?.status === 'success' ? 'confirmed' : 'failed';
      const gasUsed = BigInt(result.effects?.gasUsed?.computationCost || 0);

      return {
        id: txHash,
        quoteId: '',
        userId: '',
        chainId: this.chainId,
        tokenIn: SUI_NATIVE,
        tokenOut: SUI_NATIVE,
        amountIn: 0n,
        amountOut: 0n,
        txHash,
        status,
        fee: {
          totalFeeUsd: 0,
          protocolFee: 0n,
          protocolFeeUsd: 0,
          networkFee: gasUsed,
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
        tokenIn: SUI_NATIVE,
        tokenOut: SUI_NATIVE,
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
    // Sui addresses are 64-char hex strings (32 bytes) prefixed with 0x
    // Coin types follow format: 0x{address}::{module}::{type}
    return /^0x[a-fA-F0-9]{64}(::[\w]+::[\w]+)?$/.test(address);
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

  // SUI-specific methods
  async getCoins(address: string, coinType: string): Promise<SuiCoin[]> {
    const coins = await this.client.getCoins({
      owner: address,
      coinType,
    });

    return coins.data.map((coin) => ({
      objectId: coin.coinObjectId,
      coinType: coin.coinType,
      balance: BigInt(coin.balance),
    }));
  }

  async mergeCoins(coins: SuiCoin[]): Promise<string> {
    if (coins.length < 2) {
      throw new Error('Need at least 2 coins to merge');
    }

    // Build merge transaction
    const tx = new Transaction();
    const primaryCoin = tx.object(coins[0].objectId);
    const coinsToMerge = coins.slice(1).map((c) => tx.object(c.objectId));

    tx.mergeCoins(primaryCoin, coinsToMerge);

    // Return serialized transaction for signing
    return tx.serialize();
  }

  // Private helper methods
  private async ensureConnection(): Promise<void> {
    try {
      await this.client.getLatestCheckpointSequenceNumber();
    } catch {
      await this.failoverRpc();
    }
  }

  private async failoverRpc(): Promise<void> {
    if (this.config.rpcUrls.length <= 1) return;

    this.currentRpcIndex =
      (this.currentRpcIndex + 1) % this.config.rpcUrls.length;
    this.client = new SuiClient({
      url: this.config.rpcUrls[this.currentRpcIndex],
    });
  }

  private generateQuoteId(): string {
    return `sui-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private getPairKey(tokenIn: string, tokenOut: string): string {
    const inSymbol = this.getCoinSymbol(tokenIn);
    const outSymbol = this.getCoinSymbol(tokenOut);
    return `${inSymbol}-${outSymbol}`;
  }

  private getCoinSymbol(coinType: string): string {
    if (coinType === 'native' || coinType === COIN_TYPES.SUI) return 'SUI';
    if (coinType === COIN_TYPES.USDC) return 'USDC';
    if (coinType === COIN_TYPES.USDT) return 'USDT';
    if (coinType === COIN_TYPES.WETH) return 'WETH';
    return 'UNKNOWN';
  }

  private async getCetusQuote(
    request: SwapRequest
  ): Promise<{ amountOut: bigint; priceImpact: number; dex: string; poolAddress: string }> {
    try {
      const pairKey = this.getPairKey(request.tokenIn, request.tokenOut);
      const poolAddress = CETUS_POOLS[pairKey as keyof typeof CETUS_POOLS] || '';

      if (!poolAddress) {
        // Try reverse pair
        const reversePairKey = this.getPairKey(request.tokenOut, request.tokenIn);
        const reversePool = CETUS_POOLS[reversePairKey as keyof typeof CETUS_POOLS];
        if (!reversePool) {
          return {
            amountOut: 0n,
            priceImpact: 100,
            dex: 'cetus',
            poolAddress: '',
          };
        }
      }

      // In production, would call Cetus SDK to get actual quote
      // Cetus SDK: @cetusprotocol/cetus-sui-clmm-sdk
      // For now, simulate quote with 0.3% fee
      const feeMultiplier = 0.997;
      const amountOut = BigInt(Math.floor(Number(request.amountIn) * feeMultiplier));

      return {
        amountOut,
        priceImpact: 0.3,
        dex: 'cetus',
        poolAddress: poolAddress || CETUS_POOLS['SUI-USDC'],
      };
    } catch {
      return {
        amountOut: 0n,
        priceImpact: 100,
        dex: 'cetus',
        poolAddress: '',
      };
    }
  }

  private async getTurbosQuote(
    request: SwapRequest
  ): Promise<{ amountOut: bigint; priceImpact: number; dex: string; poolAddress: string }> {
    try {
      const pairKey = this.getPairKey(request.tokenIn, request.tokenOut);
      const poolAddress = TURBOS_POOLS[pairKey as keyof typeof TURBOS_POOLS] || '';

      if (!poolAddress) {
        const reversePairKey = this.getPairKey(request.tokenOut, request.tokenIn);
        const reversePool = TURBOS_POOLS[reversePairKey as keyof typeof TURBOS_POOLS];
        if (!reversePool) {
          return {
            amountOut: 0n,
            priceImpact: 100,
            dex: 'turbos',
            poolAddress: '',
          };
        }
      }

      // In production, would call Turbos SDK to get actual quote
      // Turbos SDK: @turbos-finance/sdk
      // For now, simulate quote with 0.25% fee
      const feeMultiplier = 0.9975;
      const amountOut = BigInt(Math.floor(Number(request.amountIn) * feeMultiplier));

      return {
        amountOut,
        priceImpact: 0.25,
        dex: 'turbos',
        poolAddress: poolAddress || TURBOS_POOLS['SUI-USDC'],
      };
    } catch {
      return {
        amountOut: 0n,
        priceImpact: 100,
        dex: 'turbos',
        poolAddress: '',
      };
    }
  }

  private async buildCetusSwapTx(quote: SwapQuote): Promise<string> {
    const tx = new Transaction();

    // In production, would use Cetus SDK to build proper swap transaction
    // This is a simplified structure showing the concept
    const route = quote.route[0]!;

    // Cetus swap requires:
    // 1. Split coins to exact amount needed
    // 2. Call swap function on pool
    // 3. Transfer output to recipient

    // Placeholder - actual implementation needs Cetus SDK
    tx.moveCall({
      target: `${DEX_ROUTERS.cetus.globalConfig}::router::swap_a2b`,
      arguments: [
        tx.object(DEX_ROUTERS.cetus.globalConfig),
        tx.object(route.poolAddress),
        tx.pure.u64(Number(quote.amountIn)),
        tx.pure.u64(Number(quote.amountOutMin)),
        tx.pure.bool(true), // by_amount_in
      ],
    });

    tx.setGasBudget(Number(quote.estimatedGas));

    return tx.serialize();
  }

  private async buildTurbosSwapTx(quote: SwapQuote): Promise<string> {
    const tx = new Transaction();

    // In production, would use Turbos SDK to build proper swap transaction
    const route = quote.route[0]!;

    // Turbos swap structure (simplified)
    tx.moveCall({
      target: `${DEX_ROUTERS.turbos.router}::router::swap_exact_input`,
      arguments: [
        tx.object(route.poolAddress),
        tx.pure.u64(Number(quote.amountIn)),
        tx.pure.u64(Number(quote.amountOutMin)),
        tx.pure.u64(Math.floor(Date.now() / 1000) + 3600), // deadline
      ],
    });

    tx.setGasBudget(Number(quote.estimatedGas));

    return tx.serialize();
  }
}

// Export config helper
export function createSuiConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'sui',
    name: 'Sui',
    type: 'sui',
    nativeCurrency: {
      name: 'Sui',
      symbol: 'SUI',
      decimals: 9,
    },
    rpcUrls: [
      'https://fullnode.mainnet.sui.io:443',
      'https://sui-mainnet-rpc.allthatnode.com',
      'https://sui-mainnet.blockvision.org/v1/rpc/public',
    ],
    blockExplorerUrls: ['https://suiscan.xyz'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
    ...overrides,
  };
}

// Export testnet config
export function createSuiTestnetConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'sui',
    name: 'Sui Testnet',
    type: 'sui',
    nativeCurrency: {
      name: 'Sui',
      symbol: 'SUI',
      decimals: 9,
    },
    rpcUrls: [
      'https://fullnode.testnet.sui.io:443',
    ],
    blockExplorerUrls: ['https://suiscan.xyz/testnet'],
    contracts: {},
    isTestnet: true,
    isEnabled: true,
    ...overrides,
  };
}

// Export devnet config
export function createSuiDevnetConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'sui',
    name: 'Sui Devnet',
    type: 'sui',
    nativeCurrency: {
      name: 'Sui',
      symbol: 'SUI',
      decimals: 9,
    },
    rpcUrls: [
      'https://fullnode.devnet.sui.io:443',
    ],
    blockExplorerUrls: ['https://suiscan.xyz/devnet'],
    contracts: {},
    isTestnet: true,
    isEnabled: true,
    ...overrides,
  };
}

// Coin type constants
export { COIN_TYPES };
export { COIN_TYPES as SUI_COIN_TYPES };

// Factory function
export function createSuiAdapter(config?: Partial<ChainConfig>): SuiChainAdapter {
  return new SuiChainAdapter(createSuiConfig(config));
}
