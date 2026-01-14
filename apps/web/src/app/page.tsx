'use client'

import Link from 'next/link'
import { Button, Card } from '@/components/ui'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-2xl mx-auto text-center">
        {/* Hero */}
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live on 12 chains
          </div>
          <h1 className="text-5xl font-bold tracking-tight mb-4">
            <span className="gradient-text">Multi-Chain</span>
            <br />
            <span className="text-white">Trading Hub</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-lg mx-auto">
            Free to trade. Pay only when you profit.
            <br />
            <span className="text-zinc-500">15% profit share model</span>
          </p>
        </div>

        {/* CTA */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <Link href="/trade">
            <Button size="lg" className="glow-emerald-sm">
              Start Trading
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" size="lg">
              View Dashboard
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="text-center py-6 card-hover">
            <div className="text-3xl font-bold text-white mb-1">$0</div>
            <div className="text-sm text-zinc-500">Trading Fees</div>
          </Card>
          <Card className="text-center py-6 card-hover">
            <div className="text-3xl font-bold text-emerald-400 mb-1">15%</div>
            <div className="text-sm text-zinc-500">Profit Share</div>
          </Card>
          <Card className="text-center py-6 card-hover">
            <div className="text-3xl font-bold text-white mb-1">12</div>
            <div className="text-sm text-zinc-500">Chains</div>
          </Card>
        </div>

        {/* Chains preview */}
        <div className="mt-12 flex items-center justify-center gap-3 text-2xl">
          <span title="Ethereum">⟠</span>
          <span title="Arbitrum">🔵</span>
          <span title="Base">🔵</span>
          <span title="Optimism">🔴</span>
          <span title="Polygon">💜</span>
          <span title="BNB Chain">🟡</span>
          <span title="Avalanche">🔺</span>
          <span title="Sonic">⚡</span>
          <span title="Berachain">🐻</span>
          <span title="Kaia">🌸</span>
          <span title="TON">💎</span>
          <span title="Sui">🌊</span>
        </div>
      </div>
    </div>
  )
}
