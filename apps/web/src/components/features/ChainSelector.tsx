'use client'

import { useState } from 'react'
import { Modal } from '../ui'

const chains = [
  { id: 'ethereum', name: 'Ethereum', icon: '⟠', color: 'bg-blue-500' },
  { id: 'arbitrum', name: 'Arbitrum', icon: '🔵', color: 'bg-sky-500' },
  { id: 'optimism', name: 'Optimism', icon: '🔴', color: 'bg-red-500' },
  { id: 'base', name: 'Base', icon: '🔵', color: 'bg-blue-500' },
  { id: 'polygon', name: 'Polygon', icon: '💜', color: 'bg-purple-500' },
  { id: 'bsc', name: 'BNB Chain', icon: '🟡', color: 'bg-amber-500' },
  { id: 'avalanche', name: 'Avalanche', icon: '🔺', color: 'bg-red-500' },
  { id: 'sonic', name: 'Sonic', icon: '⚡', color: 'bg-indigo-500' },
  { id: 'berachain', name: 'Berachain', icon: '🐻', color: 'bg-amber-500' },
  { id: 'kaia', name: 'Kaia', icon: '🌸', color: 'bg-teal-500' },
  { id: 'ton', name: 'TON', icon: '💎', color: 'bg-sky-500' },
  { id: 'sui', name: 'Sui', icon: '🌊', color: 'bg-cyan-500' },
]

interface ChainSelectorProps {
  value: string
  onChange: (chainId: string) => void
}

export function ChainSelector({ value, onChange }: ChainSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const selectedChain = chains.find((c) => c.id === value) || chains[0]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
      >
        <span className="text-lg">{selectedChain.icon}</span>
        <span className="text-sm font-medium text-white">{selectedChain.name}</span>
        <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Select Chain">
        <div className="grid grid-cols-2 gap-2">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => {
                onChange(chain.id)
                setIsOpen(false)
              }}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${value === chain.id
                  ? 'bg-emerald-500/10 border border-emerald-500/30'
                  : 'bg-white/5 border border-transparent hover:border-white/10'
                }
              `}
            >
              <span className="text-xl">{chain.icon}</span>
              <span className="text-sm font-medium text-white">{chain.name}</span>
              {value === chain.id && (
                <svg className="w-4 h-4 text-emerald-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}
        </div>
      </Modal>
    </>
  )
}
