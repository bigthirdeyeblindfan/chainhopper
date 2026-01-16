// Contract addresses on Kaia Testnet (Kairos)
export const KAIA_TESTNET_CONTRACTS = {
  swapRouter: '0x504E63f56F4FA673D5FbB9379A1d0BbC9A13E6CF' as const,
  feeCollector: '0xCa0b9E22045A01B891fA4c6C075E6e1796f8467A' as const,
  referralRegistry: '0x1e5467B7AED7EaccFC853D0e2f24F21fcEF77E23' as const,
  mockDexRouter: '0x2f91C5F2CE14e0561F390a25C0A3D3f5DC4D8b05' as const,
  wkaia: '0xD52C4a0F127dF2ed1C07c3a83abA5018727AbF6e' as const,
  mUSDT: '0xD470E9A24f0393fd3508ECd96D5aCBF501722C8B' as const,
  mUSDC: '0x695a107f0643B7E321Bb2Fe8f53bC691E1AEb401' as const,
}

// DEX ID for mock DEX (keccak256("mock-dex"))
export const MOCK_DEX_ID = '0x2c5d8e3a7f1b4c6d9a0e5f8b7c4d2a1e6f9b0c3d8a7e5f4c1b2d3a6e9f0c7b4a' as const

// Token list for Kaia Testnet
export const KAIA_TESTNET_TOKENS = [
  {
    address: 'native' as const,
    symbol: 'KAIA',
    name: 'Kaia',
    decimals: 18,
    logoUrl: undefined,
  },
  {
    address: KAIA_TESTNET_CONTRACTS.wkaia,
    symbol: 'WKAIA',
    name: 'Wrapped KAIA',
    decimals: 18,
    logoUrl: undefined,
  },
  {
    address: KAIA_TESTNET_CONTRACTS.mUSDT,
    symbol: 'mUSDT',
    name: 'Mock USDT',
    decimals: 18,
    logoUrl: undefined,
  },
  {
    address: KAIA_TESTNET_CONTRACTS.mUSDC,
    symbol: 'mUSDC',
    name: 'Mock USDC',
    decimals: 18,
    logoUrl: undefined,
  },
]

// ABIs
export const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'allowance',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
  {
    name: 'decimals',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint8' }],
  },
  {
    name: 'symbol',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'name',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'string' }],
  },
] as const

export const SWAP_ROUTER_ABI = [
  {
    name: 'swap',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'dexId', type: 'bytes32' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'getQuote',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'dexId', type: 'bytes32' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [{ name: 'amountOut', type: 'uint256' }],
  },
  {
    name: 'getBestQuote',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    outputs: [
      { name: 'bestDexId', type: 'bytes32' },
      { name: 'bestAmountOut', type: 'uint256' },
    ],
  },
  {
    name: 'getRegisteredDexes',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'bytes32[]' }],
  },
  {
    name: 'getDexInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'dexId', type: 'bytes32' }],
    outputs: [
      { name: 'router', type: 'address' },
      { name: 'weth', type: 'address' },
      { name: 'enabled', type: 'bool' },
      { name: 'volume', type: 'uint256' },
    ],
  },
  {
    name: 'totalVolumeRouted',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'totalSwapsExecuted',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const

export const REFERRAL_REGISTRY_ABI = [
  {
    name: 'registerReferralCode',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [],
  },
  {
    name: 'useReferralCode',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'code', type: 'string' }],
    outputs: [],
  },
  {
    name: 'getUserTierInfo',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [
      { name: 'tier', type: 'uint8' },
      { name: 'feeRate', type: 'uint256' },
      { name: 'referralCount', type: 'uint256' },
      { name: 'totalEarnings', type: 'uint256' },
    ],
  },
  {
    name: 'getReferralCode',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'string' }],
  },
  {
    name: 'getReferrer',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'user', type: 'address' }],
    outputs: [{ name: '', type: 'address' }],
  },
] as const

export const FEE_COLLECTOR_ABI = [
  {
    name: 'calculateProfitFee',
    type: 'function',
    stateMutability: 'view',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'profit', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'uint256' }],
  },
  {
    name: 'collectFee',
    type: 'function',
    stateMutability: 'payable',
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'profit', type: 'uint256' },
    ],
    outputs: [{ name: 'fee', type: 'uint256' }],
  },
] as const
