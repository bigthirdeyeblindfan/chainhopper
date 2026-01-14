/**
 * Contract ABIs for ChainHopper smart contracts
 * Generated from Solidity contract interfaces
 */

export const FeeCollectorABI = [
  // Read functions
  {
    inputs: [{ name: 'user', type: 'address' }, { name: 'profit', type: 'uint256' }],
    name: 'calculateProfitFee',
    outputs: [
      { name: 'fee', type: 'uint256' },
      { name: 'netProfit', type: 'uint256' },
      { name: 'referralReward', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserTierInfo',
    outputs: [
      { name: 'tier', type: 'uint8' },
      { name: 'profitShareBps', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getUserStats',
    outputs: [
      {
        components: [
          { name: 'referrer', type: 'address' },
          { name: 'tier', type: 'uint8' },
          { name: 'weeklyVolume', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' },
          { name: 'totalProfitsPaid', type: 'uint256' },
          { name: 'totalFeesPaid', type: 'uint256' },
        ],
        name: 'account',
        type: 'tuple',
      },
      { name: 'currentReferralTier', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '', type: 'uint8' }],
    name: 'tierConfigs',
    outputs: [
      { name: 'profitShareBps', type: 'uint256' },
      { name: 'active', type: 'bool' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'treasury',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalVolume',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalFeesCollected',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalReferralsPaid',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalTrades',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [{ name: 'referrer', type: 'address' }],
    name: 'registerReferrer',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'user', type: 'address' },
      { name: 'token', type: 'address' },
      { name: 'profit', type: 'uint256' },
    ],
    name: 'collectProfitFee',
    outputs: [
      { name: 'fee', type: 'uint256' },
      { name: 'netProfit', type: 'uint256' },
    ],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [{ name: 'token', type: 'address' }],
    name: 'claimReferralEarnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'token', type: 'address' },
      { indexed: false, name: 'profit', type: 'uint256' },
      { indexed: false, name: 'fee', type: 'uint256' },
      { indexed: true, name: 'referrer', type: 'address' },
      { indexed: false, name: 'referralReward', type: 'uint256' },
    ],
    name: 'ProfitFeeCollected',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'referrer', type: 'address' },
    ],
    name: 'ReferralRegistered',
    type: 'event',
  },
] as const;

export const SwapRouterABI = [
  // Read functions
  {
    inputs: [],
    name: 'feeCollector',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'dexId', type: 'bytes32' }],
    name: 'dexRouters',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'dexId', type: 'bytes32' }],
    name: 'dexEnabled',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'dexId', type: 'bytes32' }],
    name: 'getDexInfo',
    outputs: [
      { name: 'router', type: 'address' },
      { name: 'weth', type: 'address' },
      { name: 'enabled', type: 'bool' },
      { name: 'volume', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getRegisteredDexes',
    outputs: [{ name: '', type: 'bytes32[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'dexId', type: 'bytes32' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    name: 'getQuote',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
    ],
    name: 'getBestQuote',
    outputs: [
      { name: 'bestDexId', type: 'bytes32' },
      { name: 'bestAmountOut', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalVolumeRouted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSwapsExecuted',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [
      { name: 'dexId', type: 'bytes32' },
      { name: 'tokenIn', type: 'address' },
      { name: 'tokenOut', type: 'address' },
      { name: 'amountIn', type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'deadline', type: 'uint256' },
    ],
    name: 'swap',
    outputs: [{ name: 'amountOut', type: 'uint256' }],
    stateMutability: 'payable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'dexId', type: 'bytes32' },
      { indexed: false, name: 'tokenIn', type: 'address' },
      { indexed: false, name: 'tokenOut', type: 'address' },
      { indexed: false, name: 'amountIn', type: 'uint256' },
      { indexed: false, name: 'amountOut', type: 'uint256' },
    ],
    name: 'SwapExecuted',
    type: 'event',
  },
] as const;

export const ReferralRegistryABI = [
  // Read functions
  {
    inputs: [{ name: 'code', type: 'bytes32' }],
    name: 'codeToOwner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'ownerToCode',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'referrerOf',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getReferrer',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'code', type: 'bytes32' }],
    name: 'getCodeOwner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'getCode',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'code', type: 'bytes32' }],
    name: 'isCodeAvailable',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'referrer', type: 'address' }],
    name: 'getReferrerStats',
    outputs: [
      {
        components: [
          { name: 'totalReferrals', type: 'uint256' },
          { name: 'activeReferrals', type: 'uint256' },
          { name: 'totalVolume', type: 'uint256' },
          { name: 'weeklyVolume', type: 'uint256' },
          { name: 'totalEarnings', type: 'uint256' },
          { name: 'pendingEarnings', type: 'uint256' },
          { name: 'tier', type: 'uint8' },
        ],
        name: 'stats',
        type: 'tuple',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'getReferralDetails',
    outputs: [
      { name: 'referrer', type: 'address' },
      { name: 'code', type: 'bytes32' },
      { name: 'referrerTier', type: 'uint8' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'getProtocolStats',
    outputs: [
      { name: 'codes', type: 'uint256' },
      { name: 'referrals', type: 'uint256' },
      { name: 'volume', type: 'uint256' },
      { name: 'earnings', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  // Write functions
  {
    inputs: [{ name: 'code', type: 'bytes32' }],
    name: 'registerCode',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'code', type: 'bytes32' }],
    name: 'useCode',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'owner', type: 'address' },
      { indexed: true, name: 'code', type: 'bytes32' },
    ],
    name: 'CodeRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'referrer', type: 'address' },
      { indexed: true, name: 'code', type: 'bytes32' },
    ],
    name: 'ReferralCreated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'user', type: 'address' },
      { indexed: true, name: 'referrer', type: 'address' },
      { indexed: false, name: 'volume', type: 'uint256' },
    ],
    name: 'VolumeRecorded',
    type: 'event',
  },
] as const;
