'use client'

import { Badge } from '../ui'

interface Trade {
  id: string
  type: 'swap' | 'bridge'
  status: 'completed' | 'pending' | 'failed'
  fromToken: string
  toToken: string
  fromAmount: string
  toAmount: string
  fromChain: string
  toChain: string
  timestamp: Date
  txHash: string
  profit?: string
  fee?: string
}

interface TradeHistoryProps {
  trades: Trade[]
  isLoading?: boolean
}

export function TradeHistory({ trades, isLoading }: TradeHistoryProps) {
  if (isLoading) {
    return <TradeHistorySkeleton />
  }

  if (trades.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <p className="text-zinc-400 font-medium">No trades yet</p>
        <p className="text-zinc-600 text-sm mt-1">Your trade history will appear here</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {trades.map((trade) => (
        <TradeCard key={trade.id} trade={trade} />
      ))}
    </div>
  )
}

function TradeCard({ trade }: { trade: Trade }) {
  const statusColors = {
    completed: 'success',
    pending: 'warning',
    failed: 'error',
  } as const

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="p-4 bg-white/5 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Trade info */}
        <div className="flex items-center gap-3">
          <div className={`
            w-10 h-10 rounded-xl flex items-center justify-center
            ${trade.type === 'swap' ? 'bg-emerald-500/10' : 'bg-blue-500/10'}
          `}>
            {trade.type === 'swap' ? (
              <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">
                {trade.fromAmount} {trade.fromToken}
              </span>
              <svg className="w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="font-medium text-white">
                {trade.toAmount} {trade.toToken}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-zinc-500">{trade.fromChain}</span>
              {trade.fromChain !== trade.toChain && (
                <>
                  <span className="text-zinc-600">→</span>
                  <span className="text-xs text-zinc-500">{trade.toChain}</span>
                </>
              )}
              <span className="text-zinc-700">•</span>
              <span className="text-xs text-zinc-500">{formatTime(trade.timestamp)}</span>
            </div>
          </div>
        </div>

        {/* Right: Status & profit */}
        <div className="text-right">
          <Badge variant={statusColors[trade.status]}>
            {trade.status}
          </Badge>
          {trade.profit && (
            <div className="mt-2">
              <span className="text-sm text-emerald-400">+${trade.profit}</span>
              {trade.fee && (
                <span className="text-xs text-zinc-500 ml-1">
                  (fee: ${trade.fee})
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Transaction hash */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <a
          href={`https://etherscan.io/tx/${trade.txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-zinc-500 hover:text-zinc-400 transition-colors font-mono"
        >
          {trade.txHash.slice(0, 10)}...{trade.txHash.slice(-8)}
          <svg className="w-3 h-3 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  )
}

function TradeHistorySkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 bg-white/5 rounded-xl animate-pulse">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-zinc-700 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-zinc-700 rounded w-48" />
              <div className="h-3 bg-zinc-800 rounded w-32" />
            </div>
            <div className="h-6 bg-zinc-700 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
