'use client'

import { Card, StatCard, Badge } from '@/components/ui'
import { Header, PageContainer } from '@/components/layout'
import { TradeHistory } from '@/components/features'

const mockTrades = [
  {
    id: '1',
    type: 'swap' as const,
    status: 'completed' as const,
    fromToken: 'ETH',
    toToken: 'USDC',
    fromAmount: '1.5',
    toAmount: '2,850',
    fromChain: 'Ethereum',
    toChain: 'Ethereum',
    timestamp: new Date(Date.now() - 3600000),
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    profit: '42.50',
    fee: '6.38',
  },
  {
    id: '2',
    type: 'bridge' as const,
    status: 'pending' as const,
    fromToken: 'USDC',
    toToken: 'USDC',
    fromAmount: '1,000',
    toAmount: '999.50',
    fromChain: 'Ethereum',
    toChain: 'Arbitrum',
    timestamp: new Date(Date.now() - 300000),
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  },
]

const chainStatus = [
  { name: 'Ethereum', icon: '⟠', status: 'connected' },
  { name: 'Arbitrum', icon: '🔵', status: 'connected' },
  { name: 'Sonic', icon: '⚡', status: 'available' },
  { name: 'Kaia', icon: '🌸', status: 'available' },
  { name: 'Berachain', icon: '🐻', status: 'available' },
  { name: 'Sui', icon: '🌊', status: 'coming_soon' },
]

export default function DashboardPage() {
  return (
    <>
      <Header />
      <PageContainer
        title="Dashboard"
        subtitle="Overview of your trading activity"
      >
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Portfolio Value"
            value="$12,450.00"
            change={5.23}
          />
          <StatCard
            label="Total Profit/Loss"
            value="$1,234.56"
            change={12.5}
            subtext="All time"
          />
          <StatCard
            label="Active Chains"
            value="2"
            subtext="Connected"
          />
          <StatCard
            label="Pending Trades"
            value="1"
            subtext="In queue"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Trades */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Trades</h2>
              <a href="/portfolio" className="text-sm text-emerald-400 hover:text-emerald-300">
                View all
              </a>
            </div>
            <TradeHistory trades={mockTrades} />
          </Card>

          {/* Chain Status */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Chain Status</h2>
            <div className="space-y-3">
              {chainStatus.map((chain) => (
                <div
                  key={chain.name}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{chain.icon}</span>
                    <span className="text-sm font-medium text-white">{chain.name}</span>
                  </div>
                  <Badge
                    variant={
                      chain.status === 'connected'
                        ? 'success'
                        : chain.status === 'available'
                        ? 'default'
                        : 'warning'
                    }
                  >
                    {chain.status === 'connected'
                      ? 'Connected'
                      : chain.status === 'available'
                      ? 'Available'
                      : 'Coming Soon'}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Quick Actions</h2>
              <p className="text-sm text-zinc-500 mt-1">Get started with common tasks</p>
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
