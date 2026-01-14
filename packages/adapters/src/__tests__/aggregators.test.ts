import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  get1inchQuote,
  getParaSwapQuote,
  getBestQuote,
  getSupportedAggregators,
} from '../evm/aggregators.js';
import type { SwapRequest } from '@chainhopper/types';

describe('EVM Aggregators', () => {
  const mockSwapRequest: SwapRequest = {
    chainId: 'ethereum',
    tokenIn: '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE', // Native ETH
    tokenOut: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    amountIn: 1000000000000000000n, // 1 ETH
    slippage: 0.5,
    recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f8fCd0',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getSupportedAggregators', () => {
    it('should return supported aggregators for ethereum', () => {
      const aggregators = getSupportedAggregators('ethereum');
      expect(aggregators).toContain('1inch');
      expect(aggregators).toContain('paraswap');
    });

    it('should return supported aggregators for polygon', () => {
      const aggregators = getSupportedAggregators('polygon');
      expect(aggregators).toContain('1inch');
      expect(aggregators).toContain('paraswap');
    });

    it('should return supported aggregators for base', () => {
      const aggregators = getSupportedAggregators('base');
      expect(aggregators.length).toBeGreaterThan(0);
    });

    it('should return supported aggregators for arbitrum', () => {
      const aggregators = getSupportedAggregators('arbitrum');
      expect(aggregators).toContain('1inch');
    });
  });

  describe('get1inchQuote', () => {
    it('should return null for unsupported chains', async () => {
      const unsupportedRequest = { ...mockSwapRequest, chainId: 'ton' };
      const quote = await get1inchQuote(unsupportedRequest);
      expect(quote).toBeNull();
    });

    it('should return quote on successful API response', async () => {
      const mockResponse = {
        dstAmount: '2000000000', // 2000 USDC (6 decimals)
        tx: {
          gas: '150000',
          data: '0x1234',
          to: '0xRouter',
          value: '1000000000000000000',
        },
        protocols: [
          [
            [
              {
                name: 'UNISWAP_V3',
                pool: '0xPoolAddress',
                fromTokenAddress: mockSwapRequest.tokenIn,
                toTokenAddress: mockSwapRequest.tokenOut,
                part: 100,
              },
            ],
          ],
        ],
      };

      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const quote = await get1inchQuote(mockSwapRequest, 'test-api-key');

      expect(quote).not.toBeNull();
      expect(quote?.aggregator).toBe('1inch');
      expect(quote?.amountOut).toBe(2000000000n);
      expect(quote?.estimatedGas).toBe(150000n);
      expect(quote?.txData).toBe('0x1234');
    });

    it('should fallback to quote endpoint on swap endpoint failure', async () => {
      const mockQuoteResponse = {
        dstAmount: '1900000000',
        gas: '120000',
        protocols: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({ ok: false }) // swap endpoint fails
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockQuoteResponse),
        });

      const quote = await get1inchQuote(mockSwapRequest);

      expect(quote).not.toBeNull();
      expect(quote?.amountOut).toBe(1900000000n);
      expect(quote?.txData).toBe('0x'); // No tx data from quote endpoint
    });

    it('should return null on API error', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Network error'));

      const quote = await get1inchQuote(mockSwapRequest);
      expect(quote).toBeNull();
    });
  });

  describe('getParaSwapQuote', () => {
    it('should return null for unsupported chains', async () => {
      const unsupportedRequest = { ...mockSwapRequest, chainId: 'ton' };
      const quote = await getParaSwapQuote(unsupportedRequest);
      expect(quote).toBeNull();
    });

    it('should return quote on successful API response', async () => {
      const mockPriceResponse = {
        priceRoute: {
          destAmount: '2100000000',
          gasCost: '180000',
          priceImpact: '0.5',
          bestRoute: [
            {
              swaps: [
                {
                  srcToken: mockSwapRequest.tokenIn,
                  destToken: mockSwapRequest.tokenOut,
                  swapExchanges: [
                    {
                      exchange: 'UniswapV3',
                      poolAddresses: ['0xPool1'],
                      percent: 100,
                    },
                  ],
                },
              ],
            },
          ],
        },
      };

      const mockTxResponse = {
        data: '0xabcd',
        to: '0xParaSwapRouter',
        value: '1000000000000000000',
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPriceResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockTxResponse),
        });

      const quote = await getParaSwapQuote(mockSwapRequest);

      expect(quote).not.toBeNull();
      expect(quote?.aggregator).toBe('paraswap');
      expect(quote?.amountOut).toBe(2100000000n);
      expect(quote?.estimatedGas).toBe(180000n);
      expect(quote?.priceImpact).toBe(0.5);
      expect(quote?.txData).toBe('0xabcd');
    });

    it('should return quote without tx data if transaction build fails', async () => {
      const mockPriceResponse = {
        priceRoute: {
          destAmount: '2000000000',
          gasCost: '150000',
          priceImpact: '0.3',
          bestRoute: [],
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(mockPriceResponse),
        })
        .mockResolvedValueOnce({ ok: false }); // Transaction build fails

      const quote = await getParaSwapQuote(mockSwapRequest);

      expect(quote).not.toBeNull();
      expect(quote?.amountOut).toBe(2000000000n);
      expect(quote?.txData).toBe('0x');
    });

    it('should return null if price endpoint fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ ok: false });

      const quote = await getParaSwapQuote(mockSwapRequest);
      expect(quote).toBeNull();
    });
  });

  describe('getBestQuote', () => {
    it('should return the quote with highest output', async () => {
      const oneinchResponse = {
        dstAmount: '1900000000',
        tx: { gas: '150000', data: '0x1inch', to: '0x1inch', value: '0' },
        protocols: [],
      };

      const paraswapPriceResponse = {
        priceRoute: {
          destAmount: '2000000000', // Higher output
          gasCost: '160000',
          priceImpact: '0.4',
          bestRoute: [],
        },
      };

      const paraswapTxResponse = {
        data: '0xparaswap',
        to: '0xparaswap',
        value: '0',
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        // 1inch call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(oneinchResponse),
        })
        // ParaSwap price call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(paraswapPriceResponse),
        })
        // ParaSwap tx call
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(paraswapTxResponse),
        });

      const quote = await getBestQuote(mockSwapRequest);

      expect(quote).not.toBeNull();
      expect(quote?.aggregator).toBe('paraswap');
      expect(quote?.amountOut).toBe(2000000000n);
    });

    it('should return null if all aggregators fail', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('All failed'));

      const quote = await getBestQuote(mockSwapRequest);
      expect(quote).toBeNull();
    });

    it('should filter out quotes with zero output', async () => {
      const oneinchResponse = {
        dstAmount: '1500000000',
        tx: { gas: '150000', data: '0x1inch', to: '0x1inch', value: '0' },
        protocols: [],
      };

      const paraswapPriceResponse = {
        priceRoute: {
          destAmount: '0', // Zero output
          gasCost: '0',
          priceImpact: '0',
          bestRoute: [],
        },
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(oneinchResponse),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(paraswapPriceResponse),
        })
        .mockResolvedValueOnce({ ok: false }); // tx build fails

      const quote = await getBestQuote(mockSwapRequest);

      expect(quote).not.toBeNull();
      expect(quote?.aggregator).toBe('1inch');
    });

    it('should pass API key to 1inch', async () => {
      const oneinchResponse = {
        dstAmount: '1500000000',
        tx: { gas: '150000', data: '0x1inch', to: '0x1inch', value: '0' },
        protocols: [],
      };

      (global.fetch as ReturnType<typeof vi.fn>)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(oneinchResponse),
        })
        .mockResolvedValueOnce({ ok: false }); // paraswap fails

      await getBestQuote(mockSwapRequest, { oneInchApiKey: 'my-api-key' });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('1inch'),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer my-api-key',
          }),
        })
      );
    });
  });
});
