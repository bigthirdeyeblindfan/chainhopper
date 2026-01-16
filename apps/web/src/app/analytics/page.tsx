'use client'

import { useState } from 'react'
import { Card, StatCard, Button } from '@/components/ui'
import { Header, PageContainer } from '@/components/layout'

const periods = ['24h', '7d', '30d', '90d', 'All']

export default function AnalyticsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('30d')

  return (
    <>
      <Header />
      <PageContainer
        title="Analytics"
        subtitle="Detailed insights into your trading performance"
      >
        {/* Period Selector */}
        <div className="flex gap-2 mb-8">
          {periods.map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${selectedPeriod === period
                  ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                  : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                }
              `}
            >
              {period}
            </button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Trades" value="47" />
          <StatCard label="Win Rate" value="68%" change="+5.2%" />
          <StatCard label="Total Volume" value="$125,430" />
          <StatCard label="Fees Saved" value="$1,254" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">P&L Over Time</h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                <p className="text-zinc-500 text-sm">Chart will appear here</p>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-white mb-4">Volume by Chain</h2>
            <div className="h-64 flex items-center justify-center border border-dashed border-white/10 rounded-xl">
              <div className="text-center">
                <svg className="w-12 h-12 mx-auto mb-3 text-zinc-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-zinc-500 text-sm">Chart will appear here</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Breakdown */}
        <Card className="mb-8">
          <h2 className="text-lg font-semibold text-white mb-6">Performance Breakdown</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-4">Best Trades</h3>
              <div className="space-y-3">
                {[
                  { pair: 'ETH → USDC', profit: '+$420', percent: '+12.5%' },
                  { pair: 'ARB → ETH', profit: '+$180', percent: '+8.2%' },
                  { pair: 'WBTC → USDC', profit: '+$95', percent: '+4.1%' },
                ].map((trade, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm text-white">{trade.pair}</span>
                    <div className="text-right">
                      <span className="text-sm text-emerald-400">{trade.profit}</span>
                      <span className="text-xs text-zinc-500 ml-2">{trade.percent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-4">Worst Trades</h3>
              <div className="space-y-3">
                {[
                  { pair: 'SHIB → ETH', loss: '-$85', percent: '-15.2%' },
                  { pair: 'DOGE → USDC', loss: '-$42', percent: '-8.5%' },
                  { pair: 'PEPE → ETH', loss: '-$28', percent: '-5.1%' },
                ].map((trade, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm text-white">{trade.pair}</span>
                    <div className="text-right">
                      <span className="text-sm text-red-400">{trade.loss}</span>
                      <span className="text-xs text-zinc-500 ml-2">{trade.percent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-zinc-500 mb-4">Most Traded</h3>
              <div className="space-y-3">
                {[
                  { token: 'ETH', volume: '$45,230', trades: '23' },
                  { token: 'USDC', volume: '$38,100', trades: '18' },
                  { token: 'ARB', volume: '$12,400', trades: '12' },
                ].map((token, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-sm text-white">{token.token}</span>
                    <div className="text-right">
                      <span className="text-sm text-white">{token.volume}</span>
                      <span className="text-xs text-zinc-500 ml-2">{token.trades} trades</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Fee Summary */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-teal-500/20 border border-emerald-500/20 p-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <h2 className="text-lg font-semibold text-white mb-2">Profit-Share Fee Model</h2>
          <p className="text-zinc-400 text-sm mb-6">
            You only pay fees when you profit. Here&apos;s your breakdown:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Profitable Trades</p>
              <p className="text-3xl font-bold text-white">32</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Total Profit</p>
              <p className="text-3xl font-bold text-emerald-400">$4,250</p>
            </div>
            <div>
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Fees Paid (15%)</p>
              <p className="text-3xl font-bold text-white">$637.50</p>
            </div>
          </div>
        </div>
      </PageContainer>
    </>
  )
}
