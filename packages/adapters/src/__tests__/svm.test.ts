import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EclipseAdapter,
  createEclipseConfig,
  createEclipseTestnetConfig,
  createEclipseDevnetConfig,
  ECLIPSE_TOKENS,
} from '../svm/index.js';
import type { SwapRequest } from '@chainhopper/types';

// Mock the Solana web3.js
vi.mock('@solana/web3.js', () => ({
  Connection: vi.fn().mockImplementation(() => ({
    getSlot: vi.fn().mockResolvedValue(1000),
    getBalance: vi.fn().mockResolvedValue(1000000000),
    getTokenAccountBalance: vi.fn().mockResolvedValue({
      value: {
        amount: '1000000000',
        decimals: 9,
        uiAmountString: '1',
      },
    }),
    getParsedTokenAccountsByOwner: vi.fn().mockResolvedValue({
      value: [
        {
          account: {
            data: {
              parsed: {
                info: {
                  mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
                  owner: 'owner123',
                  tokenAmount: {
                    amount: '1000000000',
                    decimals: 6,
                    uiAmountString: '1000',
                  },
                },
              },
            },
          },
        },
      ],
    }),
    confirmTransaction: vi.fn().mockResolvedValue({ value: { err: null } }),
    getTransaction: vi.fn().mockResolvedValue({
      meta: { fee: 5000 },
    }),
    sendTransaction: vi.fn().mockResolvedValue('tx_signature_123'),
    sendRawTransaction: vi.fn().mockResolvedValue('tx_signature_123'),
    simulateTransaction: vi.fn().mockResolvedValue({
      value: {
        err: null,
        logs: ['Program log: Success'],
        unitsConsumed: 150000,
      },
    }),
    getLatestBlockhash: vi.fn().mockResolvedValue({
      blockhash: 'blockhash123',
      lastValidBlockHeight: 1000,
    }),
  })),
  PublicKey: vi.fn().mockImplementation((key) => ({
    toBase58: () => key,
    toString: () => key,
  })),
  Transaction: vi.fn().mockImplementation(() => ({})),
  VersionedTransaction: {
    deserialize: vi.fn().mockReturnValue({}),
  },
  LAMPORTS_PER_SOL: 1000000000,
  SystemProgram: {
    programId: {
      toBase58: () => '11111111111111111111111111111111',
    },
  },
}));

// Mock SPL token
vi.mock('@solana/spl-token', () => ({
  TOKEN_PROGRAM_ID: { toBase58: () => 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
  getAssociatedTokenAddress: vi.fn().mockResolvedValue({
    toBase58: () => 'ata_address_123',
  }),
  getMint: vi.fn().mockResolvedValue({
    decimals: 6,
    supply: 1000000000000n,
  }),
}));

// Mock fetch for Jupiter API
global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        outAmount: '997000000',
        priceImpactPct: 0.3,
        routePlan: [
          {
            swapInfo: {
              label: 'Raydium',
              ammKey: 'pool123',
              inputMint: 'input_mint',
              outputMint: 'output_mint',
            },
            percent: 100,
          },
        ],
      }),
  })
);

describe('EclipseAdapter', () => {
  let adapter: EclipseAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new EclipseAdapter(createEclipseConfig());
  });

  describe('config helpers', () => {
    it('should create mainnet config', () => {
      const config = createEclipseConfig();
      expect(config.id).toBe('eclipse');
      expect(config.type).toBe('svm');
      expect(config.nativeCurrency.symbol).toBe('ETH');
      expect(config.isTestnet).toBe(false);
    });

    it('should create testnet config', () => {
      const config = createEclipseTestnetConfig();
      expect(config.id).toBe('eclipse');
      expect(config.isTestnet).toBe(true);
    });

    it('should create devnet config', () => {
      const config = createEclipseDevnetConfig();
      expect(config.id).toBe('eclipse');
      expect(config.isTestnet).toBe(true);
    });

    it('should allow config overrides', () => {
      const config = createEclipseConfig({
        isEnabled: false,
        rpcUrls: ['https://custom-rpc.example.com'],
      });
      expect(config.isEnabled).toBe(false);
      expect(config.rpcUrls[0]).toBe('https://custom-rpc.example.com');
    });
  });

  describe('initialization', () => {
    it('should have correct chainId', () => {
      expect(adapter.chainId).toBe('eclipse');
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

      expect(status.chainId).toBe('eclipse');
      expect(status.isHealthy).toBe(true);
      expect(status.blockNumber).toBe(1000n);
      expect(status.latency).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getToken', () => {
    it('should return native ETH token', async () => {
      const token = await adapter.getToken('native');

      expect(token).toBeDefined();
      expect(token?.symbol).toBe('ETH');
      expect(token?.decimals).toBe(9);
      expect(token?.isNative).toBe(true);
    });

    it('should return token metadata for SPL tokens', async () => {
      const token = await adapter.getToken(ECLIPSE_TOKENS.USDC);

      expect(token).toBeDefined();
      expect(token?.symbol).toBe('USDC');
      expect(token?.decimals).toBe(6);
    });
  });

  describe('getTokenBalance', () => {
    it('should return native ETH balance', async () => {
      const balance = await adapter.getTokenBalance(
        '5FHwkrdxNm6BgMpA4bPAjJ3E6LgPBDwSQPNqKKFsKxZU',
        'native'
      );

      expect(balance.token.symbol).toBe('ETH');
      expect(balance.balance).toBe(1000000000n);
      expect(balance.balanceFormatted).toBe('1');
    });
  });

  describe('getTokenBalances', () => {
    it('should return all token balances', async () => {
      const balances = await adapter.getTokenBalances(
        '5FHwkrdxNm6BgMpA4bPAjJ3E6LgPBDwSQPNqKKFsKxZU'
      );

      expect(balances.length).toBeGreaterThanOrEqual(1);
      expect(balances[0].token.symbol).toBe('ETH');
    });
  });

  describe('getQuote', () => {
    it('should return quote from Jupiter', async () => {
      const request: SwapRequest = {
        chainId: 'eclipse',
        tokenIn: 'native',
        tokenOut: ECLIPSE_TOKENS.USDC,
        amountIn: 1000000000n, // 1 ETH
        slippage: 0.5,
      };

      const quote = await adapter.getQuote(request);

      expect(quote.id).toMatch(/^eclipse-/);
      expect(quote.chainId).toBe('eclipse');
      expect(quote.tokenIn.symbol).toBe('ETH');
      expect(quote.amountIn).toBe(1000000000n);
      expect(quote.amountOut).toBeGreaterThan(0n);
      expect(quote.dexAggregator).toBe('jupiter');
    });

    it('should apply slippage to amountOutMin', async () => {
      const request: SwapRequest = {
        chainId: 'eclipse',
        tokenIn: 'native',
        tokenOut: ECLIPSE_TOKENS.USDC,
        amountIn: 1000000000n,
        slippage: 1.0,
      };

      const quote = await adapter.getQuote(request);

      expect(quote.amountOutMin).toBeLessThan(quote.amountOut);
    });
  });

  describe('buildSwapTransaction', () => {
    it('should build swap transaction', async () => {
      const request: SwapRequest = {
        chainId: 'eclipse',
        tokenIn: 'native',
        tokenOut: ECLIPSE_TOKENS.USDC,
        amountIn: 1000000000n,
        slippage: 0.5,
      };

      const quote = await adapter.getQuote(request);
      const tx = await adapter.buildSwapTransaction(quote);

      expect(tx.chainId).toBe('eclipse');
      expect(tx.data).toBeDefined();
    });
  });

  describe('waitForConfirmation', () => {
    it('should return confirmed transaction', async () => {
      const result = await adapter.waitForConfirmation('tx_signature_123');

      expect(result.txHash).toBe('tx_signature_123');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('address validation', () => {
    it('should validate native address', () => {
      expect(adapter.isValidAddress('native')).toBe(true);
    });

    it('should validate Solana-style addresses', () => {
      expect(
        adapter.isValidAddress('5FHwkrdxNm6BgMpA4bPAjJ3E6LgPBDwSQPNqKKFsKxZU')
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
    });

    it('should parse units correctly', () => {
      expect(adapter.parseUnits('1', 9)).toBe(1000000000n);
      expect(adapter.parseUnits('1.5', 9)).toBe(1500000000n);
    });
  });

  describe('SVM-specific methods', () => {
    it('should get token accounts', async () => {
      const accounts = await adapter.getTokenAccounts(
        '5FHwkrdxNm6BgMpA4bPAjJ3E6LgPBDwSQPNqKKFsKxZU'
      );

      expect(accounts.length).toBeGreaterThan(0);
      expect(accounts[0].mint).toBeDefined();
      expect(accounts[0].amount).toBeGreaterThan(0n);
    });

    it('should get recent blockhash', async () => {
      const blockhash = await adapter.getRecentBlockhash();

      expect(blockhash).toBe('blockhash123');
    });

    it('should simulate transaction', async () => {
      const result = await adapter.simulateTransaction('base64_tx_data');

      expect(result.success).toBe(true);
      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.unitsConsumed).toBe(150000);
    });
  });
});

describe('ECLIPSE_TOKENS', () => {
  it('should have correct token constants', () => {
    expect(ECLIPSE_TOKENS.ETH).toBe('native');
    expect(ECLIPSE_TOKENS.USDC).toBeDefined();
    expect(ECLIPSE_TOKENS.USDT).toBeDefined();
    expect(ECLIPSE_TOKENS.SOL).toBeDefined();
  });
});
