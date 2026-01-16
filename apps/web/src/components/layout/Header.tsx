'use client'

import { useAccount, useChainId } from 'wagmi'
import { IconButton } from '../ui'
import { ConnectWallet } from '../features/ConnectWallet'
import { kaiaTestnet } from '@/lib/web3'

interface HeaderProps {
  title?: string
}

export function Header({ title }: HeaderProps) {
  const { isConnected } = useAccount()
  const chainId = useChainId()

  const isCorrectNetwork = chainId === kaiaTestnet.id

  return (
    <header className="h-16 border-b border-white/5 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-40">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {title && <h1 className="text-lg font-semibold text-white">{title}</h1>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden md:flex items-center">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search tokens..."
                className="w-64 h-9 pl-9 pr-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/50"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-white/5 rounded text-[10px] text-zinc-500 font-medium">
                ⌘K
              </kbd>
            </div>
          </div>

          {/* Notifications */}
          <IconButton variant="ghost">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </IconButton>

          {/* Network status */}
          {isConnected && (
            <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg ${
              isCorrectNetwork ? 'bg-emerald-500/10' : 'bg-amber-500/10'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                isCorrectNetwork ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`} />
              <span className={`text-xs font-medium ${
                isCorrectNetwork ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {isCorrectNetwork ? 'Kaia Testnet' : 'Wrong Network'}
              </span>
            </div>
          )}

          {/* Connect Wallet */}
          <ConnectWallet />
        </div>
      </div>
    </header>
  )
}
