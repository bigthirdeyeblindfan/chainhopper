import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MODE_CONTRACTS,
  MODE_TOKENS,
  getSwapModeV2Quote,
  getSwapModeV3Quote,
  getKimQuote,
  getModeBestQuote,
  buildModeSwapTransaction,
  getModeDexes,
  isModeChain,
  getModeChainId,
  getModePopularPairs,
  type ModeQuote,
} from '../evm/mode.js';
import { EVM_CHAIN_IDS } from '../evm/chains.js';
import type { SwapRequest } from '@chainhopper/types';

describe('Mode Network Integration', () => {
  describe('Constants', () => {
    it('should have correct Mode chain ID', () => {
      expect(EVM_CHAIN_IDS.mode).toBe(34443);
      expect(getModeChainId()).toBe(34443);
    });

    it('should have MODE_CONTRACTS defined', () => {
      expect(MODE_CONTRACTS.swapModeV2Router).toBe('0xc1e624C810D297FD70eF53B0E08F44FABE468591');
      expect(MODE_CONTRACTS.swapModeV2Factory).toBe('0xfb926356BAf861c93C3557D7327Dbe8734A71891');
      expect(MODE_CONTRACTS.swapModeV3Factory).toBe('0x6E36FC34eA123044F278d3a9F3819027B21c9c32');
      expect(MODE_CONTRACTS.swapModeV3PositionManager).toBe('0xcc3726bCc27f232bC1CaAB40853AEa91ae43C216');
      expect(MODE_CONTRACTS.kimRouter).toBe('0x5D61c537393cf21893BE619E36fC94cd73C77DD3');
      expect(MODE_CONTRACTS.kimFactory).toBe('0xB5F00c2C5f8821155D8ed27E31932CFD9DB3C5D5');
    });

    it('should have MODE_TOKENS defined with correct addresses', () => {
      expect(MODE_TOKENS.ETH).toBe('0x0000000000000000000000000000000000000000');
      expect(MODE_TOKENS.WETH).toBe('0x4200000000000000000000000000000000000006'); // OP Stack standard
      expect(MODE_TOKENS.USDC).toBe('0xd988097fb8612cc24eeC14542bC03424c656005f');
      expect(MODE_TOKENS.USDT).toBeDefined();
      expect(MODE_TOKENS.MODE).toBe('0xDfc7C877a950e49D2610114102175A06C2e3167a');
      expect(MODE_TOKENS.SMD).toBeDefined();
      expect(MODE_TOKENS.ezETH).toBeDefined();
      expect(MODE_TOKENS.weETH).toBeDefined();
    });
  });

  describe('Chain utilities', () => {
    it('should correctly identify Mode chain', () => {
      expect(isModeChain('mode')).toBe(true);
      expect(isModeChain('ethereum')).toBe(false);
      expect(isModeChain('base')).toBe(false);
    });

    it('should return correct DEX list', () => {
      const dexes = getModeDexes();
      expect(dexes).toHaveLength(3);
      expect(dexes.map(d => d.name)).toContain('SwapMode V3');
      expect(dexes.map(d => d.name)).toContain('SwapMode V2');
      expect(dexes.map(d => d.name)).toContain('Kim Exchange');
    });

    it('should return popular trading pairs', () => {
      const pairs = getModePopularPairs();
      expect(pairs.length).toBeGreaterThan(0);
      expect(pairs.some(p => p.name === 'ETH/USDC')).toBe(true);
      expect(pairs.some(p => p.name === 'ETH/MODE')).toBe(true);
      expect(pairs.some(p => p.name === 'MODE/USDC')).toBe(true);
    });
  });

  describe('getSwapModeV2Quote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'mode',
      tokenIn: MODE_TOKENS.WETH,
      tokenOut: MODE_TOKENS.USDC,
      amountIn: 1000000000000000000n, // 1 WETH
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Mode chains', async () => {
      const result = await getSwapModeV2Quote({ ...mockRequest, chainId: 'ethereum' });
      expect(result).toBeNull();
    });

    it('should return V2 quote for Mode', async () => {
      const result = await getSwapModeV2Quote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('swapmode-v2');
      expect(result?.amountOut).toBeGreaterThan(0n);
      expect(result?.txTo).toBe(MODE_CONTRACTS.swapModeV2Router);
    });

    it('should handle native ETH swaps', async () => {
      const nativeRequest = {
        ...mockRequest,
        tokenIn: 'native',
      };

      const result = await getSwapModeV2Quote(nativeRequest);

      expect(result).not.toBeNull();
      expect(result?.txValue).toBe(nativeRequest.amountIn);
    });
  });

  describe('getSwapModeV3Quote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'mode',
      tokenIn: MODE_TOKENS.WETH,
      tokenOut: MODE_TOKENS.MODE,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Mode chains', async () => {
      const result = await getSwapModeV3Quote({ ...mockRequest, chainId: 'base' });
      expect(result).toBeNull();
    });

    it('should return V3 quote for Mode', async () => {
      const result = await getSwapModeV3Quote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('swapmode-v3');
      expect(result?.amountOut).toBeGreaterThan(0n);
      expect(result?.txTo).toBe(MODE_CONTRACTS.swapModeV3PositionManager);
      expect(result?.poolFees).toBeDefined();
    });

    it('should handle native token input', async () => {
      const nativeRequest = {
        ...mockRequest,
        tokenIn: MODE_TOKENS.ETH,
      };

      const result = await getSwapModeV3Quote(nativeRequest);

      expect(result).not.toBeNull();
      expect(result?.txValue).toBe(nativeRequest.amountIn);
    });
  });

  describe('getKimQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'mode',
      tokenIn: MODE_TOKENS.SMD,
      tokenOut: MODE_TOKENS.USDC,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Mode chains', async () => {
      const result = await getKimQuote({ ...mockRequest, chainId: 'arbitrum' });
      expect(result).toBeNull();
    });

    it('should return Kim Exchange quote', async () => {
      const result = await getKimQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.aggregator).toBe('kim');
      expect(result?.txTo).toBe(MODE_CONTRACTS.kimRouter);
      expect(result?.estimatedGas).toBe(200000n); // Algebra DEX gas
    });
  });

  describe('getModeBestQuote', () => {
    const mockRequest: SwapRequest = {
      chainId: 'mode',
      tokenIn: MODE_TOKENS.WETH,
      tokenOut: MODE_TOKENS.USDC,
      amountIn: 1000000000000000000n,
      slippage: 0.5,
      recipient: '0x1234567890123456789012345678901234567890',
    };

    it('should return null for non-Mode chains', async () => {
      const result = await getModeBestQuote({ ...mockRequest, chainId: 'polygon' });
      expect(result).toBeNull();
    });

    it('should return best quote from all Mode DEXes', async () => {
      const result = await getModeBestQuote(mockRequest);

      expect(result).not.toBeNull();
      expect(result?.amountOut).toBeGreaterThan(0n);
      expect(['swapmode-v3', 'swapmode-v2', 'kim']).toContain(result?.aggregator);
    });
  });

  describe('buildModeSwapTransaction', () => {
    it('should build transaction from quote', async () => {
      const mockQuote: ModeQuote = {
        aggregator: 'swapmode-v3',
        amountOut: 2000000000n,
        estimatedGas: 180000n,
        priceImpact: 0.3,
        route: [{
          dex: 'SwapMode V3',
          poolAddress: MODE_CONTRACTS.swapModeV3Factory,
          tokenIn: MODE_TOKENS.WETH,
          tokenOut: MODE_TOKENS.USDC,
          percentage: 100,
        }],
        txData: '0x414bf389',
        txTo: MODE_CONTRACTS.swapModeV3PositionManager,
        txValue: 0n,
        path: [MODE_TOKENS.WETH, MODE_TOKENS.USDC],
        poolFees: [3000],
      };

      const tx = await buildModeSwapTransaction(
        mockQuote,
        '0x1234567890123456789012345678901234567890'
      );

      expect(tx.to).toBe(MODE_CONTRACTS.swapModeV3PositionManager);
      expect(tx.data).toBe('0x414bf389');
      expect(tx.value).toBe(0n);
    });

    it('should include value for native ETH swaps', async () => {
      const mockQuote: ModeQuote = {
        aggregator: 'swapmode-v2',
        amountOut: 2000000000n,
        estimatedGas: 150000n,
        priceImpact: 0.5,
        route: [],
        txData: '0x7ff36ab5',
        txTo: MODE_CONTRACTS.swapModeV2Router,
        txValue: 1000000000000000000n, // 1 ETH
        path: [MODE_TOKENS.WETH, MODE_TOKENS.MODE],
      };

      const tx = await buildModeSwapTransaction(
        mockQuote,
        '0x1234567890123456789012345678901234567890'
      );

      expect(tx.value).toBe(1000000000000000000n);
    });
  });
});
