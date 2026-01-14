'use client'

import { useState } from 'react'
import { Card, Button, IconButton } from '../ui'
import { TokenInput } from '../ui/Input'
import { ChainSelector } from './ChainSelector'
import { TokenSelector } from './TokenSelector'

interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  balance?: string
}

export function SwapCard() {
  const [chain, setChain] = useState('ethereum')
  const [tokenIn, setTokenIn] = useState<Token | undefined>()
  const [tokenOut, setTokenOut] = useState<Token | undefined>()
  const [amountIn, setAmountIn] = useState('')
  const [amountOut, setAmountOut] = useState('')
  const [slippage, setSlippage] = useState('1.0')
  const [showSettings, setShowSettings] = useState(false)

  const handleSwapTokens = () => {
    const temp = tokenIn
    setTokenIn(tokenOut)
    setTokenOut(temp)
    setAmountIn(amountOut)
    setAmountOut(amountIn)
  }

  return (
    <Card className="relative overflow-hidden">
      {/* Gradient accent */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-500" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Swap</h2>
          <ChainSelector value={chain} onChange={setChain} />
        </div>
        <IconButton
          variant="ghost"
          onClick={() => setShowSettings(!showSettings)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </IconButton>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="mb-6 p-4 bg-white/5 rounded-xl space-y-4">
          <div>
            <label className="text-sm text-zinc-400 mb-2 block">Slippage Tolerance</label>
            <div className="flex gap-2">
              {['0.5', '1.0', '2.0'].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  className={`
                    px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${slippage === val
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-zinc-400 hover:text-white'
                    }
                  `}
                >
                  {val}%
                </button>
              ))}
              <input
                type="text"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                className="w-20 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white text-center focus:outline-none focus:border-emerald-500/50"
                placeholder="Custom"
              />
            </div>
          </div>
        </div>
      )}

      {/* Token In */}
      <TokenInput
        label="You pay"
        value={amountIn}
        onChange={setAmountIn}
        balance={tokenIn?.balance || '0.00'}
        onMax={() => setAmountIn(tokenIn?.balance || '0')}
        tokenButton={
          <TokenSelector
            value={tokenIn}
            onChange={setTokenIn}
            excludeToken={tokenOut?.address}
          />
        }
      />

      {/* Swap button */}
      <div className="flex justify-center -my-3 relative z-10">
        <button
          onClick={handleSwapTokens}
          className="p-2.5 bg-zinc-900 border border-white/10 rounded-xl hover:border-white/20 hover:bg-zinc-800 transition-all"
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* Token Out */}
      <TokenInput
        label="You receive"
        value={amountOut}
        onChange={setAmountOut}
        balance={tokenOut?.balance || '0.00'}
        readOnly
        tokenButton={
          <TokenSelector
            value={tokenOut}
            onChange={setTokenOut}
            excludeToken={tokenIn?.address}
          />
        }
      />

      {/* Swap action */}
      <Button className="w-full mt-6" size="lg">
        {!tokenIn || !tokenOut
          ? 'Select tokens'
          : !amountIn
          ? 'Enter amount'
          : 'Connect Wallet'}
      </Button>

      {/* Info */}
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Slippage</span>
          <span className="text-zinc-300">{slippage}%</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-500">Fee</span>
          <span className="text-emerald-400">Free (pay only on profit)</span>
        </div>
      </div>
    </Card>
  )
}
