'use client'

import { Card } from '@/components/ui'
import { Header, PageContainer } from '@/components/layout'
import { SwapCard, TradeHistory } from '@/components/features'

const recentTrades = [
  {
    id: '1',
    type: 'swap' as const,
    status: 'completed' as const,
    fromToken: 'ETH',
    toToken: 'USDC',
    fromAmount: '0.5',
    toAmount: '950',
    fromChain: 'Ethereum',
    toChain: 'Ethereum',
    timestamp: new Date(Date.now() - 1800000),
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    profit: '15.00',
    fee: '2.25',
  },
]

export default function TradePage() {
  return (
    <>
      <Header />
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Swap Interface */}
          <div className="lg:col-span-2">
            <SwapCard />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Token Info */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Token Info</h3>
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-white/5 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-zinc-500 text-sm">Select a token to view details</p>
              </div>
            </Card>

            {/* Recent Trades */}
            <Card>
              <h3 className="text-lg font-semibold text-white mb-4">Recent Trades</h3>
              <TradeHistory trades={recentTrades} />
            </Card>

            {/* Safety Check */}
            <Card className="gradient-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-white">Safety Check</h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    Rug detection will analyze the token when selected
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
