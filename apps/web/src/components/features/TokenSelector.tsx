'use client'

import { useState } from 'react'
import { useAccount } from 'wagmi'
import { formatUnits } from 'viem'
import { Modal, Input } from '../ui'
import { KAIA_TESTNET_TOKENS, KAIA_TESTNET_CONTRACTS } from '@/lib/web3'
import { useTokenBalance } from '@/hooks/useSwapRouter'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance?: string
  logoUrl?: string
}

// Map tokens with contract addresses
const kaiaTokens: Token[] = [
  { address: 'native', symbol: 'KAIA', name: 'Kaia', decimals: 18 },
  { address: KAIA_TESTNET_CONTRACTS.wkaia, symbol: 'WKAIA', name: 'Wrapped KAIA', decimals: 18 },
  { address: KAIA_TESTNET_CONTRACTS.mUSDT, symbol: 'mUSDT', name: 'Mock USDT', decimals: 18 },
  { address: KAIA_TESTNET_CONTRACTS.mUSDC, symbol: 'mUSDC', name: 'Mock USDC', decimals: 18 },
]

interface TokenSelectorProps {
  value?: Token
  onChange: (token: Token) => void
  excludeToken?: string
}

export function TokenSelector({ value, onChange, excludeToken }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const { address: account } = useAccount()

  const filteredTokens = kaiaTokens.filter(
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
              <TokenRow
                key={token.address}
                token={token}
                isSelected={value?.address === token.address}
                account={account}
                onClick={() => {
                  onChange(token)
                  setIsOpen(false)
                  setSearch('')
                }}
              />
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

function TokenRow({
  token,
  isSelected,
  account,
  onClick,
}: {
  token: Token
  isSelected: boolean
  account: string | undefined
  onClick: () => void
}) {
  const { balanceFormatted } = useTokenBalance(token.address, account)

  const displayBalance = token.address === 'native' ? '-.--' : parseFloat(balanceFormatted).toFixed(4)

  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-colors
        ${isSelected
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
        <div className="text-sm text-white">{displayBalance}</div>
        <div className="text-xs text-zinc-500">Balance</div>
      </div>
    </button>
  )
}
