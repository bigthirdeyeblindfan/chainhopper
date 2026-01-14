'use client'

import { useState } from 'react'
import { Modal, Input } from '../ui'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance?: string
  logoUrl?: string
}

const popularTokens: Token[] = [
  { address: 'native', symbol: 'ETH', name: 'Ethereum', decimals: 18, balance: '0.00' },
  { address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', symbol: 'USDC', name: 'USD Coin', decimals: 6, balance: '0.00' },
  { address: '0xdac17f958d2ee523a2206206994597c13d831ec7', symbol: 'USDT', name: 'Tether', decimals: 6, balance: '0.00' },
  { address: '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599', symbol: 'WBTC', name: 'Wrapped Bitcoin', decimals: 8, balance: '0.00' },
]

interface TokenSelectorProps {
  value?: Token
  onChange: (token: Token) => void
  excludeToken?: string
}

export function TokenSelector({ value, onChange, excludeToken }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  const filteredTokens = popularTokens.filter(
    (t) =>
      t.address !== excludeToken &&
      (t.symbol.toLowerCase().includes(search.toLowerCase()) ||
        t.name.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={`
          flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all
          ${value
            ? 'bg-white/5 hover:bg-white/10 border border-white/10'
            : 'bg-emerald-500 hover:bg-emerald-400 text-white'
          }
        `}
      >
        {value ? (
          <>
            <div className="w-6 h-6 bg-zinc-700 rounded-full flex items-center justify-center text-xs font-bold">
              {value.symbol[0]}
            </div>
            <span className="font-semibold text-white">{value.symbol}</span>
          </>
        ) : (
          <span className="font-semibold">Select token</span>
        )}
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Token" size="sm">
        <div className="space-y-4">
          <Input
            placeholder="Search by name or address"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          <div className="space-y-1 max-h-80 overflow-y-auto">
            {filteredTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => {
                  onChange(token)
                  setIsOpen(false)
                  setSearch('')
                }}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors
                  ${value?.address === token.address
                    ? 'bg-emerald-500/10'
                    : 'hover:bg-white/5'
                  }
                `}
              >
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {token.symbol[0]}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-sm text-zinc-500">{token.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-white">{token.balance}</div>
                  <div className="text-xs text-zinc-500">Balance</div>
                </div>
              </button>
            ))}

            {filteredTokens.length === 0 && (
              <div className="py-8 text-center text-zinc-500">
                <p>No tokens found</p>
                <p className="text-sm mt-1">Try searching by contract address</p>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}
