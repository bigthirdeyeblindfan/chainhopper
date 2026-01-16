'use client'

import { useState } from 'react'
import { useAccount, useBalance, useChains } from 'wagmi'
import { formatUnits } from 'viem'
import { Card, StatCard, Button } from '@/components/ui'
import { Header, PageContainer } from '@/components/layout'
import { ConnectWallet } from '@/components/features/ConnectWallet'

// Chain metadata
const chainMeta: Record<number, { name: string; icon: string; symbol: string }> = {
  1: { name: 'Ethereum', icon: '⟠', symbol: 'ETH' },
  42161: { name: 'Arbitrum', icon: '🔵', symbol: 'ETH' },
  10: { name: 'Optimism', icon: '🔴', symbol: 'ETH' },
  8453: { name: 'Base', icon: '🔷', symbol: 'ETH' },
  137: { name: 'Polygon', icon: '🟣', symbol: 'MATIC' },
  8217: { name: 'Kaia', icon: '🌸', symbol: 'KAIA' },
  1001: { name: 'Kaia Testnet', icon: '🌸', symbol: 'KAIA' },
}

function ChainBalance({ chainId, address }: { chainId: number; address: `0x${string}` }) {
  const { data: balance, isLoading } = useBalance({
    address,
    chainId,
  })

  const meta = chainMeta[chainId] || { name: 'Unknown', icon: '?', symbol: '???' }
  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(6)
    : '0.000000'

  const hasBalance = balance && balance.value > 0n

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl ${hasBalance ? 'bg-white/5' : 'bg-white/[0.02]'}`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">{meta.icon}</span>
        <div>
          <p className="font-medium text-white">{meta.name}</p>
          <p className="text-sm text-zinc-500">{meta.symbol}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`font-mono ${hasBalance ? 'text-white' : 'text-zinc-600'}`}>
          {isLoading ? '...' : formattedBalance}
        </p>
        <p className="text-sm text-zinc-500">{meta.symbol}</p>
      </div>
    </div>
  )
}

export default function PortfolioPage() {
  const { address, isConnected } = useAccount()
  const chains = useChains()
  const [showZeroBalances, setShowZeroBalances] = useState(false)

  // Get balance for first chain to show total (simplified)
  const { data: mainBalance } = useBalance({ address })

  if (!isConnected || !address) {
    return (
      <>
        <Header />
        <PageContainer
          title="Portfolio"
          subtitle="Connect your wallet to view holdings"
        >
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Wallet Connected</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Connect your wallet to view your holdings across all supported chains.
            </p>
            <ConnectWallet className="inline-block" />
          </Card>
        </PageContainer>
      </>
    )
  }

  return (
    <>
      <Header />
      <PageContainer
        title="Portfolio"
        subtitle={`Viewing holdings for ${address.slice(0, 6)}...${address.slice(-4)}`}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowZeroBalances(!showZeroBalances)}
          >
            {showZeroBalances ? 'Hide' : 'Show'} Zero Balances
          </Button>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Connected Chains"
            value={chains.length.toString()}
          />
          <StatCard
            label="Wallet Address"
            value={`${address.slice(0, 8)}...${address.slice(-6)}`}
          />
          <StatCard
            label="Current Balance"
            value={mainBalance ? `${parseFloat(formatUnits(mainBalance.value, mainBalance.decimals)).toFixed(4)} ${mainBalance.symbol}` : 'Loading...'}
          />
        </div>

        {/* Holdings by Chain */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">Holdings by Chain</h2>
            <span className="text-sm text-zinc-500">{chains.length} chains configured</span>
          </div>

          <div className="space-y-3">
            {chains.map((chain) => (
              <ChainBalance
                key={chain.id}
                chainId={chain.id}
                address={address}
              />
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-white/5">
            <p className="text-sm text-zinc-500 text-center">
              Balances fetched directly from RPC endpoints. Token balances coming soon.
            </p>
          </div>
        </Card>
      </PageContainer>
    </>
  )
}
