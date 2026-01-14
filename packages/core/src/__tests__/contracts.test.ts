import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getContractAddresses,
  areContractsDeployed,
  CONTRACT_ADDRESSES,
  TESTNET_ADDRESSES,
  SUPPORTED_CONTRACT_CHAINS,
} from '../contracts/addresses.js';
import { ReferralRegistryClient } from '../contracts/referral-registry.js';

// Mock viem
vi.mock('viem', () => ({
  createPublicClient: vi.fn().mockReturnValue({
    readContract: vi.fn(),
  }),
  createWalletClient: vi.fn().mockReturnValue({
    writeContract: vi.fn().mockResolvedValue('0xtxhash'),
  }),
  http: vi.fn(),
  encodeFunctionData: vi.fn(),
  encodeAbiParameters: vi.fn(),
  parseAbiParameters: vi.fn(),
  keccak256: vi.fn().mockReturnValue('0xhash'),
  toHex: vi.fn().mockImplementation((val: unknown) => `0x${val}`),
  stringToHex: vi.fn().mockImplementation((str: string) => {
    const hex = Buffer.from(str).toString('hex');
    return `0x${hex.padEnd(64, '0')}`;
  }),
}));

describe('Contract Addresses', () => {
  describe('CONTRACT_ADDRESSES', () => {
    it('should have addresses for all supported chains', () => {
      for (const chainId of SUPPORTED_CONTRACT_CHAINS) {
        expect(CONTRACT_ADDRESSES[chainId]).toBeDefined();
        expect(CONTRACT_ADDRESSES[chainId]?.feeCollector).toBeDefined();
        expect(CONTRACT_ADDRESSES[chainId]?.swapRouter).toBeDefined();
        expect(CONTRACT_ADDRESSES[chainId]?.referralRegistry).toBeDefined();
      }
    });

    it('should have valid address format', () => {
      for (const chainId of SUPPORTED_CONTRACT_CHAINS) {
        const addresses = CONTRACT_ADDRESSES[chainId];
        if (addresses) {
          expect(addresses.feeCollector).toMatch(/^0x[a-fA-F0-9]{40}$/);
          expect(addresses.swapRouter).toMatch(/^0x[a-fA-F0-9]{40}$/);
          expect(addresses.referralRegistry).toMatch(/^0x[a-fA-F0-9]{40}$/);
        }
      }
    });
  });

  describe('TESTNET_ADDRESSES', () => {
    it('should have addresses for testnets', () => {
      expect(TESTNET_ADDRESSES['sepolia']).toBeDefined();
      expect(TESTNET_ADDRESSES['arbitrum-sepolia']).toBeDefined();
      expect(TESTNET_ADDRESSES['base-sepolia']).toBeDefined();
    });
  });

  describe('getContractAddresses', () => {
    it('should return mainnet addresses for mainnet chains', () => {
      const addresses = getContractAddresses('ethereum', false);
      expect(addresses).toBeDefined();
      expect(addresses?.feeCollector).toBeDefined();
    });

    it('should return undefined for non-EVM chains', () => {
      const addresses = getContractAddresses('ton' as any, false);
      expect(addresses).toBeUndefined();
    });
  });

  describe('areContractsDeployed', () => {
    it('should return false for zero addresses', () => {
      // All addresses are currently zero in the template
      const deployed = areContractsDeployed('ethereum', false);
      expect(deployed).toBe(false);
    });

    it('should return false for non-existent chains', () => {
      const deployed = areContractsDeployed('nonexistent' as any, false);
      expect(deployed).toBe(false);
    });
  });

  describe('SUPPORTED_CONTRACT_CHAINS', () => {
    it('should contain expected EVM chains', () => {
      expect(SUPPORTED_CONTRACT_CHAINS).toContain('ethereum');
      expect(SUPPORTED_CONTRACT_CHAINS).toContain('arbitrum');
      expect(SUPPORTED_CONTRACT_CHAINS).toContain('base');
      expect(SUPPORTED_CONTRACT_CHAINS).toContain('polygon');
      expect(SUPPORTED_CONTRACT_CHAINS).toContain('optimism');
    });

    it('should have at least 8 chains', () => {
      expect(SUPPORTED_CONTRACT_CHAINS.length).toBeGreaterThanOrEqual(8);
    });
  });
});

describe('ReferralRegistryClient', () => {
  let client: ReferralRegistryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ReferralRegistryClient({
      chainId: 'ethereum',
      rpcUrl: 'https://eth.llamarpc.com',
    });
  });

  describe('constructor', () => {
    it('should create client with chain ID', () => {
      expect(client.getChainId()).toBe('ethereum');
    });

    it('should use provided contract address', () => {
      const customClient = new ReferralRegistryClient({
        chainId: 'ethereum',
        rpcUrl: 'https://eth.llamarpc.com',
        contractAddress: '0x1234567890123456789012345678901234567890',
      });
      expect(customClient.getAddress()).toBe('0x1234567890123456789012345678901234567890');
    });
  });

  describe('stringToCode', () => {
    it('should convert string to bytes32', () => {
      const code = client.stringToCode('TESTCODE');
      expect(code).toMatch(/^0x/);
      expect(code.length).toBe(66); // 0x + 64 hex chars
    });

    it('should pad short strings', () => {
      const code = client.stringToCode('ABC');
      expect(code.length).toBe(66);
    });
  });

  describe('codeToString', () => {
    it('should convert bytes32 to string', () => {
      // Manually create a hex string for "TEST"
      const hex = '0x' + Buffer.from('TEST').toString('hex').padEnd(64, '0');
      const str = client.codeToString(hex as `0x${string}`);
      expect(str).toBe('TEST');
    });

    it('should handle empty code', () => {
      const str = client.codeToString('0x' + '00'.repeat(32) as `0x${string}`);
      expect(str).toBe('');
    });
  });

  describe('isValidCodeString', () => {
    it('should accept valid codes', () => {
      expect(client.isValidCodeString('HOPPER_ABC')).toBe(true);
      expect(client.isValidCodeString('abc123')).toBe(true);
      expect(client.isValidCodeString('Test_Code_123')).toBe(true);
    });

    it('should reject too short codes', () => {
      expect(client.isValidCodeString('AB')).toBe(false);
      expect(client.isValidCodeString('')).toBe(false);
    });

    it('should reject too long codes', () => {
      const longCode = 'A'.repeat(33);
      expect(client.isValidCodeString(longCode)).toBe(false);
    });

    it('should reject invalid characters', () => {
      expect(client.isValidCodeString('TEST CODE')).toBe(false); // space
      expect(client.isValidCodeString('TEST-CODE')).toBe(false); // hyphen
      expect(client.isValidCodeString('TEST@CODE')).toBe(false); // special char
    });
  });

  describe('generateCode', () => {
    it('should generate unique codes', () => {
      const code1 = client.generateCode();
      const code2 = client.generateCode();
      expect(code1).not.toBe(code2);
    });

    it('should use custom prefix', () => {
      const code = client.generateCode('MYPREFIX');
      const str = client.codeToString(code);
      expect(str).toContain('MYPREFIX');
    });
  });
});

describe('ContractService', () => {
  describe('factory functions', () => {
    it('should be importable', async () => {
      const { createContractService, createContractServices } = await import('../contracts/service.js');
      expect(typeof createContractService).toBe('function');
      expect(typeof createContractServices).toBe('function');
    });
  });
});
