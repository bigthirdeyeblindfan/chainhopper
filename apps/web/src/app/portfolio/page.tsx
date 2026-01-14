'use client'

import { useState } from 'react'
import { usePortfolio, useAuth } from '@/hooks'
import type { Holding } from '@/lib/api'

const CHAINS = ['All Chains', 'Sonic', 'Kaia', 'Berachain', 'Sui', 'TON', 'Ethereum', 'Base']

export default function PortfolioPage() {
  const [selectedChain, setSelectedChain] = useState(0)
  const { isAuthenticated } = useAuth()
  const { data: portfolio, isLoading, error, refetch } = usePortfolio({
    immediate: isAuthenticated,
  })

  const formatUsd = (value: string | undefined) => {
    if (!value) return '$0.00'
    const num = parseFloat(value)
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num)
  }

  const formatPercent = (value: number | undefined) => {
    if (value === undefined) return '0.00%'
    const sign = value >= 0 ? '+' : ''
    return `${sign}${value.toFixed(2)}%`
  }

  const getPercentColor = (value: number | undefined) => {
    if (!value) return 'text-gray-400'
    return value >= 0 ? 'text-green-500' : 'text-red-500'
  }

  // Filter holdings by selected chain
  const filteredHoldings = portfolio?.holdings?.filter((holding: Holding) => {
    if (selectedChain === 0) return true // All chains
    const chainName = CHAINS[selectedChain]
    return holding.chainId?.toLowerCase() === chainName?.toLowerCase()
  }) ?? []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your holdings across all chains
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Syncing...' : 'Sync'}
          </button>
        )}
      </div>

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
          <p className="text-3xl font-bold mt-1">
            {isLoading ? '...' : formatUsd(portfolio?.totalValueUsd)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">24h Change</p>
          <p className={`text-3xl font-bold mt-1 ${getPercentColor(portfolio?.change24h)}`}>
            {isLoading ? '...' : formatUsd(portfolio?.change24hUsd)}
          </p>
          <p className={`text-sm ${getPercentColor(portfolio?.change24h)}`}>
            {formatPercent(portfolio?.change24h)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">All-Time P&L</p>
          <p className={`text-3xl font-bold mt-1 ${getPercentColor(portfolio?.allTimePnlPercent)}`}>
            {isLoading ? '...' : formatUsd(portfolio?.allTimePnl)}
          </p>
          <p className={`text-sm ${getPercentColor(portfolio?.allTimePnlPercent)}`}>
            {formatPercent(portfolio?.allTimePnlPercent)}
          </p>
        </div>
      </div>

      {/* Chain Selector */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CHAINS.map((chain, i) => (
          <button
            key={chain}
            onClick={() => setSelectedChain(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              i === selectedChain
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {chain}
          </button>
        ))}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
          {error.message}
        </div>
      )}

      {/* Holdings Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Holdings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Chain
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  24h
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  P&L
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Loading...</span>
                    </div>
                  </td>
                </tr>
              ) : !isAuthenticated ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <p>Connect your wallet to view your portfolio</p>
                  </td>
                </tr>
              ) : filteredHoldings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <p>No tokens found</p>
                    <p className="text-sm mt-1">Your holdings will appear here</p>
                  </td>
                </tr>
              ) : (
                filteredHoldings.map((holding: Holding) => (
                  <tr key={`${holding.chainId}-${holding.token.address}`} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {holding.token.logoUrl && (
                          <img
                            src={holding.token.logoUrl}
                            alt={holding.token.symbol}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div>
                          <p className="font-medium">{holding.token.symbol}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {holding.token.name}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {holding.chainId}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-medium">{parseFloat(holding.balance).toLocaleString()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        @ {formatUsd(holding.price)}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      {formatUsd(holding.balanceUsd)}
                    </td>
                    <td className={`px-6 py-4 text-right ${getPercentColor(holding.change24h)}`}>
                      {formatPercent(holding.change24h)}
                    </td>
                    <td className={`px-6 py-4 text-right ${getPercentColor(holding.unrealizedPnlPercent)}`}>
                      <p>{formatUsd(holding.unrealizedPnl)}</p>
                      <p className="text-sm">{formatPercent(holding.unrealizedPnlPercent)}</p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Positions */}
      <div className="mt-8 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Open Positions</h2>
        </div>
        <div className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
          <p>No open positions</p>
          <p className="text-sm mt-1">Your active trades will appear here</p>
        </div>
      </div>
    </div>
  )
}
