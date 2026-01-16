// @ts-nocheck
import type {
  EvmAdapter,
  ChainConfig,
  ChainStatus,
  Token,
  TokenBalance,
  TokenPrice,
  SwapQuote,
  SwapRequest,
  SwapTransaction,
  FeeBreakdown,
  UnsignedTransaction,
  TransactionReceipt,
  EventLog,
  ChainId,
} from '@chainhopper/types';
import {
  createPublicClient,
  http,
  formatUnits as viemFormatUnits,
  parseUnits as viemParseUnits,
  isAddress,
  getAddress,
  type PublicClient,
  type Chain,
  erc20Abi,
} from 'viem';
import {
  mainnet,
  base,
  arbitrum,
  optimism,
  polygon,
  bsc,
  avalanche,
  // Phase 7 chains with native viem support
  linea,
  zkSync,
  blast,
  mantle,
  manta,
  mode,
  gnosis,
  fantom,
  scroll,
  celo,
  cronos,
  moonbeam,
  moonriver,
  metis,
  zora,
  fraxtal,
  taiko,
  bob,
} from 'viem/chains';
import {
  EVM_CHAIN_IDS,
  EVM_CHAIN_CONFIGS,
  NATIVE_TOKEN_ADDRESS,
  WRAPPED_NATIVE_TOKENS,
  type EvmChainId,
  isEvmChain,
} from './chains.js';
import { getBestQuote, type AggregatorQuote } from './aggregators.js';

// Map our chain IDs to viem chains
const VIEM_CHAINS: Partial<Record<EvmChainId, Chain>> = {
  // Original chains
  ethereum: mainnet,
  base: base,
  arbitrum: arbitrum,
  optimism: optimism,
  polygon: polygon,
  bsc: bsc,
  avalanche: avalanche,
  // Phase 7 chains with native viem support
  linea: linea,
  zksync: zkSync,
  blast: blast,
  mantle: mantle,
  manta: manta,
  mode: mode,
  gnosis: gnosis,
  fantom: fantom,
  scroll: scroll,
  celo: celo,
  cronos: cronos,
  moonbeam: moonbeam,
  moonriver: moonriver,
  metis: metis,
  zora: zora,
  fraxtal: fraxtal,
  taiko: taiko,
  bob: bob,
  // Chains without native viem support use createCustomChain():
  // monad, abstract, soneium, xlayer, ink, zerog, astar, apechain,
  // ronin, stable, unichain, worldchain, cyber, lisk, mint,
  // redstone, derive, hyperliquid, sonic, kaia, berachain
};

// Create custom chains for unsupported networks
function createCustomChain(chainId: EvmChainId): Chain {
  const config = EVM_CHAIN_CONFIGS[chainId];
  const numericId = EVM_CHAIN_IDS[chainId];

  return {
    id: numericId,
    name: config.name,
    nativeCurrency: config.nativeCurrency,
    rpcUrls: {
      default: { http: config.rpcUrls },
      public: { http: config.rpcUrls },
    },
    blockExplorers: {
      default: { name: 'Explorer', url: config.blockExplorerUrls[0] ?? '' },
    },
  };
}

export class EvmChainAdapter implements EvmAdapter {
  readonly chainId: ChainId;
  readonly config: ChainConfig;

  private client: PublicClient;
  private currentRpcIndex = 0;
  private oneInchApiKey?: string;

  constructor(config: ChainConfig, options?: { oneInchApiKey?: string });
  constructor(chainId: EvmChainId, options?: { oneInchApiKey?: string });
  constructor(
    configOrChainId: ChainConfig | EvmChainId,
    options?: { oneInchApiKey?: string }
  ) {
    if (typeof configOrChainId === 'string') {
      // ChainId passed
      if (!isEvmChain(configOrChainId)) {
        throw new Error(`${configOrChainId} is not a supported EVM chain`);
      }
      this.chainId = configOrChainId;
      this.config = EVM_CHAIN_CONFIGS[configOrChainId];
    } else {
      // ChainConfig passed
      this.chainId = configOrChainId.id;
      this.config = configOrChainId;
    }

    this.oneInchApiKey = options?.oneInchApiKey;

    const evmChainId = this.chainId as EvmChainId;
    const viemChain = VIEM_CHAINS[evmChainId] || createCustomChain(evmChainId);

    this.client = createPublicClient({
      chain: viemChain,
      transport: http(this.config.rpcUrls[0]),
    });
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
  }

  async shutdown(): Promise<void> {
    // PublicClient doesn't require explicit cleanup
  }

  async healthCheck(): Promise<ChainStatus> {
    const start = Date.now();
    try {
      const blockNumber = await this.client.getBlockNumber();
      return {
        chainId: this.chainId,
        isHealthy: true,
        blockNumber,
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
    if (this.isNativeToken(address)) {
      return this.getNativeToken();
    }

    try {
      const normalizedAddress = getAddress(address) as `0x${string}`;

      const [name, symbol, decimals] = await Promise.all([
        this.client.readContract({
          address: normalizedAddress,
          abi: erc20Abi,
          functionName: 'name',
        }),
        this.client.readContract({
          address: normalizedAddress,
          abi: erc20Abi,
          functionName: 'symbol',
        }),
        this.client.readContract({
          address: normalizedAddress,
          abi: erc20Abi,
          functionName: 'decimals',
        }),
      ]);

      return {
        address: normalizedAddress,
        chainId: this.chainId,
        symbol: symbol as string,
        name: name as string,
        decimals: decimals as number,
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
    const normalizedWallet = getAddress(walletAddress) as `0x${string}`;

    if (this.isNativeToken(tokenAddress)) {
      const balance = await this.client.getBalance({ address: normalizedWallet });
      const token = this.getNativeToken();
      return {
        token,
        balance,
        balanceFormatted: this.formatUnits(balance, token.decimals),
      };
    }

    const normalizedToken = getAddress(tokenAddress) as `0x${string}`;
    const token = await this.getToken(tokenAddress);

    if (!token) {
      throw new Error(`Token not found: ${tokenAddress}`);
    }

    const balance = await this.client.readContract({
      address: normalizedToken,
      abi: erc20Abi,
      functionName: 'balanceOf',
      args: [normalizedWallet],
    });

    return {
      token,
      balance: balance as bigint,
      balanceFormatted: this.formatUnits(balance as bigint, token.decimals),
    };
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    // Get native balance
    const nativeBalance = await this.getTokenBalance(walletAddress, 'native');

    // For ERC20s, would need to either:
    // 1. Use an indexer API (Alchemy, Moralis, etc.)
    // 2. Have a list of known tokens to check
    // For now, just return native
    return [nativeBalance];
  }

  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    const token = await this.getToken(tokenAddress);
    if (!token) {
      throw new Error(`Token not found: ${tokenAddress}`);
    }

    // In production, would fetch from DexScreener, CoinGecko, etc.
    return {
      token,
      priceUsd: 0,
      source: 'dex',
      updatedAt: new Date(),
    };
  }

  async getQuote(request: SwapRequest): Promise<SwapQuote> {
    const tokenIn = await this.getToken(request.tokenIn);
    const tokenOut = await this.getToken(request.tokenOut);

    if (!tokenIn || !tokenOut) {
      throw new Error('Invalid token addresses');
    }

    // Get quote from aggregators
    const aggregatorQuote = await getBestQuote(request, {
      oneInchApiKey: this.oneInchApiKey,
    });

    if (!aggregatorQuote) {
      throw new Error('No quotes available from aggregators');
    }

    const slippageMultiplier = 1 - request.slippage / 100;
    const amountOutMin = BigInt(
      Math.floor(Number(aggregatorQuote.amountOut) * slippageMultiplier)
    );

    const gasPrice = await this.getGasPrice();
    const networkFee = aggregatorQuote.estimatedGas * gasPrice;

    const fee: FeeBreakdown = {
      totalFeeUsd: 0,
      protocolFee: 0n,
      protocolFeeUsd: 0,
      networkFee,
      networkFeeUsd: 0,
    };

    return {
      id: this.generateQuoteId(),
      chainId: this.chainId,
      tokenIn,
      tokenOut,
      amountIn: request.amountIn,
      amountOut: aggregatorQuote.amountOut,
      amountOutMin,
      priceImpact: aggregatorQuote.priceImpact,
      route: aggregatorQuote.route,
      estimatedGas: aggregatorQuote.estimatedGas,
      gasPrice,
      fee,
      expiresAt: new Date(Date.now() + 60000),
      dexAggregator: aggregatorQuote.aggregator,
    };
  }

  async buildSwapTransaction(quote: SwapQuote): Promise<UnsignedTransaction> {
    // Re-fetch quote to get fresh tx data
    const request: SwapRequest = {
      chainId: this.chainId,
      tokenIn: quote.tokenIn.address,
      tokenOut: quote.tokenOut.address,
      amountIn: quote.amountIn,
      slippage: quote.amountOut > 0n
        ? Number((quote.amountOut - quote.amountOutMin) * 10000n / quote.amountOut) / 100
        : 0.5,
      recipient: '', // Would need to pass this from context
    };

    const aggregatorQuote = await getBestQuote(request, {
      oneInchApiKey: this.oneInchApiKey,
    });

    if (!aggregatorQuote || !aggregatorQuote.txTo) {
      throw new Error('Failed to build swap transaction');
    }

    return {
      chainId: this.chainId,
      to: aggregatorQuote.txTo,
      data: aggregatorQuote.txData,
      value: aggregatorQuote.txValue,
      gasLimit: aggregatorQuote.estimatedGas,
      gasPrice: quote.gasPrice,
    };
  }

  async submitTransaction(signedTx: string): Promise<string> {
    const hash = await this.client.sendRawTransaction({
      serializedTransaction: signedTx as `0x${string}`,
    });
    return hash;
  }

  async waitForConfirmation(
    txHash: string,
    confirmations = 1
  ): Promise<SwapTransaction> {
    const receipt = await this.client.waitForTransactionReceipt({
      hash: txHash as `0x${string}`,
      confirmations,
    });

    const status = receipt.status === 'success' ? 'confirmed' : 'failed';

    return {
      id: txHash,
      quoteId: '',
      userId: '',
      chainId: this.chainId,
      tokenIn: this.getNativeToken(),
      tokenOut: this.getNativeToken(),
      amountIn: 0n,
      amountOut: 0n,
      txHash,
      status,
      fee: {
        totalFeeUsd: 0,
        protocolFee: 0n,
        protocolFeeUsd: 0,
        networkFee: receipt.gasUsed * receipt.effectiveGasPrice,
        networkFeeUsd: 0,
      },
      createdAt: new Date(),
      confirmedAt: new Date(),
    };
  }

  isValidAddress(address: string): boolean {
    if (address === 'native' || address === NATIVE_TOKEN_ADDRESS) {
      return true;
    }
    return isAddress(address);
  }

  formatUnits(amount: bigint, decimals: number): string {
    return viemFormatUnits(amount, decimals);
  }

  parseUnits(amount: string, decimals: number): bigint {
    return viemParseUnits(amount, decimals);
  }

  // EVM-specific methods
  async getGasPrice(): Promise<bigint> {
    return await this.client.getGasPrice();
  }

  async estimateGas(tx: UnsignedTransaction): Promise<bigint> {
    return await this.client.estimateGas({
      to: tx.to as `0x${string}`,
      data: tx.data as `0x${string}`,
      value: tx.value,
    });
  }

  async getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null> {
    try {
      const receipt = await this.client.getTransactionReceipt({
        hash: txHash as `0x${string}`,
      });

      if (!receipt) return null;

      const logs: EventLog[] = receipt.logs.map((log) => ({
        address: log.address,
        topics: log.topics as string[],
        data: log.data,
        logIndex: log.logIndex,
      }));

      return {
        txHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        status: receipt.status === 'success' ? 'success' : 'reverted',
        gasUsed: receipt.gasUsed,
        effectiveGasPrice: receipt.effectiveGasPrice,
        logs,
      };
    } catch {
      return null;
    }
  }

  // Private helpers
  private isNativeToken(address: string): boolean {
    return (
      address === 'native' ||
      address.toLowerCase() === NATIVE_TOKEN_ADDRESS.toLowerCase() ||
      address === ''
    );
  }

  private getNativeToken(): Token {
    return {
      address: NATIVE_TOKEN_ADDRESS,
      chainId: this.chainId,
      symbol: this.config.nativeCurrency.symbol,
      name: this.config.nativeCurrency.name,
      decimals: this.config.nativeCurrency.decimals,
      isNative: true,
      isVerified: true,
    };
  }

  private async ensureConnection(): Promise<void> {
    try {
      await this.client.getBlockNumber();
    } catch {
      await this.failoverRpc();
    }
  }

  private async failoverRpc(): Promise<void> {
    if (this.config.rpcUrls.length <= 1) return;

    this.currentRpcIndex = (this.currentRpcIndex + 1) % this.config.rpcUrls.length;

    const evmChainId = this.chainId as EvmChainId;
    const viemChain = VIEM_CHAINS[evmChainId] || createCustomChain(evmChainId);

    this.client = createPublicClient({
      chain: viemChain,
      transport: http(this.config.rpcUrls[this.currentRpcIndex]),
    });
  }

  private generateQuoteId(): string {
    return `${this.chainId}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}

// Export chain utilities
export {
  EVM_CHAIN_IDS,
  EVM_CHAIN_CONFIGS,
  NATIVE_TOKEN_ADDRESS,
  ZERO_ADDRESS,
  WRAPPED_NATIVE_TOKENS,
  isEvmChain,
  getEvmChainId,
  getEvmChainConfig,
  type EvmChainId,
} from './chains.js';

// Export aggregator utilities
export {
  getBestQuote,
  get1inchQuote,
  getParaSwapQuote,
  getSupportedAggregators,
  type AggregatorQuote,
} from './aggregators.js';

// Export Kaia utilities
export {
  KAIA_CONTRACTS,
  KAIA_TOKENS,
  getDragonSwapQuote,
  getKlaySwapQuote,
  getKaiaBestQuote,
  getKaiaPopularPairs,
  type KaiaQuote,
} from './kaia.js';

// Export Sonic utilities
export {
  SONIC_CHAIN_ID,
  SONIC_ROUTERS,
  SONIC_FACTORIES,
  SONIC_TOKENS,
  SWAPX_ROUTER_ABI,
  SHADOW_ROUTER_ABI,
  getSwapXQuote,
  getShadowQuote,
  getSonicBestQuote,
  buildSonicSwapTransaction,
  getSonicDexes,
  isSonicChain,
} from './sonic.js';

// Export Abstract utilities
export {
  ABSTRACT_CHAIN_ID,
  ABSTRACT_ROUTERS,
  ABSTRACT_TOKENS,
  ABSTRACTSWAP_ROUTER_ABI,
  getAbstractSwapQuote,
  getAbstractBestQuote,
  buildAbstractSwapTransaction,
  getAbstractDexes,
  isAbstractChain,
  getAbstractPopularPairs,
  type AbstractQuote,
} from './abstract.js';

// Export Monad utilities
export {
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
  type MonadQuote,
} from './monad.js';

// Export Scroll utilities
export {
  SCROLL_CHAIN_ID,
  SCROLL_ROUTERS,
  SCROLL_FACTORIES,
  SCROLL_TOKENS,
  SYNCSWAP_ROUTER_ABI,
  AMBIENT_ROUTER_ABI,
  getSyncSwapQuote,
  getAmbientQuote,
  getScrollBestQuote,
  buildScrollSwapTransaction,
  getScrollDexes,
  isScrollChain,
  getScrollChainId,
  getScrollPopularPairs,
  type ScrollQuote,
} from './scroll.js';

// Export Soneium utilities
export {
  SONEIUM_CHAIN_ID,
  SONEIUM_ROUTERS,
  SONEIUM_FACTORIES,
  SONEIUM_TOKENS,
  KYO_ROUTER_ABI,
  KYO_QUOTER_ABI,
  getKyoFinanceQuote,
  getKyoOnChainQuote,
  getSoneiumBestQuote,
  buildSoneiumSwapTransaction,
  getSoneiumDexes,
  isSoneiumChain,
  getSoneiumChainId,
  getSoneiumPopularPairs,
  type SoneiumQuote,
} from './soneium.js';

// Export X Layer utilities
export {
  XLAYER_CHAIN_ID,
  XLAYER_ROUTERS,
  XLAYER_FACTORIES,
  XLAYER_TOKENS,
  XSWAP_ROUTER_ABI,
  getXSwapQuote,
  getXLayerDirectQuote,
  getXLayerBestQuote,
  buildXLayerSwapTransaction,
  getXLayerDexes,
  isXLayerChain,
  getXLayerChainId,
  getXLayerPopularPairs,
  type XLayerQuote,
} from './xlayer.js';

// Export 0G utilities
export {
  ZEROG_CHAIN_ID,
  ZEROG_ROUTERS,
  ZEROG_FACTORIES,
  ZEROG_TOKENS,
  ZEROGSWAP_ROUTER_ABI,
  getZeroGSwapQuote,
  getGravityDexQuote,
  getZeroGBestQuote,
  buildZeroGSwapTransaction,
  getZeroGDexes,
  isZeroGChain,
  getZeroGChainId,
  getZeroGPopularPairs,
  type ZeroGQuote,
} from './zerog.js';

// Export ApeChain utilities
export {
  APECHAIN_CHAIN_ID,
  APECHAIN_ROUTERS,
  APECHAIN_FACTORIES,
  APECHAIN_TOKENS,
  APE_PORTAL_ROUTER_ABI,
  getApePortalQuote,
  getCamelotApeChainQuote,
  getApeChainBestQuote,
  buildApeChainSwapTransaction,
  getApeChainDexes,
  isApeChain,
  getApeChainId,
  getApeChainPopularPairs,
  type ApeChainQuote,
} from './apechain.js';

// Export Astar utilities
export {
  ASTAR_CHAIN_ID,
  ASTAR_ROUTERS,
  ASTAR_FACTORIES,
  ASTAR_TOKENS,
  ARTHSWAP_ROUTER_ABI,
  SIRIUS_ROUTER_ABI,
  getArthSwapQuote,
  getSiriusQuote,
  getAstarBestQuote,
  buildAstarSwapTransaction,
  getAstarDexes,
  isAstarChain,
  getAstarChainId,
  getAstarPopularPairs,
  type AstarQuote,
} from './astar.js';

// Export Ink utilities
export {
  INK_CHAIN_ID,
  INK_ROUTERS,
  INK_TOKENS,
  VELODROME_ROUTER_ABI,
  NADO_ROUTER_ABI,
  getVelodromeQuote,
  getNadoQuote,
  getInkBestQuote,
  buildInkSwapTransaction,
  getInkDexes,
  isInkChain,
  getInkChainId,
  getInkPopularPairs,
  type InkQuote,
} from './ink.js';

// Export Ronin utilities
export {
  RONIN_CONTRACTS,
  RONIN_TOKENS,
  getKatanaV3Quote,
  getKatanaV2Quote,
  getKatanaAggregateQuote,
  getRoninBestQuote,
  buildRoninSwapTransaction,
  getRoninDexes,
  isRoninChain,
  getRoninChainId,
  getRoninPopularPairs,
  getKatanaFeeTiers,
  type RoninQuote,
} from './ronin.js';

// Export Stable utilities
export {
  STABLE_CHAIN_ID,
  STABLE_ROUTERS,
  STABLE_FACTORIES,
  STABLE_TOKENS,
  STABLESWAP_ROUTER_ABI,
  getStableSwapQuote,
  getStableDexQuote,
  getStableBestQuote,
  buildStableSwapTransaction,
  getStableDexes,
  isStableChain,
  getStableChainId,
  getStablePopularPairs,
  getStableNativeDecimals,
  type StableQuote,
} from './stable.js';

// Export Linea utilities
export {
  LINEA_CHAIN_ID,
  LINEA_ROUTERS,
  LINEA_FACTORIES,
  LINEA_TOKENS,
  LYNEX_ROUTER_ABI,
  LINEA_SYNCSWAP_ROUTER_ABI,
  getLynexQuote,
  getSyncSwapLineaQuote,
  getLineaBestQuote,
  buildLineaSwapTransaction,
  getLineaDexes,
  isLineaChain,
  getLineaChainId,
  getLineaPopularPairs,
  type LineaQuote,
} from './linea.js';

// Factory function to create adapter for a chain
export function createEvmAdapter(
  chainId: EvmChainId,
  options?: { oneInchApiKey?: string }
): EvmChainAdapter {
  return new EvmChainAdapter(chainId, options);
}

// Create adapters for all enabled EVM chains
export function createAllEvmAdapters(
  options?: { oneInchApiKey?: string }
): Map<EvmChainId, EvmChainAdapter> {
  const adapters = new Map<EvmChainId, EvmChainAdapter>();

  for (const [chainId, config] of Object.entries(EVM_CHAIN_CONFIGS)) {
    if (config.isEnabled) {
      adapters.set(chainId as EvmChainId, new EvmChainAdapter(chainId as EvmChainId, options));
    }
  }

  return adapters;
}
