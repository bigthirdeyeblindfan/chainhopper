import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  SuiChainAdapter,
  createSuiConfig,
  createSuiTestnetConfig,
  createSuiDevnetConfig,
  SUI_COIN_TYPES,
} from '../sui/index.js';
import type { SwapRequest } from '@chainhopper/types';

// Mock the SuiClient
vi.mock('@mysten/sui/client', () => ({
  SuiClient: vi.fn().mockImplementation(() => ({
    getLatestCheckpointSequenceNumber: vi.fn().mockResolvedValue('1000'),
    getCoinMetadata: vi.fn().mockResolvedValue({
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      iconUrl: 'https://example.com/usdc.png',
    }),
    getBalance: vi.fn().mockResolvedValue({
      totalBalance: '1000000000',
      coinType: '0x2::sui::SUI',
    }),
    getAllBalances: vi.fn().mockResolvedValue([
      {
        totalBalance: '1000000000',
        coinType: '0x2::sui::SUI',
      },
      {
        totalBalance: '500000000',
        coinType: SUI_COIN_TYPES.USDC,
      },
    ]),
    getCoins: vi.fn().mockResolvedValue({
      data: [
        {
          coinObjectId: '0x123',
          coinType: '0x2::sui::SUI',
          balance: '500000000',
        },
        {
          coinObjectId: '0x456',
          coinType: '0x2::sui::SUI',
          balance: '500000000',
        },
      ],
    }),
    waitForTransaction: vi.fn().mockResolvedValue({
      digest: '0xabc123',
      effects: {
        status: { status: 'success' },
        gasUsed: { computationCost: '1000000' },
      },
    }),
    executeTransactionBlock: vi.fn().mockResolvedValue({
      digest: '0xabc123',
    }),
  })),
  getFullnodeUrl: vi.fn().mockReturnValue('https://fullnode.mainnet.sui.io:443'),
}));

vi.mock('@mysten/sui/transactions', () => ({
  Transaction: vi.fn().mockImplementation(() => ({
    object: vi.fn().mockReturnValue({}),
    mergeCoins: vi.fn(),
    moveCall: vi.fn(),
    setGasBudget: vi.fn(),
    serialize: vi.fn().mockReturnValue('serialized_tx'),
    pure: {
      u64: vi.fn().mockReturnValue({}),
      bool: vi.fn().mockReturnValue({}),
    },
  })),
  TransactionBlock: vi.fn(),
}));

describe('SuiChainAdapter', () => {
  let adapter: SuiChainAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new SuiChainAdapter(createSuiConfig());
  });

  describe('config helpers', () => {
    it('should create mainnet config', () => {
      const config = createSuiConfig();
      expect(config.id).toBe('sui');
      expect(config.type).toBe('sui');
      expect(config.nativeCurrency.symbol).toBe('SUI');
      expect(config.isTestnet).toBe(false);
    });

    it('should create testnet config', () => {
      const config = createSuiTestnetConfig();
      expect(config.id).toBe('sui');
      expect(config.isTestnet).toBe(true);
      expect(config.rpcUrls[0]).toContain('testnet');
    });

    it('should create devnet config', () => {
      const config = createSuiDevnetConfig();
      expect(config.id).toBe('sui');
      expect(config.isTestnet).toBe(true);
      expect(config.rpcUrls[0]).toContain('devnet');
    });

    it('should allow config overrides', () => {
      const config = createSuiConfig({
        isEnabled: false,
        rpcUrls: ['https://custom-rpc.example.com'],
      });
      expect(config.isEnabled).toBe(false);
      expect(config.rpcUrls[0]).toBe('https://custom-rpc.example.com');
    });
  });

  describe('initialization', () => {
    it('should have correct chainId', () => {
      expect(adapter.chainId).toBe('sui');
    });

    it('should initialize without errors', async () => {
      await expect(adapter.initialize()).resolves.toBeUndefined();
    });

    it('should shutdown without errors', async () => {
      await expect(adapter.shutdown()).resolves.toBeUndefined();
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const status = await adapter.healthCheck();

      expect(status.chainId).toBe('sui');
      expect(status.isHealthy).toBe(true);
      expect(status.blockNumber).toBe(1000n);
      expect(status.latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getToken', () => {
    it('should return SUI native token', async () => {
      const token = await adapter.getToken('native');

      expect(token).toBeDefined();
      expect(token?.symbol).toBe('SUI');
      expect(token?.decimals).toBe(9);
      expect(token?.isNative).toBe(true);
    });

    it('should return SUI for 0x2::sui::SUI', async () => {
      const token = await adapter.getToken('0x2::sui::SUI');

      expect(token).toBeDefined();
      expect(token?.symbol).toBe('SUI');
      expect(token?.isNative).toBe(true);
    });

    it('should return token metadata for other coins', async () => {
      const token = await adapter.getToken(SUI_COIN_TYPES.USDC);

      expect(token).toBeDefined();
      expect(token?.symbol).toBe('USDC');
      expect(token?.decimals).toBe(6);
    });
  });

  describe('getTokenBalance', () => {
    it('should return native SUI balance', async () => {
      const balance = await adapter.getTokenBalance(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        'native'
      );

      expect(balance.token.symbol).toBe('SUI');
      expect(balance.balance).toBe(1000000000n);
      expect(balance.balanceFormatted).toBe('1');
    });
  });

  describe('getTokenBalances', () => {
    it('should return all token balances', async () => {
      const balances = await adapter.getTokenBalances(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
      );

      expect(balances.length).toBeGreaterThanOrEqual(1);
      expect(balances[0].token.symbol).toBe('SUI');
    });
  });

  describe('getQuote', () => {
    it('should return quote with best DEX', async () => {
      const request: SwapRequest = {
        chainId: 'sui',
        tokenIn: '0x2::sui::SUI',
        tokenOut: SUI_COIN_TYPES.USDC,
        amountIn: 1000000000n, // 1 SUI
        slippage: 0.5,
      };

      const quote = await adapter.getQuote(request);

      expect(quote.id).toMatch(/^sui-/);
      expect(quote.chainId).toBe('sui');
      expect(quote.tokenIn.symbol).toBe('SUI');
      expect(quote.amountIn).toBe(1000000000n);
      expect(quote.amountOut).toBeGreaterThan(0n);
      expect(quote.route.length).toBe(1);
      expect(['cetus', 'turbos']).toContain(quote.dexAggregator);
    });

    it('should apply slippage to amountOutMin', async () => {
      const request: SwapRequest = {
        chainId: 'sui',
        tokenIn: '0x2::sui::SUI',
        tokenOut: SUI_COIN_TYPES.USDC,
        amountIn: 1000000000n,
        slippage: 1.0,
      };

      const quote = await adapter.getQuote(request);

      // amountOutMin should be less than amountOut due to slippage
      expect(quote.amountOutMin).toBeLessThan(quote.amountOut);
    });
  });

  describe('buildSwapTransaction', () => {
    it('should build swap transaction', async () => {
      const request: SwapRequest = {
        chainId: 'sui',
        tokenIn: '0x2::sui::SUI',
        tokenOut: SUI_COIN_TYPES.USDC,
        amountIn: 1000000000n,
        slippage: 0.5,
      };

      const quote = await adapter.getQuote(request);
      const tx = await adapter.buildSwapTransaction(quote);

      expect(tx.chainId).toBe('sui');
      expect(tx.to).toBeDefined();
      expect(tx.data).toBeDefined();
    });
  });

  describe('waitForConfirmation', () => {
    it('should return confirmed transaction', async () => {
      const result = await adapter.waitForConfirmation('0xabc123');

      expect(result.txHash).toBe('0xabc123');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('address validation', () => {
    it('should validate native address', () => {
      expect(adapter.isValidAddress('native')).toBe(true);
    });

    it('should validate Sui addresses', () => {
      expect(
        adapter.isValidAddress(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
        )
      ).toBe(true);
    });

    it('should validate coin types', () => {
      expect(adapter.isValidAddress('0x2::sui::SUI')).toBe(false); // Not a valid object address format
      expect(
        adapter.isValidAddress(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef::coin::COIN'
        )
      ).toBe(true);
    });

    it('should reject invalid addresses', () => {
      expect(adapter.isValidAddress('invalid')).toBe(false);
      expect(adapter.isValidAddress('0x123')).toBe(false);
    });
  });

  describe('unit conversion', () => {
    it('should format units correctly', () => {
      expect(adapter.formatUnits(1000000000n, 9)).toBe('1');
      expect(adapter.formatUnits(1500000000n, 9)).toBe('1.5');
      expect(adapter.formatUnits(1234567890n, 9)).toBe('1.23456789');
    });

    it('should parse units correctly', () => {
      expect(adapter.parseUnits('1', 9)).toBe(1000000000n);
      expect(adapter.parseUnits('1.5', 9)).toBe(1500000000n);
      expect(adapter.parseUnits('0.123456789', 9)).toBe(123456789n);
    });
  });

  describe('Sui-specific methods', () => {
    it('should get coins for address', async () => {
      const coins = await adapter.getCoins(
        '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        '0x2::sui::SUI'
      );

      expect(coins.length).toBe(2);
      expect(coins[0].objectId).toBe('0x123');
      expect(coins[0].balance).toBe(500000000n);
    });

    it('should merge coins', async () => {
      const coins = [
        { objectId: '0x123', coinType: '0x2::sui::SUI', balance: 500n },
        { objectId: '0x456', coinType: '0x2::sui::SUI', balance: 500n },
      ];

      const txData = await adapter.mergeCoins(coins);
      expect(txData).toBeDefined();
    });

    it('should throw when merging less than 2 coins', async () => {
      const coins = [{ objectId: '0x123', coinType: '0x2::sui::SUI', balance: 500n }];

      await expect(adapter.mergeCoins(coins)).rejects.toThrow('Need at least 2 coins');
    });
  });
});

describe('SUI_COIN_TYPES', () => {
  it('should have correct coin type constants', () => {
    expect(SUI_COIN_TYPES.SUI).toBe('0x2::sui::SUI');
    expect(SUI_COIN_TYPES.USDC).toBeDefined();
    expect(SUI_COIN_TYPES.USDT).toBeDefined();
    expect(SUI_COIN_TYPES.WETH).toBeDefined();
  });
});
