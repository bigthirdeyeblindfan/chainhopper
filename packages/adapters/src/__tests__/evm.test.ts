import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  EVM_CHAIN_IDS,
  EVM_CHAIN_CONFIGS,
  NATIVE_TOKEN_ADDRESS,
  WRAPPED_NATIVE_TOKENS,
  isEvmChain,
  getEvmChainId,
  getEvmChainConfig,
  type EvmChainId,
} from '../evm/chains.js';
import { EvmChainAdapter, createEvmAdapter, createAllEvmAdapters } from '../evm/index.js';

describe('EVM Chain Configuration', () => {
  describe('EVM_CHAIN_IDS', () => {
    it('should have correct chain IDs for all supported chains', () => {
      expect(EVM_CHAIN_IDS.ethereum).toBe(1);
      expect(EVM_CHAIN_IDS.base).toBe(8453);
      expect(EVM_CHAIN_IDS.arbitrum).toBe(42161);
      expect(EVM_CHAIN_IDS.optimism).toBe(10);
      expect(EVM_CHAIN_IDS.polygon).toBe(137);
      expect(EVM_CHAIN_IDS.bsc).toBe(56);
      expect(EVM_CHAIN_IDS.avalanche).toBe(43114);
    });

    it('should have 46 supported EVM chains', () => {
      // 10 original + 36 Phase 7 chains (37 new minus starknet which is non-EVM)
      expect(Object.keys(EVM_CHAIN_IDS)).toHaveLength(46);
    });

    it('should have correct chain IDs for Phase 7 chains', () => {
      // Phase 7B: Originally Planned
      expect(EVM_CHAIN_IDS.monad).toBe(143);
      expect(EVM_CHAIN_IDS.scroll).toBe(534352);
      expect(EVM_CHAIN_IDS.ronin).toBe(2020);
      // Phase 7C: High TVL
      expect(EVM_CHAIN_IDS.linea).toBe(59144);
      expect(EVM_CHAIN_IDS.zksync).toBe(324);
      expect(EVM_CHAIN_IDS.mantle).toBe(5000);
      // Phase 7D: Strategic
      expect(EVM_CHAIN_IDS.unichain).toBe(130);
      expect(EVM_CHAIN_IDS.celo).toBe(42220);
      expect(EVM_CHAIN_IDS.cronos).toBe(25);
      // Phase 7E: Emerging
      expect(EVM_CHAIN_IDS.moonbeam).toBe(1284);
      expect(EVM_CHAIN_IDS.moonriver).toBe(1285);
    });
  });

  describe('EVM_CHAIN_CONFIGS', () => {
    it('should have configs for all chains in EVM_CHAIN_IDS', () => {
      for (const chainId of Object.keys(EVM_CHAIN_IDS)) {
        expect(EVM_CHAIN_CONFIGS[chainId as EvmChainId]).toBeDefined();
      }
    });

    it('should have valid config structure for ethereum', () => {
      const config = EVM_CHAIN_CONFIGS.ethereum;
      expect(config.id).toBe('ethereum');
      expect(config.name).toBe('Ethereum');
      expect(config.type).toBe('evm');
      expect(config.nativeCurrency.symbol).toBe('ETH');
      expect(config.nativeCurrency.decimals).toBe(18);
      expect(config.rpcUrls.length).toBeGreaterThan(0);
      expect(config.blockExplorerUrls.length).toBeGreaterThan(0);
      expect(config.isEnabled).toBe(true);
    });

    it('should have correct native currency for each chain', () => {
      expect(EVM_CHAIN_CONFIGS.ethereum.nativeCurrency.symbol).toBe('ETH');
      expect(EVM_CHAIN_CONFIGS.polygon.nativeCurrency.symbol).toBe('MATIC');
      expect(EVM_CHAIN_CONFIGS.bsc.nativeCurrency.symbol).toBe('BNB');
      expect(EVM_CHAIN_CONFIGS.avalanche.nativeCurrency.symbol).toBe('AVAX');
    });
  });

  describe('WRAPPED_NATIVE_TOKENS', () => {
    it('should have wrapped token addresses for all chains', () => {
      for (const chainId of Object.keys(EVM_CHAIN_IDS)) {
        expect(WRAPPED_NATIVE_TOKENS[chainId as EvmChainId]).toBeDefined();
        expect(WRAPPED_NATIVE_TOKENS[chainId as EvmChainId]).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    it('should have correct WETH address for ethereum', () => {
      expect(WRAPPED_NATIVE_TOKENS.ethereum.toLowerCase()).toBe(
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2'
      );
    });
  });

  describe('NATIVE_TOKEN_ADDRESS', () => {
    it('should be the standard native token placeholder', () => {
      expect(NATIVE_TOKEN_ADDRESS).toBe('0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE');
    });
  });
});

describe('EVM Chain Utility Functions', () => {
  describe('isEvmChain', () => {
    it('should return true for valid EVM chains', () => {
      expect(isEvmChain('ethereum')).toBe(true);
      expect(isEvmChain('base')).toBe(true);
      expect(isEvmChain('arbitrum')).toBe(true);
      expect(isEvmChain('polygon')).toBe(true);
    });

    it('should return false for non-EVM chains', () => {
      expect(isEvmChain('ton')).toBe(false);
      expect(isEvmChain('sui')).toBe(false);
      expect(isEvmChain('solana')).toBe(false);
      expect(isEvmChain('invalid')).toBe(false);
    });
  });

  describe('getEvmChainId', () => {
    it('should return numeric chain ID for valid chains', () => {
      expect(getEvmChainId('ethereum')).toBe(1);
      expect(getEvmChainId('base')).toBe(8453);
      expect(getEvmChainId('polygon')).toBe(137);
    });

    it('should return undefined for non-EVM chains', () => {
      expect(getEvmChainId('ton')).toBeUndefined();
      expect(getEvmChainId('invalid')).toBeUndefined();
    });
  });

  describe('getEvmChainConfig', () => {
    it('should return config for valid chains', () => {
      const config = getEvmChainConfig('ethereum');
      expect(config.id).toBe('ethereum');
      expect(config.name).toBe('Ethereum');
    });
  });
});

describe('EvmChainAdapter', () => {
  describe('constructor', () => {
    it('should create adapter with chain ID string', () => {
      const adapter = new EvmChainAdapter('ethereum');
      expect(adapter.chainId).toBe('ethereum');
      expect(adapter.config.name).toBe('Ethereum');
    });

    it('should create adapter with config object', () => {
      const config = EVM_CHAIN_CONFIGS.base;
      const adapter = new EvmChainAdapter(config);
      expect(adapter.chainId).toBe('base');
      expect(adapter.config.name).toBe('Base');
    });

    it('should throw error for unsupported chain', () => {
      expect(() => new EvmChainAdapter('invalid' as EvmChainId)).toThrow();
    });
  });

  describe('isValidAddress', () => {
    it('should validate native address keywords', () => {
      const adapter = new EvmChainAdapter('ethereum');
      expect(adapter.isValidAddress('native')).toBe(true);
      expect(adapter.isValidAddress(NATIVE_TOKEN_ADDRESS)).toBe(true);
    });

    it('should validate standard ethereum addresses', () => {
      const adapter = new EvmChainAdapter('ethereum');
      // Use lowercase address to avoid checksum issues in test
      expect(adapter.isValidAddress('0x742d35cc6634c0532925a3b844bc9e7595f8fcd0')).toBe(true);
    });

    it('should reject invalid addresses', () => {
      const adapter = new EvmChainAdapter('ethereum');
      expect(adapter.isValidAddress('invalid')).toBe(false);
      expect(adapter.isValidAddress('0x123')).toBe(false);
    });
  });

  describe('formatUnits', () => {
    it('should format wei to ether correctly', () => {
      const adapter = new EvmChainAdapter('ethereum');
      expect(adapter.formatUnits(1000000000000000000n, 18)).toBe('1');
      expect(adapter.formatUnits(1500000000000000000n, 18)).toBe('1.5');
      expect(adapter.formatUnits(1000000n, 6)).toBe('1'); // USDC decimals
    });
  });

  describe('parseUnits', () => {
    it('should parse ether to wei correctly', () => {
      const adapter = new EvmChainAdapter('ethereum');
      expect(adapter.parseUnits('1', 18)).toBe(1000000000000000000n);
      expect(adapter.parseUnits('1.5', 18)).toBe(1500000000000000000n);
      expect(adapter.parseUnits('1', 6)).toBe(1000000n); // USDC decimals
    });
  });
});

describe('Adapter Factory Functions', () => {
  describe('createEvmAdapter', () => {
    it('should create adapter for valid chain', () => {
      const adapter = createEvmAdapter('ethereum');
      expect(adapter).toBeInstanceOf(EvmChainAdapter);
      expect(adapter.chainId).toBe('ethereum');
    });

    it('should accept options', () => {
      const adapter = createEvmAdapter('ethereum', { oneInchApiKey: 'test-key' });
      expect(adapter).toBeInstanceOf(EvmChainAdapter);
    });
  });

  describe('createAllEvmAdapters', () => {
    it('should create adapters for all enabled chains', () => {
      const adapters = createAllEvmAdapters();
      expect(adapters).toBeInstanceOf(Map);
      expect(adapters.size).toBeGreaterThan(0);

      // Check that all enabled chains have adapters
      for (const [chainId, config] of Object.entries(EVM_CHAIN_CONFIGS)) {
        if (config.isEnabled) {
          expect(adapters.has(chainId as EvmChainId)).toBe(true);
        }
      }
    });

    it('should return EvmChainAdapter instances', () => {
      const adapters = createAllEvmAdapters();
      for (const adapter of adapters.values()) {
        expect(adapter).toBeInstanceOf(EvmChainAdapter);
      }
    });
  });
});
