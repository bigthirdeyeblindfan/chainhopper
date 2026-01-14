export default function TradePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Swap Interface */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">Swap</h2>
              <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            {/* Chain Selector */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chain
              </label>
              <select className="w-full px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 border-0 text-sm font-medium">
                <option>Sonic</option>
                <option>Kaia</option>
                <option>Berachain</option>
                <option>Sui</option>
                <option>TON</option>
                <option>Ethereum</option>
                <option>Base</option>
                <option>Arbitrum</option>
              </select>
            </div>

            {/* From Token */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Balance: 0.00</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="0.00"
                  className="flex-1 bg-transparent text-2xl font-semibold outline-none"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <span className="font-medium">Select token</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Swap Arrow */}
            <div className="flex justify-center -my-3 relative z-10">
              <button className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              </button>
            </div>

            {/* To Token */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mt-2 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">To</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">Balance: 0.00</span>
              </div>
              <div className="flex items-center gap-4">
                <input
                  type="text"
                  placeholder="0.00"
                  readOnly
                  className="flex-1 bg-transparent text-2xl font-semibold outline-none"
                />
                <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  <span className="font-medium">Select token</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Swap Button */}
            <button className="w-full py-4 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              Connect Wallet
            </button>

            {/* Trade Info */}
            <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 space-y-2">
              <div className="flex justify-between">
                <span>Slippage</span>
                <span>1.0%</span>
              </div>
              <div className="flex justify-between">
                <span>Fee</span>
                <span className="text-green-500">Free (pay only on profit)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Side Panel */}
        <div className="space-y-6">
          {/* Token Info */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Token Info</h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              Select a token to view details
            </div>
          </div>

          {/* Recent Trades */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Recent Trades</h3>
            <div className="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No recent trades
            </div>
          </div>

          {/* Rug Detection */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold mb-4">Safety Check</h3>
            <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
              <p>Rug detection will analyze</p>
              <p>the token when selected</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
