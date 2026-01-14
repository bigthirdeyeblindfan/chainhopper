export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Detailed insights into your trading performance
        </p>
      </div>

      {/* Time Period Selector */}
      <div className="flex gap-2 mb-6">
        {['24h', '7d', '30d', '90d', 'All Time'].map((period, i) => (
          <button
            key={period}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              i === 2
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {period}
          </button>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold mt-1">0</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Win Rate</p>
          <p className="text-2xl font-bold mt-1">--%</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Volume</p>
          <p className="text-2xl font-bold mt-1">$0.00</p>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Fees Saved</p>
          <p className="text-2xl font-bold mt-1 text-green-500">$0.00</p>
          <p className="text-xs text-gray-500 mt-1">vs 1% flat fee</p>
        </div>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">P&L Over Time</h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p>Chart will appear here</p>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Volume by Chain</h2>
          <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg">
            <p>Chart will appear here</p>
          </div>
        </div>
      </div>

      {/* Performance Breakdown */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-lg font-semibold mb-4">Performance Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Best Trades</h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No trades yet
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Worst Trades</h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No trades yet
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Most Traded</h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No trades yet
            </div>
          </div>
        </div>
      </div>

      {/* Fee Summary */}
      <div className="mt-8 bg-gradient-to-r from-primary-600 to-primary-700 rounded-xl p-6 text-white">
        <h2 className="text-lg font-semibold mb-2">Profit-Share Fee Model</h2>
        <p className="text-primary-100 text-sm mb-4">
          You only pay fees when you profit. Here&apos;s your breakdown:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-primary-200 text-xs uppercase tracking-wider">Profitable Trades</p>
            <p className="text-2xl font-bold">0</p>
          </div>
          <div>
            <p className="text-primary-200 text-xs uppercase tracking-wider">Total Profit</p>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
          <div>
            <p className="text-primary-200 text-xs uppercase tracking-wider">Fees Paid (15%)</p>
            <p className="text-2xl font-bold">$0.00</p>
          </div>
        </div>
      </div>
    </div>
  )
}
