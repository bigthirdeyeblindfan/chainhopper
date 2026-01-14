export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Overview of your trading activity
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Portfolio Value</p>
          <p className="text-2xl font-bold mt-1">$0.00</p>
          <p className="text-sm text-green-500 mt-1">+0.00%</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total Profit/Loss</p>
          <p className="text-2xl font-bold mt-1">$0.00</p>
          <p className="text-sm text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Active Chains</p>
          <p className="text-2xl font-bold mt-1">0</p>
          <p className="text-sm text-gray-500 mt-1">Connected</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending Trades</p>
          <p className="text-2xl font-bold mt-1">0</p>
          <p className="text-sm text-gray-500 mt-1">In queue</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Trades</h2>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No trades yet</p>
            <p className="text-sm mt-1">Connect your wallet to start trading</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Chain Status</h2>
          <div className="space-y-3">
            {['Sonic', 'Kaia', 'Berachain', 'Sui'].map((chain) => (
              <div key={chain} className="flex items-center justify-between">
                <span className="text-sm">{chain}</span>
                <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                  Not connected
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
