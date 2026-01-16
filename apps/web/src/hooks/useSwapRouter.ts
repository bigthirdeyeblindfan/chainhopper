'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, formatEther, parseUnits, formatUnits, keccak256, toBytes } from 'viem'
import { KAIA_TESTNET_CONTRACTS, SWAP_ROUTER_ABI, ERC20_ABI } from '@/lib/web3'

// DEX ID for mock DEX
const MOCK_DEX_ID = keccak256(toBytes('mock-dex'))

interface UseQuoteParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  decimalsIn?: number
}

export function useQuote({ tokenIn, tokenOut, amountIn, decimalsIn = 18 }: UseQuoteParams) {
  const parsedAmount = amountIn ? parseUnits(amountIn, decimalsIn) : BigInt(0)

  // Convert 'native' to address(0)
  const tokenInAddress = tokenIn === 'native' ? '0x0000000000000000000000000000000000000000' : tokenIn
  const tokenOutAddress = tokenOut === 'native' ? '0x0000000000000000000000000000000000000000' : tokenOut

  const { data, isLoading, error, refetch } = useReadContract({
    address: KAIA_TESTNET_CONTRACTS.swapRouter,
    abi: SWAP_ROUTER_ABI,
    functionName: 'getQuote',
    args: [MOCK_DEX_ID, tokenInAddress as `0x${string}`, tokenOutAddress as `0x${string}`, parsedAmount],
    query: {
      enabled: !!tokenIn && !!tokenOut && parsedAmount > BigInt(0),
    },
  })

  return {
    quote: data as bigint | undefined,
    quoteFormatted: data ? formatUnits(data as bigint, 18) : undefined,
    isLoading,
    error,
    refetch,
  }
}

interface UseSwapParams {
  tokenIn: string
  tokenOut: string
  amountIn: string
  amountOutMin: string
  decimalsIn?: number
  decimalsOut?: number
}

export function useSwap() {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const swap = async ({
    tokenIn,
    tokenOut,
    amountIn,
    amountOutMin,
    decimalsIn = 18,
    decimalsOut = 18,
  }: UseSwapParams) => {
    const parsedAmountIn = parseUnits(amountIn, decimalsIn)
    const parsedAmountOutMin = parseUnits(amountOutMin, decimalsOut)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200) // 20 minutes

    // Convert 'native' to address(0)
    const tokenInAddress = tokenIn === 'native' ? '0x0000000000000000000000000000000000000000' : tokenIn
    const tokenOutAddress = tokenOut === 'native' ? '0x0000000000000000000000000000000000000000' : tokenOut

    const isNativeIn = tokenIn === 'native'

    writeContract({
      address: KAIA_TESTNET_CONTRACTS.swapRouter,
      abi: SWAP_ROUTER_ABI,
      functionName: 'swap',
      args: [
        MOCK_DEX_ID,
        tokenInAddress as `0x${string}`,
        tokenOutAddress as `0x${string}`,
        parsedAmountIn,
        parsedAmountOutMin,
        deadline,
      ],
      value: isNativeIn ? parsedAmountIn : BigInt(0),
    })
  }

  return {
    swap,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useTokenApproval(tokenAddress: string, spender: string = KAIA_TESTNET_CONTRACTS.swapRouter) {
  const { writeContract, data: hash, isPending, error } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const approve = async (amount: string, decimals: number = 18) => {
    if (tokenAddress === 'native') return // Native token doesn't need approval

    const parsedAmount = parseUnits(amount, decimals)

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, parsedAmount],
    })
  }

  const approveMax = async () => {
    if (tokenAddress === 'native') return

    writeContract({
      address: tokenAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender as `0x${string}`, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
    })
  }

  return {
    approve,
    approveMax,
    hash,
    isPending,
    isConfirming,
    isSuccess,
    error,
  }
}

export function useTokenAllowance(tokenAddress: string, owner: string | undefined, spender: string = KAIA_TESTNET_CONTRACTS.swapRouter) {
  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: [owner as `0x${string}`, spender as `0x${string}`],
    query: {
      enabled: !!owner && tokenAddress !== 'native',
    },
  })

  return {
    allowance: data as bigint | undefined,
    isLoading,
    refetch,
  }
}

export function useTokenBalance(tokenAddress: string, account: string | undefined) {
  const { data, isLoading, refetch } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [account as `0x${string}`],
    query: {
      enabled: !!account && tokenAddress !== 'native',
    },
  })

  return {
    balance: data as bigint | undefined,
    balanceFormatted: data ? formatUnits(data as bigint, 18) : '0',
    isLoading,
    refetch,
  }
}

export function useSwapRouterStats() {
  const { data: totalVolume } = useReadContract({
    address: KAIA_TESTNET_CONTRACTS.swapRouter,
    abi: SWAP_ROUTER_ABI,
    functionName: 'totalVolumeRouted',
  })

  const { data: totalSwaps } = useReadContract({
    address: KAIA_TESTNET_CONTRACTS.swapRouter,
    abi: SWAP_ROUTER_ABI,
    functionName: 'totalSwapsExecuted',
  })

  return {
    totalVolume: totalVolume as bigint | undefined,
    totalVolumeFormatted: totalVolume ? formatEther(totalVolume as bigint) : '0',
    totalSwaps: totalSwaps as bigint | undefined,
  }
}
