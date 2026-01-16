import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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
} from '../evm/ronin.js';
import { EVM_CHAIN_IDS } from '../evm/chains.js';
import type { SwapRequest } from '@chainhopper/types';

describe('Ronin Chain Integration', () => {
  describe('Constants', () => {
    it('should have correct Ronin chain ID', () => {
      expect(EVM_CHAIN_IDS.ronin).toBe(2020);
      expect(getRoninChainId()).toBe(2020);
    });

    it('should have RONIN_CONTRACTS defined', () => {
      expect(RONIN_CONTRACTS.katanaV3Router).toBe('0x8Cd8F15E956636e6527d2EC2ea669675A74153CF');
      expect(RONIN_CONTRACTS.katanaV3Factory).toBe('0x4E7236ff45d69395DDEFE1445040A8f3C7CD8819');
      expect(RONIN_CONTRACTS.katanaV3Quoter).toBe('0xB2Cc117Ed42cBE07710C90903bE46D2822bcde45');
      expect(RONIN_CONTRACTS.katanaV2Router).toBe('0x7d0556d55ca1a92708681e2e231733ebd922597d');
      expect(RONIN_CONTRACTS.permit2).toBeDefined();
      expect(RONIN_CONTRACTS.multicall).toBeDefined();
    });

    it('should have RONIN_TOKENS defined with correct addresses', () => {
      expect(RONIN_TOKENS.RON).toBe('0x0000000000000000000000000000000000000000');
      expect(RONIN_TOKENS.WRON).toBe('0xe514d9DEB7966c8BE0ca922de8a064264eA6bcd4');
      expect(RONIN_TOKENS.WETH).toBeDefined();
      expect(RONIN_TOKENS.AXS).toBeDefined();
      expect(RONIN_TOKENS.SLP).toBeDefined();
      expect(RONIN_TOKENS.USDC).toBeDefined();
      expect(RONIN_TOKENS.PIXEL).toBeDefined();
    });
  });

  describe('Chain utilities', () => {
    it('should correctly identify Ronin chain', () => {
      expect(isRoninChain('ronin')).toBe(true);
      expect(isRoninChain('ethereum')).toBe(false);
      expect(isRoninChain('base')).toBe(false);
    });

    it('should return correct DEX list', () => {
      const dexes = getRoninDexes();
      expect(dexes).toHaveLength(3);
      expect(dexes.map(d => d.name)).toContain('Katana V3');
      expect(dexes.map(d => d.name)).toContain('Katana V2');
      expect(dexes.map(d => d.name)).toContain('Katana Aggregate');
    });

    it('should return popular trading pairs', () => {
      const pairs = getRoninPopularPairs();
      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs.some(p => p.name === 'RON/USDC')).toBe(true);
      expect(pairs.some(p => p.name === 'RON/AXS')).toBe(true);
      expect(pairs.some(p => p.name === 'SLP/WRON')).toBe(true);
    });

    it('should return Katana fee tiers', () => {
      const tiers = getKatanaFeeTiers();
      expect(tiers).toHaveLength(3);
      expect(tiers.some(t => t.fee === 500)).toBe(true);
      expect(tiers.some(t => t.fee === 3000)).toBe(true);
      expect(tiers.some(t => t.fee === 10000)).toBe(true);
    });
  });

  describe('getKatanaV3Quote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'ronin',
      tokenIn: RONIN_TOKENS.WRON,
      tokenOut: RONIN_TOKENS.USDC,
      amountIn: 1000000000000000000n, // 1 WRON
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Ronin chains', async () => {
      const result = await getKatanaV3Quote({ ...mockRequest, chainId: 'ethereum' });
      expect(result).toBeNull();
    });

    it('should return V3 quote for Ronin', async () => {
      const result = await getKatanaV3Quote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('katana-v3');
      expect(result?.amountOut).toBeGreaterThan(0n);
      expect(result?.txTo).toBe(RONIN_CONTRACTS.katanaV3Router);
      expect(result?.poolFees).toBeDefined();
    });

    it('should handle native RON swaps', async () => {
      const nativeRequest = {
        ...mockRequest,
        tokenIn: 'native',
      };

      const result = await getKatanaV3Quote(nativeRequest);

      expect(result).not.toBeNull();
      expect(result?.txValue).toBe(nativeRequest.amountIn);
    });
  });

  describe('getKatanaV2Quote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'ronin',
      tokenIn: RONIN_TOKENS.WRON,
      tokenOut: RONIN_TOKENS.AXS,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Ronin chains', async () => {
      const result = await getKatanaV2Quote({ ...mockRequest, chainId: 'base' });
      expect(result).toBeNull();
    });

    it('should return V2 quote for Ronin', async () => {
      const result = await getKatanaV2Quote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('katana-v2');
      expect(result?.amountOut).toBeGreaterThan(0n);
      expect(result?.txTo).toBe(RONIN_CONTRACTS.katanaV2Router);
    });

    it('should handle native token input', async () => {
      const nativeRequest = {
        ...mockRequest,
        tokenIn: RONIN_TOKENS.RON,
      };

      const result = await getKatanaV2Quote(nativeRequest);

      expect(result).not.toBeNull();
      expect(result?.txValue).toBe(nativeRequest.amountIn);
    });

    it('should handle native token output', async () => {
      const nativeOutRequest = {
        ...mockRequest,
        tokenIn: RONIN_TOKENS.AXS,
        tokenOut: RONIN_TOKENS.RON,
      };

      const result = await getKatanaV2Quote(nativeOutRequest);

      expect(result).not.toBeNull();
      expect(result?.txValue).toBe(0n);
    });
  });

  describe('getKatanaAggregateQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'ronin',
      tokenIn: RONIN_TOKENS.SLP,
      tokenOut: RONIN_TOKENS.USDC,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Ronin chains', async () => {
      const result = await getKatanaAggregateQuote({ ...mockRequest, chainId: 'arbitrum' });
      expect(result).toBeNull();
    });

    it('should return aggregate quote', async () => {
      const result = await getKatanaAggregateQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('katana-aggregate');
      expect(result?.txTo).toBe(RONIN_CONTRACTS.katanaV3Router);
      expect(result?.estimatedGas).toBe(250000n); // Higher gas for aggregate
    });
  });

  describe('getRoninBestQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'ronin',
      tokenIn: RONIN_TOKENS.WRON,
      tokenOut: RONIN_TOKENS.USDC,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Ronin chains', async () => {
      const result = await getRoninBestQuote({ ...mockRequest, chainId: 'polygon' });
      expect(result).toBeNull();
    });

    it('should return best quote from all Katana versions', async () => {
      const result = await getRoninBestQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.amountOut).toBeGreaterThan(0n);
      expect(['katana-v3', 'katana-v2', 'katana-aggregate']).toContain(result?.aggregator);
    });
  });

  describe('buildRoninSwapTransaction', () => {
    it('should build transaction from quote', async () => {
      const mockQuote: RoninQuote = {
        aggregator: 'katana-v3',
        amountOut: 2000000000n,
        estimatedGas: 200000n,
        priceImpact: 0.3,
        route: [{
          dex: 'Katana V3',
          poolAddress: RONIN_CONTRACTS.katanaV3Factory,
          tokenIn: RONIN_TOKENS.WRON,
          tokenOut: RONIN_TOKENS.USDC,
          percentage: 100,
        }],
        txData: '0x414bf389',
        txTo: RONIN_CONTRACTS.katanaV3Router,
        txValue: 0n,
        path: [RONIN_TOKENS.WRON, RONIN_TOKENS.USDC],
        poolFees: [3000],
      };

      const tx = await buildRoninSwapTransaction(
        mockQuote,
        '0x1234567890123456789012345678901234567890'
      );

      expect(tx.to).toBe(RONIN_CONTRACTS.katanaV3Router);
      expect(tx.data).toBe('0x414bf389');
      expect(tx.value).toBe(0n);
    });

    it('should include value for native RON swaps', async () => {
      const mockQuote: RoninQuote = {
        aggregator: 'katana-v2',
        amountOut: 2000000000n,
        estimatedGas: 180000n,
        priceImpact: 0.5,
        route: [],
        txData: '0x7ff36ab5',
        txTo: RONIN_CONTRACTS.katanaV2Router,
        txValue: 1000000000000000000n, // 1 RON
        path: [RONIN_TOKENS.WRON, RONIN_TOKENS.AXS],
      };

      const tx = await buildRoninSwapTransaction(
        mockQuote,
        '0x1234567890123456789012345678901234567890'
      );

      expect(tx.value).toBe(1000000000000000000n);
    });
  });
});
