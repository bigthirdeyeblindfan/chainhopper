export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account and preferences
        </p>
      </div>

      {/* Account Section */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Account</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Connected Wallet
            </label>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 dark:text-gray-400">Not connected</span>
              <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
                Connect Wallet
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telegram Account
            </label>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 dark:text-gray-400">Not linked</span>
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Link Telegram
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Tier
            </label>
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-sm font-medium">
                Free (15% profit share)
              </span>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">
                Upgrade to Holder (10%)
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Preferences */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Trading Preferences</h2>
        </div>
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Slippage
            </label>
            <div className="flex gap-2">
              {['0.5%', '1%', '2%', '5%'].map((slippage, i) => (
                <button
                  key={slippage}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    i === 1
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {slippage}
                </button>
              ))}
              <input
                type="text"
                placeholder="Custom"
                className="px-4 py-2 rounded-lg text-sm bg-gray-100 dark:bg-gray-800 border-0 w-24"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Chain
            </label>
            <select className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 text-sm">
              <option>Sonic</option>
              <option>Kaia</option>
              <option>Berachain</option>
              <option>Sui</option>
              <option>TON</option>
              <option>Ethereum</option>
              <option>Base</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Auto-approve transactions</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Skip confirmation for small trades</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200 dark:bg-gray-700">
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition translate-x-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: 'Trade confirmations', desc: 'Get notified when trades complete', enabled: true },
            { label: 'Price alerts', desc: 'Alerts for significant price movements', enabled: true },
            { label: 'Portfolio updates', desc: 'Daily portfolio summary', enabled: false },
            { label: 'New listings', desc: 'New tokens on supported chains', enabled: false },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
              <button className={`relative inline-flex h-6 w-11 items-center rounded-full ${item.enabled ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${item.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* API Keys */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 mb-6">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <h2 className="text-lg font-semibold">API Keys</h2>
          <button className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors">
            Create Key
          </button>
        </div>
        <div className="p-6">
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>No API keys created</p>
            <p className="text-sm mt-1">Create an API key to access ChainHopper programmatically</p>
          </div>
        </div>
      </div>

      {/* Referrals */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-lg font-semibold">Referral Program</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Referral Code
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value="Connect wallet to get code"
                readOnly
                className="flex-1 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-0 text-sm"
              />
              <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                Copy
              </button>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">0</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Referrals</p>
            </div>
            <div>
              <p className="text-2xl font-bold">$0.00</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Earned</p>
            </div>
            <div>
              <p className="text-2xl font-bold">Bronze</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tier (20%)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
