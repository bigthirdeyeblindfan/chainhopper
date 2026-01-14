// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PriceOracleService, createPriceOracle } from './service.js';
import type { PriceData, PriceProvider, OracleConfig } from './types.js';
import type { ChainId } from '@chainhopper/types';

// Mock provider factory
function createMockProvider(
  name: string,
  priority: number,
  supportedChains: ChainId[],
  priceData?: Partial<PriceData>
): PriceProvider {
  const defaultPrice: PriceData = {
    tokenAddress: '0x1234',
    chainId: 'ethereum',
    priceUsd: 100,
    confidence: 0.95,
    source: 'chainlink',
    timestamp: new Date(),
    ...priceData,
  };

  return {
    name: name as any,
    priority,
    getPrice: vi.fn().mockResolvedValue(defaultPrice),
    getPrices: vi.fn().mockResolvedValue(new Map([['ethereum:0x1234', defaultPrice]])),
    supportsChain: vi.fn((chainId: ChainId) => supportedChains.includes(chainId)),
    supportsToken: vi.fn().mockResolvedValue(true),
  };
}

describe('PriceOracleService', () => {
  let service: PriceOracleService;
  let mockConfig: OracleConfig;

  beforeEach(() => {
    mockConfig = {
      cacheTtl: 30000,
      maxPriceAge: 300000,
      minConfidence: 0.3,
      providers: {},
    };
    vi.clearAllMocks();
  });

  describe('getPrice', () => {
    it('should return null when no providers are configured', async () => {
      service = new PriceOracleService(mockConfig);
      const result = await service.getPrice('0x1234', 'ethereum');
      expect(result).toBeNull();
    });

    it('should cache valid prices', async () => {
      const mockProvider = createMockProvider('chainlink', 1, ['ethereum']);

      // Create service with mocked providers
      mockConfig.providers.chainlink = {
        rpcUrls: { ethereum: 'https://eth.example.com' },
        feedAddresses: {},
      };
      service = new PriceOracleService(mockConfig);
      // Override providers for testing
      (service as any).providers = [mockProvider];

      // First call
      await service.getPrice('0x1234', 'ethereum');
      expect(mockProvider.getPrice).toHaveBeenCalledTimes(1);

      // Second call should use cache
      await service.getPrice('0x1234', 'ethereum');
      expect(mockProvider.getPrice).toHaveBeenCalledTimes(1);
    });

    it('should skip providers that dont support the chain', async () => {
      const ethProvider = createMockProvider('chainlink', 1, ['ethereum']);
      const tonProvider = createMockProvider('dexscreener', 2, ['ton']);

      mockConfig.providers.chainlink = {
        rpcUrls: { ethereum: 'https://eth.example.com' },
        feedAddresses: {},
      };
      service = new PriceOracleService(mockConfig);
      (service as any).providers = [ethProvider, tonProvider];

      await service.getPrice('0x1234', 'ton');

      expect(ethProvider.getPrice).not.toHaveBeenCalled();
      expect(tonProvider.getPrice).toHaveBeenCalledWith('0x1234', 'ton');
    });

    it('should fall back to next provider on failure', async () => {
      const failingProvider = createMockProvider('chainlink', 1, ['ethereum']);
      (failingProvider.getPrice as any).mockRejectedValue(new Error('API Error'));

      const backupProvider = createMockProvider('dexscreener', 2, ['ethereum']);

      mockConfig.providers.chainlink = {
        rpcUrls: { ethereum: 'https://eth.example.com' },
        feedAddresses: {},
      };
      service = new PriceOracleService(mockConfig);
      (service as any).providers = [failingProvider, backupProvider];

      const result = await service.getPrice('0x1234', 'ethereum');

      expect(failingProvider.getPrice).toHaveBeenCalled();
      expect(backupProvider.getPrice).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.priceUsd).toBe(100);
    });

    it('should reject prices with confidence below threshold', async () => {
      const lowConfProvider = createMockProvider('chainlink', 1, ['ethereum'], {
        confidence: 0.1, // Below minConfidence of 0.3
      });

      const goodProvider = createMockProvider('dexscreener', 2, ['ethereum'], {
        confidence: 0.8,
      });

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [lowConfProvider, goodProvider];

      const result = await service.getPrice('0x1234', 'ethereum');

      expect(result?.confidence).toBe(0.8);
    });

    it('should reject stale prices', async () => {
      const staleProvider = createMockProvider('chainlink', 1, ['ethereum'], {
        timestamp: new Date(Date.now() - 600000), // 10 minutes old (exceeds 5 min maxPriceAge)
      });

      const freshProvider = createMockProvider('dexscreener', 2, ['ethereum'], {
        timestamp: new Date(),
      });

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [staleProvider, freshProvider];

      const result = await service.getPrice('0x1234', 'ethereum');

      expect(freshProvider.getPrice).toHaveBeenCalled();
    });

    it('should reject prices with zero or negative values', async () => {
      const zeroProvider = createMockProvider('chainlink', 1, ['ethereum'], {
        priceUsd: 0,
      });

      const validProvider = createMockProvider('dexscreener', 2, ['ethereum'], {
        priceUsd: 50,
      });

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [zeroProvider, validProvider];

      const result = await service.getPrice('0x1234', 'ethereum');

      expect(result?.priceUsd).toBe(50);
    });
  });

  describe('getPrices (batch)', () => {
    it('should return cached prices without calling providers', async () => {
      const mockProvider = createMockProvider('chainlink', 1, ['ethereum']);

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [mockProvider];

      // Warm up cache
      await service.getPrice('0x1234', 'ethereum');

      // Batch call should use cache
      const results = await service.getPrices([{ address: '0x1234', chainId: 'ethereum' }]);

      expect(results.size).toBe(1);
      // Provider was only called once (during warmup)
      expect(mockProvider.getPrice).toHaveBeenCalledTimes(1);
    });

    it('should batch fetch uncached tokens', async () => {
      const mockProvider = createMockProvider('chainlink', 1, ['ethereum', 'base']);
      const batchPrices = new Map<string, PriceData>([
        ['ethereum:0x1234', {
          tokenAddress: '0x1234',
          chainId: 'ethereum',
          priceUsd: 100,
          confidence: 0.95,
          source: 'chainlink',
          timestamp: new Date(),
        }],
        ['base:0x5678', {
          tokenAddress: '0x5678',
          chainId: 'base',
          priceUsd: 200,
          confidence: 0.90,
          source: 'chainlink',
          timestamp: new Date(),
        }],
      ]);
      (mockProvider.getPrices as any).mockResolvedValue(batchPrices);

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [mockProvider];

      const tokens = [
        { address: '0x1234', chainId: 'ethereum' as ChainId },
        { address: '0x5678', chainId: 'base' as ChainId },
      ];

      const results = await service.getPrices(tokens);

      expect(results.size).toBe(2);
      expect(mockProvider.getPrices).toHaveBeenCalled();
    });
  });

  describe('getPriceWithMetadata', () => {
    it('should return price and source information', async () => {
      const chainlinkProvider = createMockProvider('chainlink', 1, ['ethereum'], {
        confidence: 0.95,
      });
      const dexScreenerProvider = createMockProvider('dexscreener', 2, ['ethereum'], {
        confidence: 0.7,
      });

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [chainlinkProvider, dexScreenerProvider];

      const result = await service.getPriceWithMetadata('0x1234', 'ethereum');

      expect(result.price).not.toBeNull();
      expect(result.sources).toHaveLength(2);
      expect(result.sources[0].provider).toBe('chainlink');
      expect(result.sources[0].available).toBe(true);
    });

    it('should select price with highest confidence', async () => {
      const lowConfProvider = createMockProvider('chainlink', 1, ['ethereum'], {
        confidence: 0.5,
        priceUsd: 100,
      });
      const highConfProvider = createMockProvider('dexscreener', 2, ['ethereum'], {
        confidence: 0.9,
        priceUsd: 105,
      });

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [lowConfProvider, highConfProvider];

      const result = await service.getPriceWithMetadata('0x1234', 'ethereum');

      expect(result.price?.confidence).toBe(0.9);
      expect(result.price?.priceUsd).toBe(105);
    });

    it('should report unavailable providers', async () => {
      const failingProvider = createMockProvider('chainlink', 1, ['ethereum']);
      (failingProvider.getPrice as any).mockRejectedValue(new Error('Network error'));

      const workingProvider = createMockProvider('dexscreener', 2, ['ethereum']);

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [failingProvider, workingProvider];

      const result = await service.getPriceWithMetadata('0x1234', 'ethereum');

      expect(result.sources[0].available).toBe(false);
      expect(result.sources[0].error).toBe('Network error');
      expect(result.sources[1].available).toBe(true);
    });
  });

  describe('cache management', () => {
    it('should clear all cache entries', async () => {
      const mockProvider = createMockProvider('chainlink', 1, ['ethereum']);

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [mockProvider];

      await service.getPrice('0x1234', 'ethereum');
      expect((service as any).cache.size).toBe(1);

      service.clearCache();
      expect((service as any).cache.size).toBe(0);
    });

    it('should clear cache for specific token', async () => {
      const mockProvider = createMockProvider('chainlink', 1, ['ethereum']);

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [mockProvider];

      await service.getPrice('0x1234', 'ethereum');
      await service.getPrice('0x5678', 'ethereum');
      expect((service as any).cache.size).toBe(2);

      service.clearCacheForToken('0x1234', 'ethereum');
      expect((service as any).cache.size).toBe(1);
    });

    it('should provide cache statistics', async () => {
      const mockProvider = createMockProvider('chainlink', 1, ['ethereum']);

      service = new PriceOracleService(mockConfig);
      (service as any).providers = [mockProvider];

      await service.getPrice('0x1234', 'ethereum');

      const stats = service.getCacheStats();
      expect(stats.size).toBe(1);
      expect(stats.entries[0].key).toBe('ethereum:0x1234');
      expect(stats.entries[0].expiresIn).toBeGreaterThan(0);
    });
  });

  describe('createPriceOracle factory', () => {
    it('should create oracle with default config', () => {
      const oracle = createPriceOracle();
      expect(oracle).toBeInstanceOf(PriceOracleService);
    });

    it('should merge custom config with defaults', () => {
      const oracle = createPriceOracle({
        cacheTtl: 60000,
        minConfidence: 0.5,
      });

      const config = (oracle as any).config;
      expect(config.cacheTtl).toBe(60000);
      expect(config.minConfidence).toBe(0.5);
      expect(config.maxPriceAge).toBe(300000); // default
    });
  });
});
