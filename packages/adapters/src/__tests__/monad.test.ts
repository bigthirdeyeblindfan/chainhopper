import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
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
} from '../evm/monad.js';
import { EVM_CHAIN_IDS } from '../evm/chains.js';
import type { SwapRequest } from '@chainhopper/types';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Monad Chain Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Constants', () => {
    it('should have correct Monad chain ID', () => {
      expect(EVM_CHAIN_IDS.monad).toBe(143);
      expect(getMonadChainId()).toBe(143);
    });

    it('should have MONAD_CONTRACTS defined', () => {
      expect(MONAD_CONTRACTS.kuruRouter).toBeDefined();
      expect(MONAD_CONTRACTS.kuruOrderbook).toBeDefined();
      expect(MONAD_CONTRACTS.kuruFlow).toBeDefined();
      expect(MONAD_CONTRACTS.uniswapV3Router).toBeDefined();
      expect(MONAD_CONTRACTS.uniswapV3Quoter).toBeDefined();
      expect(MONAD_CONTRACTS.multicall3).toBe('0xcA11bde05977b3631167028862bE2a173976CA11');
    });

    it('should have MONAD_TOKENS defined with correct addresses', () => {
      expect(MONAD_TOKENS.MON).toBe('0x0000000000000000000000000000000000000000');
      expect(MONAD_TOKENS.WMON).toBe('0x3bd359C1119dA7Da1D913D1C4D2B7c461115433A');
      expect(MONAD_TOKENS.USDC).toBe('0x754704Bc059F8C67012fEd69BC8A327a5aafb603');
      expect(MONAD_TOKENS.WETH).toBe('0xEE8c0E9f1BFFb4Eb878d8f15f368A02a35481242');
      expect(MONAD_TOKENS.wstETH).toBe('0x10Aeaf63194db8d453d4D85a06E5eFE1dd0b5417');
    });
  });

  describe('Chain utilities', () => {
    it('should correctly identify Monad chain', () => {
      expect(isMonadChain('monad')).toBe(true);
      expect(isMonadChain('ethereum')).toBe(false);
      expect(isMonadChain('base')).toBe(false);
    });

    it('should return correct DEX list', () => {
      const dexes = getMonadDexes();
      expect(dexes).toHaveLength(3);
      expect(dexes.map(d => d.name)).toContain('Kuru Flow');
      expect(dexes.map(d => d.name)).toContain('Kuru Orderbook');
      expect(dexes.map(d => d.name)).toContain('Uniswap V3');
    });

    it('should return popular trading pairs', () => {
      const pairs = getMonadPopularPairs();
      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs.some(p => p.name === 'MON/USDC')).toBe(true);
      expect(pairs.some(p => p.name === 'MON/WETH')).toBe(true);
    });
  });

  describe('getKuruFlowQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'monad',
      tokenIn: MONAD_TOKENS.WMON,
      tokenOut: MONAD_TOKENS.USDC,
      amountIn: 1000000000000000000n, // 1 WMON
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Monad chains', async () => {
      const result = await getKuruFlowQuote({ ...mockRequest, chainId: 'ethereum' });
      expect(result).toBeNull();
    });

    it('should return quote from Kuru Flow API on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          amountOut: '2000000000',
          gasEstimate: '180000',
          priceImpact: '0.3',
          route: [{ dex: 'Kuru', pool: '0xpool' }],
          tx: {
            data: '0xswapdata',
            to: MONAD_CONTRACTS.kuruFlow,
            value: '0',
          },
          path: [MONAD_TOKENS.WMON, MONAD_TOKENS.USDC],
        }),
      });

      const result = await getKuruFlowQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('kuru-flow');
      expect(result?.amountOut).toBe(2000000000n);
      expect(result?.estimatedGas).toBe(180000n);
      expect(result?.priceImpact).toBe(0.3);
    });

    it('should return fallback quote on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      const result = await getKuruFlowQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('kuru-flow');
      expect(result?.amountOut).toBeGreaterThan(0n);
    });

    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await getKuruFlowQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('kuru-flow');
    });
  });

  describe('getKuruOrderbookQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'monad',
      tokenIn: MONAD_TOKENS.WMON,
      tokenOut: MONAD_TOKENS.USDC,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Monad chains', async () => {
      const result = await getKuruOrderbookQuote({ ...mockRequest, chainId: 'base' });
      expect(result).toBeNull();
    });

    it('should return quote from Kuru orderbook API on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          expectedOutput: '1950000000',
          gasEstimate: '120000',
          priceImpact: '0.1',
          orderbookAddress: '0xorderbook',
          calldata: '0xcalldata',
        }),
      });

      const result = await getKuruOrderbookQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('kuru');
      expect(result?.amountOut).toBe(1950000000n);
      expect(result?.estimatedGas).toBe(120000n);
    });

    it('should return null on API failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const result = await getKuruOrderbookQuote(mockRequest);
      expect(result).toBeNull();
    });
  });

  describe('getMonadUniswapQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'monad',
      tokenIn: MONAD_TOKENS.WETH,
      tokenOut: MONAD_TOKENS.USDC,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Monad chains', async () => {
      const result = await getMonadUniswapQuote({ ...mockRequest, chainId: 'polygon' });
      expect(result).toBeNull();
    });

    it('should return Uniswap V3 quote', async () => {
      const result = await getMonadUniswapQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('uniswap-v3');
      expect(result?.estimatedGas).toBe(180000n);
      expect(result?.txTo).toBe(MONAD_CONTRACTS.uniswapV3Router);
    });

    it('should handle native token swaps', async () => {
      const nativeRequest = {
        ...mockRequest,
        tokenIn: 'native',
      };

      const result = await getMonadUniswapQuote(nativeRequest);

      expect(result).not.toBeNull();
      expect(result?.txValue).toBe(nativeRequest.amountIn);
    });
  });

  describe('getMonadBestQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'monad',
      tokenIn: MONAD_TOKENS.WMON,
      tokenOut: MONAD_TOKENS.USDC,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Monad chains', async () => {
      const result = await getMonadBestQuote({ ...mockRequest, chainId: 'arbitrum' });
      expect(result).toBeNull();
    });

    it('should aggregate quotes from all Monad DEXes', async () => {
      // Mock Kuru Flow API with higher quote
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          amountOut: '999000000000000000000', // Very high quote
          gasEstimate: '180000',
          priceImpact: '0.3',
        }),
      });

      // Mock Kuru Orderbook API
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          expectedOutput: '998000000000000000000',
          gasEstimate: '120000',
          priceImpact: '0.1',
        }),
      });

      const result = await getMonadBestQuote(mockRequest);

      expect(result).not.toBeNull();
      // Should return a valid quote from one of the sources
      expect(result?.amountOut).toBeGreaterThan(0n);
      expect(['kuru', 'kuru-flow', 'uniswap-v3']).toContain(result?.aggregator);
    });

    it('should return Uniswap quote if Kuru APIs fail', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      const result = await getMonadBestQuote(mockRequest);

      expect(result).not.toBeNull();
      // Should have at least the Uniswap fallback
      expect(['uniswap-v3', 'kuru-flow']).toContain(result?.aggregator);
    });
  });

  describe('buildMonadSwapTransaction', () => {
    it('should build transaction from quote', async () => {
      const mockQuote: MonadQuote = {
        aggregator: 'kuru-flow',
        amountOut: 2000000000n,
        estimatedGas: 180000n,
        priceImpact: 0.3,
        route: [{
          dex: 'Kuru',
          poolAddress: '0xpool',
          tokenIn: MONAD_TOKENS.WMON,
          tokenOut: MONAD_TOKENS.USDC,
          percentage: 100,
        }],
        txData: '0xswapdata',
        txTo: MONAD_CONTRACTS.kuruFlow,
        txValue: 0n,
        path: [MONAD_TOKENS.WMON, MONAD_TOKENS.USDC],
      };

      const tx = await buildMonadSwapTransaction(
        mockQuote,
        '0x1234567890123456789012345678901234567890'
      );

      expect(tx.to).toBe(MONAD_CONTRACTS.kuruFlow);
      expect(tx.data).toBe('0xswapdata');
      expect(tx.value).toBe(0n);
    });

    it('should include value for native token swaps', async () => {
      const mockQuote: MonadQuote = {
        aggregator: 'kuru-flow',
        amountOut: 2000000000n,
        estimatedGas: 180000n,
        priceImpact: 0.3,
        route: [],
        txData: '0xswapdata',
        txTo: MONAD_CONTRACTS.kuruFlow,
        txValue: 1000000000000000000n, // 1 MON
        path: [MONAD_TOKENS.MON, MONAD_TOKENS.USDC],
      };

      const tx = await buildMonadSwapTransaction(
        mockQuote,
        '0x1234567890123456789012345678901234567890'
      );

      expect(tx.value).toBe(1000000000000000000n);
    });
  });
});
