'use client'

import { useState } from 'react'
import { Card, Button, Input, Badge } from '@/components/ui'
import { Header, PageContainer } from '@/components/layout'

export default function SettingsPage() {
  const [slippage, setSlippage] = useState('1')
  const [notifications, setNotifications] = useState({
    tradeConfirmations: true,
    priceAlerts: true,
    portfolioUpdates: false,
    newListings: false,
  })

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <>
      <Header />
      <PageContainer
        title="Settings"
        subtitle="Manage your account and preferences"
      >
        <div className="max-w-3xl space-y-6">
          {/* Account Section */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Account</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Connected Wallet
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500">Not connected</span>
                  <Button size="sm">Connect Wallet</Button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Telegram Account
                </label>
                <div className="flex items-center gap-4">
                  <span className="text-zinc-500">Not linked</span>
                  <Button variant="secondary" size="sm">Link Telegram</Button>
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-zinc-400 mb-2">
                  Your Tier
                </label>
                <div className="flex items-center gap-3">
                  <Badge variant="default">Free (15% profit share)</Badge>
                  <a href="#" className="text-sm text-emerald-400 hover:text-emerald-300">
                    Upgrade to Holder (10%)
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* Trading Preferences */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Trading Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Default Slippage
                </label>
                <div className="flex gap-2">
                  {['0.5', '1', '2', '5'].map((val) => (
                    <button
                      key={val}
                      onClick={() => setSlippage(val)}
                      className={`
                        px-4 py-2 rounded-xl text-sm font-medium transition-all
                        ${slippage === val
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                          : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                        }
                      `}
                    >
                      {val}%
                    </button>
                  ))}
                  <input
                    type="text"
                    placeholder="Custom"
                    className="w-24 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="block text-sm font-medium text-zinc-400 mb-3">
                  Default Chain
                </label>
                <select className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500/50">
                  <option value="ethereum">Ethereum</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="base">Base</option>
                  <option value="optimism">Optimism</option>
                  <option value="sonic">Sonic</option>
                  <option value="kaia">Kaia</option>
                  <option value="berachain">Berachain</option>
                </select>
              </div>

              <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Auto-approve transactions</p>
                  <p className="text-xs text-zinc-500 mt-1">Skip confirmation for small trades</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-white/10 transition-colors">
                  <span className="inline-block h-4 w-4 transform rounded-full bg-zinc-400 transition translate-x-1" />
                </button>
              </div>
            </div>
          </Card>

          {/* Notifications */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Notifications</h2>
            <div className="space-y-4">
              {[
                { key: 'tradeConfirmations', label: 'Trade confirmations', desc: 'Get notified when trades complete' },
                { key: 'priceAlerts', label: 'Price alerts', desc: 'Alerts for significant price movements' },
                { key: 'portfolioUpdates', label: 'Portfolio updates', desc: 'Daily portfolio summary' },
                { key: 'newListings', label: 'New listings', desc: 'New tokens on supported chains' },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl"
                >
                  <div>
                    <p className="text-sm font-medium text-white">{item.label}</p>
                    <p className="text-xs text-zinc-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(item.key as keyof typeof notifications)}
                    className={`
                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                      ${notifications[item.key as keyof typeof notifications]
                        ? 'bg-emerald-500'
                        : 'bg-white/10'
                      }
                    `}
                  >
                    <span
                      className={`
                        inline-block h-4 w-4 transform rounded-full bg-white transition
                        ${notifications[item.key as keyof typeof notifications]
                          ? 'translate-x-6'
                          : 'translate-x-1'
                        }
                      `}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* API Keys */}
          <Card>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">API Keys</h2>
              <Button size="sm">Create Key</Button>
            </div>
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 bg-white/5 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <p className="text-zinc-500 text-sm">No API keys created</p>
              <p className="text-zinc-600 text-xs mt-1">Create an API key to access ChainHopper programmatically</p>
            </div>
          </Card>

          {/* Referrals */}
          <Card>
            <h2 className="text-lg font-semibold text-white mb-6">Referral Program</h2>
            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-400 mb-2">
                Your Referral Code
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value="Connect wallet to get code"
                  readOnly
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-zinc-500"
                />
                <Button variant="secondary" size="sm">Copy</Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4 p-4 bg-white/5 rounded-xl">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">0</p>
                <p className="text-xs text-zinc-500 mt-1">Referrals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">$0.00</p>
                <p className="text-xs text-zinc-500 mt-1">Earned</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">Bronze</p>
                <p className="text-xs text-zinc-500 mt-1">Tier (20%)</p>
              </div>
            </div>
          </Card>
        </div>
      </PageContainer>
    </>
  )
}
