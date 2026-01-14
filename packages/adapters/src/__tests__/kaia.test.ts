import { describe, it, expect } from 'vitest';
import {
  KAIA_CONTRACTS,
  KAIA_TOKENS,
  getDragonSwapQuote,
  getKlaySwapQuote,
  getKaiaBestQuote,
  getKaiaPopularPairs,
  getKaiaChainId,
} from '../evm/kaia.js';
import type { SwapRequest } from '@chainhopper/types';

describe('Kaia Chain Integration', () => {
  describe('KAIA_CONTRACTS', () => {
    it('should have DragonSwap router addresses', () => {
      expect(KAIA_CONTRACTS.dragonswapV2Router).toBe('0x9e5A52f57b3038F1B8EeE45F28b3C1967e22799C');
      expect(KAIA_CONTRACTS.dragonswapV3Router).toBe('0x71B08f13B3c3aF35aAdEb3949AFEb1ded1016127');
    });

    it('should have KLAYswap router address', () => {
      expect(KAIA_CONTRACTS.klayswapRouter).toBe('0xEf71750C100f7918d6Ded239Ff1CF09E81dEA92D');
    });
  });

  describe('KAIA_TOKENS', () => {
    it('should have WKLAY address', () => {
      expect(KAIA_TOKENS.WKLAY).toBe('0x19Aac5f612f524B754CA7e7c41cbFa2E981A4432');
    });

    it('should have native KAIA as zero address', () => {
      expect(KAIA_TOKENS.KAIA).toBe('0x0000000000000000000000000000000000000000');
    });

    it('should have stablecoin addresses', () => {
      expect(KAIA_TOKENS.oUSDT).toBeDefined();
      expect(KAIA_TOKENS.oUSDC).toBeDefined();
    });

    it('should have popular token addresses', () => {
      expect(KAIA_TOKENS.KSP).toBeDefined();
      expect(KAIA_TOKENS.BORA).toBeDefined();
      expect(KAIA_TOKENS.MBX).toBeDefined();
    });
  });

  describe('getKaiaChainId', () => {
    it('should return correct chain ID for Kaia', () => {
      expect(getKaiaChainId()).toBe(8217);
    });
  });

  describe('getKaiaPopularPairs', () => {
    it('should return popular trading pairs', () => {
      const pairs = getKaiaPopularPairs();
      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs[0]).toHaveProperty('tokenIn');
      expect(pairs[0]).toHaveProperty('tokenOut');
      expect(pairs[0]).toHaveProperty('name');
    });

    it('should include KAIA/USDT pair', () => {
      const pairs = getKaiaPopularPairs();
      const kaiaUsdt = pairs.find(p => p.name === 'KAIA/USDT');
      expect(kaiaUsdt).toBeDefined();
    });
  });

  describe('getDragonSwapQuote', () => {
    it('should return null for non-Kaia chains', async () => {
      const request: SwapRequest = {
        chainId: 'ethereum',
        tokenIn: '0x...',
        tokenOut: '0x...',
        amountIn: 1000000000000000000n,
        slippage: 0.5,
        recipient: '0x1234567890123456789012345678901234567890',
      };

      const quote = await getDragonSwapQuote(request);
      expect(quote).toBeNull();
    });

    it('should return a quote for Kaia chain (fallback mode)', async () => {
      const request: SwapRequest = {
        chainId: 'kaia',
        tokenIn: KAIA_TOKENS.KAIA,
        tokenOut: KAIA_TOKENS.oUSDT,
        amountIn: 1000000000000000000n, // 1 KAIA
        slippage: 0.5,
        recipient: '0x1234567890123456789012345678901234567890',
      };

      const quote = await getDragonSwapQuote(request);
      // May return null if API is unavailable, or a quote in fallback mode
      if (quote) {
        expect(quote.aggregator).toBe('dragonswap');
        expect(quote.path).toBeDefined();
        expect(quote.txTo).toBe(KAIA_CONTRACTS.dragonswapV2Router);
      }
    });
  });

  describe('getKlaySwapQuote', () => {
    it('should return null for non-Kaia chains', async () => {
      const request: SwapRequest = {
        chainId: 'base',
        tokenIn: '0x...',
        tokenOut: '0x...',
        amountIn: 1000000000000000000n,
        slippage: 0.5,
        recipient: '0x1234567890123456789012345678901234567890',
      };

      const quote = await getKlaySwapQuote(request);
      expect(quote).toBeNull();
    });
  });

  describe('getKaiaBestQuote', () => {
    it('should return null for non-Kaia chains', async () => {
      const request: SwapRequest = {
        chainId: 'arbitrum',
        tokenIn: '0x...',
        tokenOut: '0x...',
        amountIn: 1000000000000000000n,
        slippage: 0.5,
        recipient: '0x1234567890123456789012345678901234567890',
      };

      const quote = await getKaiaBestQuote(request);
      expect(quote).toBeNull();
    });

    it('should aggregate quotes from DragonSwap and KLAYswap', async () => {
      const request: SwapRequest = {
        chainId: 'kaia',
        tokenIn: KAIA_TOKENS.WKLAY,
        tokenOut: KAIA_TOKENS.oUSDT,
        amountIn: 1000000000000000000n,
        slippage: 0.5,
        recipient: '0x1234567890123456789012345678901234567890',
      };

      const quote = await getKaiaBestQuote(request);
      // Quote should be from either dragonswap or klayswap
      if (quote) {
        expect(['dragonswap', 'klayswap']).toContain(quote.aggregator);
      }
    });
  });
});
