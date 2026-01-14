import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ChainConfig } from '@chainhopper/types';

// Mock @ton/ton before importing the adapter
vi.mock('@ton/ton', () => ({
  TonClient: vi.fn().mockImplementation(() => ({
    getMasterchainInfo: vi.fn().mockResolvedValue({
      last: { seqno: 12345678 },
    }),
    getBalance: vi.fn().mockResolvedValue(1000000000n), // 1 TON
    open: vi.fn().mockReturnValue({
      getJettonData: vi.fn().mockResolvedValue({
        content: {
          beginParse: vi.fn().mockReturnValue({
            loadUint: vi.fn().mockReturnValue(0x01),
            loadStringTail: vi.fn().mockReturnValue('https://example.com/metadata.json'),
          }),
        },
      }),
      getWalletAddress: vi.fn().mockResolvedValue({
        toString: vi.fn().mockReturnValue('EQTest...'),
      }),
      getBalance: vi.fn().mockResolvedValue(500000000n),
    }),
    runMethod: vi.fn().mockResolvedValue({
      stack: { readNumber: vi.fn().mockReturnValue(42) },
    }),
    sendFile: vi.fn().mockResolvedValue(undefined),
  })),
  Address: {
    parse: vi.fn().mockImplementation((addr: string) => {
      if (addr === 'invalid') throw new Error('Invalid address');
      return { toString: () => addr };
    }),
  },
  fromNano: vi.fn().mockImplementation((value: bigint) => (Number(value) / 1e9).toString()),
  toNano: vi.fn().mockImplementation((value: string) => BigInt(Math.floor(parseFloat(value) * 1e9))),
  JettonMaster: { create: vi.fn().mockReturnValue({}) },
  JettonWallet: { create: vi.fn().mockReturnValue({}) },
  WalletContractV4: vi.fn(),
  beginCell: vi.fn().mockReturnValue({
    storeUint: vi.fn().mockReturnThis(),
    storeAddress: vi.fn().mockReturnThis(),
    storeCoins: vi.fn().mockReturnThis(),
    storeBit: vi.fn().mockReturnThis(),
    storeRef: vi.fn().mockReturnThis(),
    endCell: vi.fn().mockReturnValue({
      toBoc: vi.fn().mockReturnValue(Buffer.from('test')),
    }),
  }),
  Cell: {
    fromBase64: vi.fn().mockReturnValue({
      toBoc: vi.fn().mockReturnValue(Buffer.from('test')),
      hash: vi.fn().mockReturnValue(Buffer.from('testhash')),
    }),
  },
}));

import { TonChainAdapter, createTonConfig, createTonTestnetConfig } from '../ton/index.js';

describe('TON Adapter', () => {
  let adapter: TonChainAdapter;
  const mockConfig: ChainConfig = {
    id: 'ton',
    name: 'TON',
    type: 'ton',
    nativeCurrency: {
      name: 'Toncoin',
      symbol: 'TON',
      decimals: 9,
    },
    rpcUrls: ['https://toncenter.com/api/v2/jsonRPC'],
    blockExplorerUrls: ['https://tonscan.org'],
    contracts: {},
    isTestnet: false,
    isEnabled: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = new TonChainAdapter(mockConfig);
  });

  describe('constructor', () => {
    it('should create adapter with config', () => {
      expect(adapter.chainId).toBe('ton');
      expect(adapter.config.name).toBe('TON');
    });
  });

  describe('isValidAddress', () => {
    it('should return true for native keyword', () => {
      expect(adapter.isValidAddress('native')).toBe(true);
    });

    it('should return true for valid TON addresses', () => {
      expect(adapter.isValidAddress('EQB3ncyBUTjZUA5EnFKR5_EnOMI9V1tTEAAPaiU71gc4TiUt')).toBe(true);
    });

    it('should return false for invalid addresses', () => {
      expect(adapter.isValidAddress('invalid')).toBe(false);
    });
  });

  describe('formatUnits', () => {
    it('should format nanoton to TON correctly', () => {
      expect(adapter.formatUnits(1000000000n, 9)).toBe('1');
      expect(adapter.formatUnits(1500000000n, 9)).toBe('1.5');
      expect(adapter.formatUnits(100n, 9)).toBe('0.0000001');
    });

    it('should handle zero values', () => {
      expect(adapter.formatUnits(0n, 9)).toBe('0');
    });

    it('should trim trailing zeros', () => {
      expect(adapter.formatUnits(1100000000n, 9)).toBe('1.1');
    });
  });

  describe('parseUnits', () => {
    it('should parse TON to nanoton correctly', () => {
      expect(adapter.parseUnits('1', 9)).toBe(1000000000n);
      expect(adapter.parseUnits('1.5', 9)).toBe(1500000000n);
    });

    it('should handle integer values', () => {
      expect(adapter.parseUnits('10', 9)).toBe(10000000000n);
    });

    it('should truncate excess decimals', () => {
      expect(adapter.parseUnits('1.0000000001', 9)).toBe(1000000000n);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status when connected', async () => {
      const status = await adapter.healthCheck();

      expect(status.chainId).toBe('ton');
      expect(status.isHealthy).toBe(true);
      expect(status.blockNumber).toBe(12345678n);
      expect(status.latency).toBeGreaterThanOrEqual(0);
      expect(status.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('getToken', () => {
    it('should return native token for native keyword', async () => {
      const token = await adapter.getToken('native');

      expect(token).not.toBeNull();
      expect(token?.symbol).toBe('TON');
      expect(token?.decimals).toBe(9);
      expect(token?.isNative).toBe(true);
    });

    it('should return native token for ton keyword', async () => {
      const token = await adapter.getToken('ton');

      expect(token).not.toBeNull();
      expect(token?.symbol).toBe('TON');
    });
  });
});

describe('TON Config Helpers', () => {
  describe('createTonConfig', () => {
    it('should create mainnet config with defaults', () => {
      const config = createTonConfig();

      expect(config.id).toBe('ton');
      expect(config.name).toBe('TON');
      expect(config.type).toBe('ton');
      expect(config.nativeCurrency.symbol).toBe('TON');
      expect(config.nativeCurrency.decimals).toBe(9);
      expect(config.isTestnet).toBe(false);
      expect(config.isEnabled).toBe(true);
      expect(config.rpcUrls.length).toBeGreaterThan(0);
    });

    it('should allow overriding config values', () => {
      const config = createTonConfig({
        name: 'Custom TON',
        isEnabled: false,
      });

      expect(config.name).toBe('Custom TON');
      expect(config.isEnabled).toBe(false);
      expect(config.id).toBe('ton');
    });
  });

  describe('createTonTestnetConfig', () => {
    it('should create testnet config', () => {
      const config = createTonTestnetConfig();

      expect(config.id).toBe('ton');
      expect(config.name).toBe('TON Testnet');
      expect(config.isTestnet).toBe(true);
      expect(config.rpcUrls[0]).toContain('testnet');
      expect(config.blockExplorerUrls[0]).toContain('testnet');
    });
  });
});
