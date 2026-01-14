'use client'

import { useState } from 'react'
import { Card, StatCard, Button, Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui'
import { Header, PageContainer } from '@/components/layout'
import { PortfolioTable, TradeHistory } from '@/components/features'

const mockAssets = [
  { symbol: 'ETH', name: 'Ethereum', chain: 'ethereum', balance: '2.5', value: '4,750.00', price: '1,900.00', change24h: 2.34 },
  { symbol: 'USDC', name: 'USD Coin', chain: 'ethereum', balance: '5,000', value: '5,000.00', price: '1.00', change24h: 0.01 },
  { symbol: 'ARB', name: 'Arbitrum', chain: 'arbitrum', balance: '1,500', value: '1,800.00', price: '1.20', change24h: -1.5 },
  { symbol: 'WBTC', name: 'Wrapped Bitcoin', chain: 'ethereum', balance: '0.05', value: '2,100.00', price: '42,000.00', change24h: 3.2 },
]

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
    type: 'swap' as const,
    status: 'completed' as const,
    fromToken: 'ARB',
    toToken: 'ETH',
    fromAmount: '500',
    toAmount: '0.32',
    fromChain: 'Arbitrum',
    toChain: 'Arbitrum',
    timestamp: new Date(Date.now() - 86400000),
    txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    profit: '12.00',
    fee: '1.80',
  },
]

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('holdings')

  return (
    <>
      <Header />
      <PageContainer
        title="Portfolio"
        subtitle="Track your holdings across all chains"
        action={
          <Button variant="secondary" size="sm">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Sync
          </Button>
        }
      >
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <StatCard
            label="Total Value"
            value="$13,650.00"
            change={4.5}
          />
          <StatCard
            label="24h Change"
            value="$612.50"
            change={4.5}
          />
          <StatCard
            label="All-Time P&L"
            value="$2,150.00"
            change={18.7}
          />
        </div>

        {/* Tabs */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="holdings">Holdings</TabsTrigger>
              <TabsTrigger value="history">Trade History</TabsTrigger>
              <TabsTrigger value="positions">Open Positions</TabsTrigger>
            </TabsList>

            <TabsContent value="holdings">
              <PortfolioTable assets={mockAssets} />
            </TabsContent>

            <TabsContent value="history">
              <TradeHistory trades={mockTrades} />
            </TabsContent>

            <TabsContent value="positions">
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <p className="text-zinc-400 font-medium">No open positions</p>
                <p className="text-zinc-600 text-sm mt-1">Your active trades will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </PageContainer>
    </>
  )
}
