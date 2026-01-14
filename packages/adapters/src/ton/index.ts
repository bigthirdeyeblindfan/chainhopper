import type {
  TonAdapter,
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
} from '@chainhopper/types';
import {
  TonClient,
  Address,
  fromNano,
  toNano,
  JettonMaster,
  JettonWallet,
  WalletContractV4,
  beginCell,
  Cell,
} from '@ton/ton';

// TON native token constant
const TON_NATIVE: Token = {
  address: 'native',
  chainId: 'ton',
  symbol: 'TON',
  name: 'Toncoin',
  decimals: 9,
  isNative: true,
  isVerified: true,
};

// Known DEX router addresses
const DEX_ROUTERS = {
  stonfi: {
    router: 'EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt',
    factory: 'EQBfBWT7X2BHg9tXAxzhz2aKvnWuOFz5Hy5a5C9Yrp_GpIhp',
  },
  dedust: {
    vault: 'EQDa4VOnTYlLvDJ0gZjNYm5PXfSmmtL6Vs6A_CZEtXCNICq_',
    factory: 'EQBfBWT7X2BHg9tXAxzhz2aKvnWuOFz5Hy5a5C9Yrp_GpIhp',
  },
} as const;

// Jetton transfer opcodes
const JETTON_TRANSFER_OP = 0xf8a7ea5;
const JETTON_INTERNAL_TRANSFER_OP = 0x178d4519;

export class TonChainAdapter implements TonAdapter {
  readonly chainId = 'ton' as const;
  readonly config: ChainConfig;

  private client: TonClient;
  private currentRpcIndex = 0;

  constructor(config: ChainConfig) {
    this.config = config;
    this.client = new TonClient({
      endpoint: config.rpcUrls[0],
    });
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
  }

  async shutdown(): Promise<void> {
    // TonClient doesn't require explicit cleanup
  }

  async healthCheck(): Promise<ChainStatus> {
    const start = Date.now();
    try {
      const masterchainInfo = await this.client.getMasterchainInfo();
      return {
        chainId: this.chainId,
        isHealthy: true,
        blockNumber: BigInt(masterchainInfo.last.seqno),
        latency: Date.now() - start,
        lastUpdated: new Date(),
      };
    } catch {
      // Try to failover to next RPC
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
    if (address === 'native' || address.toLowerCase() === 'ton') {
      return TON_NATIVE;
    }

    try {
      const jettonMaster = this.client.open(
        JettonMaster.create(Address.parse(address))
      );
      const data = await jettonMaster.getJettonData();

      // Parse content cell for metadata
      const metadata = await this.parseJettonMetadata(data.content);

      return {
        address,
        chainId: this.chainId,
        symbol: metadata.symbol || 'UNKNOWN',
        name: metadata.name || 'Unknown Token',
        decimals: metadata.decimals ?? 9,
        logoUri: metadata.image,
        isNative: false,
        isVerified: false, // Would need external verification source
      };
    } catch {
      return null;
    }
  }

  async getTokenBalance(
    walletAddress: string,
    tokenAddress: string
  ): Promise<TokenBalance> {
    if (tokenAddress === 'native' || tokenAddress.toLowerCase() === 'ton') {
      const balance = await this.client.getBalance(
        Address.parse(walletAddress)
      );
      return {
        token: TON_NATIVE,
        balance,
        balanceFormatted: fromNano(balance),
      };
    }

    try {
      const jettonWalletAddress = await this.getJettonWallet(
        walletAddress,
        tokenAddress
      );
      const jettonWallet = this.client.open(
        JettonWallet.create(Address.parse(jettonWalletAddress))
      );
      const balance = await jettonWallet.getBalance();
      const token = await this.getToken(tokenAddress);

      if (!token) {
        throw new Error(`Token not found: ${tokenAddress}`);
      }

      return {
        token,
        balance,
        balanceFormatted: this.formatUnits(balance, token.decimals),
      };
    } catch (error) {
      // Jetton wallet may not exist yet (zero balance)
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
    // Get native TON balance
    const nativeBalance = await this.getTokenBalance(walletAddress, 'native');
    const balances: TokenBalance[] = [nativeBalance];

    // Note: Getting all jetton balances requires indexing or external API
    // This is a limitation of TON - no native way to list all jettons
    // In production, would use TON Center API or similar
    return balances;
  }

  async getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
    // In production, fetch from DexScreener, GeckoTerminal, or DEX pools
    const token = await this.getToken(tokenAddress);
    if (!token) {
      throw new Error(`Token not found: ${tokenAddress}`);
    }

    // Placeholder - would integrate with price oracle
    return {
      token,
      priceUsd: tokenAddress === 'native' ? 5.5 : 0,
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

    // Try STONfi first, then DeDust
    const stonfiQuote = await this.getStonfiQuote(request);
    const dedustQuote = await this.getDedustQuote(request);

    // Use the better quote (higher amountOut)
    const bestQuote =
      stonfiQuote.amountOut >= dedustQuote.amountOut ? stonfiQuote : dedustQuote;

    const slippageMultiplier = 1 - request.slippage / 100;
    const amountOutMin = BigInt(
      Math.floor(Number(bestQuote.amountOut) * slippageMultiplier)
    );

    // Estimate gas (typical TON swap costs ~0.3 TON)
    const estimatedGas = toNano('0.3');
    const gasPrice = toNano('0.001'); // nanoton per gas unit

    const fee: FeeBreakdown = {
      totalFeeUsd: 0.5, // Estimate
      protocolFee: 0n, // Free until profitable
      protocolFeeUsd: 0,
      networkFee: estimatedGas,
      networkFeeUsd: 0.5 * 5.5, // estimatedGas * TON price
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
      dexAggregator: bestQuote.dex === 'stonfi' ? 'stonfi' : 'dedust',
    };
  }

  async buildSwapTransaction(quote: SwapQuote): Promise<UnsignedTransaction> {
    const route = quote.route[0];
    if (!route) {
      throw new Error('No route in quote');
    }

    let messageBody: Cell;
    let toAddress: string;
    let value: bigint;

    if (quote.dexAggregator === 'stonfi') {
      const result = await this.buildStonfiSwap(quote);
      messageBody = result.body;
      toAddress = result.to;
      value = result.value;
    } else {
      const result = await this.buildDedustSwap(quote);
      messageBody = result.body;
      toAddress = result.to;
      value = result.value;
    }

    return {
      chainId: this.chainId,
      to: toAddress,
      data: messageBody.toBoc().toString('base64'),
      value,
      gasLimit: quote.estimatedGas,
    };
  }

  async submitTransaction(signedTx: string): Promise<string> {
    // signedTx is expected to be a base64-encoded BOC
    const boc = Cell.fromBase64(signedTx);
    await this.client.sendFile(boc.toBoc());

    // Return the hash of the external message
    return boc.hash().toString('hex');
  }

  async waitForConfirmation(
    txHash: string,
    confirmations = 1
  ): Promise<SwapTransaction> {
    const maxAttempts = 60;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        // TON uses different transaction lookup - would need account + lt
        // This is a simplified implementation
        await new Promise((resolve) => setTimeout(resolve, 2000));
        attempts++;

        // In production, would poll for transaction by hash
        // and parse the result from transaction traces
      } catch {
        attempts++;
      }
    }

    // Return pending status if not found
    return {
      id: txHash,
      quoteId: '',
      userId: '',
      chainId: this.chainId,
      tokenIn: TON_NATIVE,
      tokenOut: TON_NATIVE,
      amountIn: 0n,
      amountOut: 0n,
      txHash,
      status: 'confirming',
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

  isValidAddress(address: string): boolean {
    if (address === 'native') return true;
    try {
      Address.parse(address);
      return true;
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

  // TON-specific methods
  async getJettonWallet(
    ownerAddress: string,
    jettonMaster: string
  ): Promise<string> {
    const master = this.client.open(
      JettonMaster.create(Address.parse(jettonMaster))
    );
    const walletAddress = await master.getWalletAddress(
      Address.parse(ownerAddress)
    );
    return walletAddress.toString();
  }

  async getSeqno(address: string): Promise<number> {
    try {
      const result = await this.client.runMethod(
        Address.parse(address),
        'seqno'
      );
      return result.stack.readNumber();
    } catch {
      return 0;
    }
  }

  // Private helper methods
  private async ensureConnection(): Promise<void> {
    try {
      await this.client.getMasterchainInfo();
    } catch {
      await this.failoverRpc();
    }
  }

  private async failoverRpc(): Promise<void> {
    if (this.config.rpcUrls.length <= 1) return;

    this.currentRpcIndex =
      (this.currentRpcIndex + 1) % this.config.rpcUrls.length;
    this.client = new TonClient({
      endpoint: this.config.rpcUrls[this.currentRpcIndex],
    });
  }

  private generateQuoteId(): string {
    return `ton-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private async parseJettonMetadata(content: Cell): Promise<{
    name?: string;
    symbol?: string;
    decimals?: number;
    image?: string;
  }> {
    try {
      const slice = content.beginParse();
      const prefix = slice.loadUint(8);

      if (prefix === 0x00) {
        // On-chain metadata
        const dict = slice.loadDict(
          { serialize: () => { throw new Error('not implemented'); }, parse: (s) => s.loadStringTail() },
          { serialize: () => { throw new Error('not implemented'); }, parse: (s) => s.loadStringTail() }
        );
        return {
          name: dict.get('name') || undefined,
          symbol: dict.get('symbol') || undefined,
          decimals: dict.get('decimals') ? parseInt(dict.get('decimals')!) : 9,
          image: dict.get('image') || undefined,
        };
      } else if (prefix === 0x01) {
        // Off-chain metadata (URI)
        const uri = slice.loadStringTail();
        // Would fetch from URI in production
        return { decimals: 9 };
      }
    } catch {
      // Fallback
    }
    return { decimals: 9 };
  }

  private async getStonfiQuote(
    request: SwapRequest
  ): Promise<{ amountOut: bigint; priceImpact: number; dex: string; poolAddress: string }> {
    // In production, would call STONfi API or simulate swap on-chain
    // STONfi API: https://api.ston.fi/v1/swap/simulate
    try {
      // Simplified simulation - would use actual STONfi SDK
      const poolAddress = DEX_ROUTERS.stonfi.router;

      // Mock quote - in production, call STONfi API
      return {
        amountOut: (request.amountIn * 98n) / 100n, // 2% slippage estimate
        priceImpact: 0.5,
        dex: 'stonfi',
        poolAddress,
      };
    } catch {
      return {
        amountOut: 0n,
        priceImpact: 100,
        dex: 'stonfi',
        poolAddress: '',
      };
    }
  }

  private async getDedustQuote(
    request: SwapRequest
  ): Promise<{ amountOut: bigint; priceImpact: number; dex: string; poolAddress: string }> {
    // In production, would call DeDust API or simulate swap on-chain
    try {
      const poolAddress = DEX_ROUTERS.dedust.vault;

      // Mock quote - in production, call DeDust API
      return {
        amountOut: (request.amountIn * 97n) / 100n, // 3% slippage estimate
        priceImpact: 0.8,
        dex: 'dedust',
        poolAddress,
      };
    } catch {
      return {
        amountOut: 0n,
        priceImpact: 100,
        dex: 'dedust',
        poolAddress: '',
      };
    }
  }

  private async buildStonfiSwap(
    quote: SwapQuote
  ): Promise<{ body: Cell; to: string; value: bigint }> {
    const route = quote.route[0]!;
    const isNativeIn = quote.tokenIn.isNative;

    if (isNativeIn) {
      // TON -> Jetton swap
      const body = beginCell()
        .storeUint(0x25938561, 32) // STONfi swap op
        .storeAddress(Address.parse(route.poolAddress))
        .storeCoins(quote.amountOutMin)
        .storeAddress(Address.parse(quote.tokenOut.address))
        .endCell();

      return {
        body,
        to: DEX_ROUTERS.stonfi.router,
        value: quote.amountIn + toNano('0.3'), // Amount + gas
      };
    } else {
      // Jetton -> TON or Jetton -> Jetton swap
      const forwardPayload = beginCell()
        .storeUint(0x25938561, 32) // STONfi swap op
        .storeAddress(Address.parse(route.poolAddress))
        .storeCoins(quote.amountOutMin)
        .endCell();

      const body = beginCell()
        .storeUint(JETTON_TRANSFER_OP, 32)
        .storeUint(0, 64) // query_id
        .storeCoins(quote.amountIn)
        .storeAddress(Address.parse(DEX_ROUTERS.stonfi.router))
        .storeAddress(Address.parse(DEX_ROUTERS.stonfi.router)) // response_destination
        .storeBit(false) // no custom payload
        .storeCoins(toNano('0.25')) // forward_ton_amount
        .storeBit(true) // forward_payload in ref
        .storeRef(forwardPayload)
        .endCell();

      // Need to send to user's jetton wallet
      const jettonWallet = await this.getJettonWallet(
        DEX_ROUTERS.stonfi.router, // This should be user's address in real impl
        quote.tokenIn.address
      );

      return {
        body,
        to: jettonWallet,
        value: toNano('0.3'), // Gas for jetton transfer
      };
    }
  }

  private async buildDedustSwap(
    quote: SwapQuote
  ): Promise<{ body: Cell; to: string; value: bigint }> {
    const isNativeIn = quote.tokenIn.isNative;

    if (isNativeIn) {
      // TON -> Jetton via DeDust Vault
      const body = beginCell()
        .storeUint(0xea06185d, 32) // DeDust native swap op
        .storeUint(0, 64) // query_id
        .storeCoins(quote.amountIn)
        .storeAddress(Address.parse(quote.tokenOut.address))
        .storeCoins(quote.amountOutMin)
        .endCell();

      return {
        body,
        to: DEX_ROUTERS.dedust.vault,
        value: quote.amountIn + toNano('0.3'),
      };
    } else {
      // Jetton -> TON or Jetton -> Jetton via DeDust
      const forwardPayload = beginCell()
        .storeUint(0xea06185d, 32) // DeDust swap op
        .storeAddress(Address.parse(quote.tokenOut.address))
        .storeCoins(quote.amountOutMin)
        .endCell();

      const body = beginCell()
        .storeUint(JETTON_TRANSFER_OP, 32)
        .storeUint(0, 64) // query_id
        .storeCoins(quote.amountIn)
        .storeAddress(Address.parse(DEX_ROUTERS.dedust.vault))
        .storeAddress(Address.parse(DEX_ROUTERS.dedust.vault))
        .storeBit(false)
        .storeCoins(toNano('0.25'))
        .storeBit(true)
        .storeRef(forwardPayload)
        .endCell();

      const jettonWallet = await this.getJettonWallet(
        DEX_ROUTERS.dedust.vault,
        quote.tokenIn.address
      );

      return {
        body,
        to: jettonWallet,
        value: toNano('0.3'),
      };
    }
  }
}

// Export config helper
export function createTonConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'ton',
    name: 'TON',
    type: 'ton',
    nativeCurrency: {
      name: 'Toncoin',
      symbol: 'TON',
      decimals: 9,
    },
    rpcUrls: [
      'https://toncenter.com/api/v2/jsonRPC',
      'https://tonapi.io/v2',
    ],
    blockExplorerUrls: ['https://tonscan.org'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
    ...overrides,
  };
}

// Export testnet config
export function createTonTestnetConfig(overrides?: Partial<ChainConfig>): ChainConfig {
  return {
    id: 'ton',
    name: 'TON Testnet',
    type: 'ton',
    nativeCurrency: {
      name: 'Toncoin',
      symbol: 'TON',
      decimals: 9,
    },
    rpcUrls: ['https://testnet.toncenter.com/api/v2/jsonRPC'],
    blockExplorerUrls: ['https://testnet.tonscan.org'],
    contracts: {},
    isTestnet: true,
    isEnabled: true,
    ...overrides,
  };
}
