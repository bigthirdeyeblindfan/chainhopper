'use client'

import { useAccount, useBalance, useChainId, useChains } from 'wagmi'
import { formatUnits } from 'viem'
import { Card, StatCard, Badge, Button } from '@/components/ui'
import { Header, PageContainer } from '@/components/layout'
import { ConnectWallet } from '@/components/features/ConnectWallet'

// Chain metadata for display
const chainMeta: Record<number, { name: string; icon: string; symbol: string }> = {
  1: { name: 'Ethereum', icon: '⟠', symbol: 'ETH' },
  42161: { name: 'Arbitrum', icon: '🔵', symbol: 'ETH' },
  10: { name: 'Optimism', icon: '🔴', symbol: 'ETH' },
  8453: { name: 'Base', icon: '🔷', symbol: 'ETH' },
  137: { name: 'Polygon', icon: '🟣', symbol: 'MATIC' },
  8217: { name: 'Kaia', icon: '🌸', symbol: 'KAIA' },
  1001: { name: 'Kaia Testnet', icon: '🌸', symbol: 'KAIA' },
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const chains = useChains()

  // Get balance for current chain
  const { data: balance, isLoading: balanceLoading } = useBalance({
    address,
  })

  const currentChain = chainMeta[chainId] || { name: 'Unknown', icon: '?', symbol: '???' }

  // Format balance
  const formattedBalance = balance
    ? parseFloat(formatUnits(balance.value, balance.decimals)).toFixed(4)
    : '0.0000'

  if (!isConnected) {
    return (
      <>
        <Header />
        <PageContainer
          title="Dashboard"
          subtitle="Connect your wallet to view your portfolio"
        >
          <Card className="text-center py-12">
            <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No Wallet Connected</h3>
            <p className="text-zinc-400 mb-6 max-w-md mx-auto">
              Connect your wallet to view your portfolio, balances, and start trading across multiple chains.
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
        title="Dashboard"
        subtitle={`Connected: ${address?.slice(0, 6)}...${address?.slice(-4)}`}
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label={`${currentChain.symbol} Balance`}
            value={balanceLoading ? 'Loading...' : `${formattedBalance} ${currentChain.symbol}`}
          />
          <StatCard
            label="Connected Chain"
            value={currentChain.name}
          />
          <StatCard
            label="Available Chains"
            value={chains.length.toString()}
          />
          <StatCard
            label="Wallet"
            value={`${address?.slice(0, 6)}...${address?.slice(-4)}`}
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Chain Balance */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Current Balance</h2>
            <div className="p-6 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl border border-emerald-500/20">
              <div className="flex items-center gap-4">
                <span className="text-4xl">{currentChain.icon}</span>
                <div>
                  <p className="text-3xl font-bold text-white">
                    {balanceLoading ? '...' : formattedBalance}
                  </p>
                  <p className="text-zinc-400">{currentChain.symbol} on {currentChain.name}</p>
                </div>
              </div>
            </div>

            {balance && balance.value > 0n && (
              <div className="mt-4 flex gap-3">
                <a
                  href="/trade"
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors text-center"
                >
                  Swap
                </a>
                <button className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors">
                  Bridge
                </button>
              </div>
            )}
          </Card>

          {/* Available Chains */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Available Chains</h2>
            <div className="space-y-3">
              {chains.map((chain) => {
                const meta = chainMeta[chain.id] || { name: chain.name, icon: '🔗', symbol: '?' }
                const isActive = chain.id === chainId
                return (
                  <div
                    key={chain.id}
                    className={`flex items-center justify-between p-3 rounded-xl ${
                      isActive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{meta.icon}</span>
                      <div>
                        <span className="text-sm font-medium text-white">{meta.name}</span>
                        {chain.testnet && (
                          <span className="ml-2 text-xs text-zinc-500">(Testnet)</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={isActive ? 'success' : 'default'}>
                      {isActive ? 'Connected' : 'Available'}
                    </Badge>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <p className="text-sm text-zinc-500 mt-1">Trade across chains with the best rates</p>
            </div>
            <div className="flex gap-3">
              <a
                href="/trade"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-medium rounded-xl transition-colors"
              >
                New Trade
              </a>
              <a
                href="/portfolio"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors"
              >
                View Portfolio
              </a>
            </div>
          </div>
        </Card>
      </PageContainer>
    </>
  )
}
