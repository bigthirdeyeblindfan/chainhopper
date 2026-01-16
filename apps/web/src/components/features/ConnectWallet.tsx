'use client'

import { useState } from 'react'
import { useConnect, useAccount, useDisconnect } from 'wagmi'
import { Button, Modal } from '../ui'

interface ConnectWalletProps {
  className?: string
}

export function ConnectWallet({ className }: ConnectWalletProps) {
  const [isOpen, setIsOpen] = useState(false)
  const { connectors, connect, isPending, error } = useConnect()
  const { isConnected, address } = useAccount()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <Button
        variant="secondary"
        className={className}
        onClick={() => disconnect()}
      >
        {address.slice(0, 6)}...{address.slice(-4)}
      </Button>
    )
  }

  return (
    <>
      <Button className={className} onClick={() => setIsOpen(true)}>
        Connect Wallet
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Connect Wallet" size="sm">
        <div className="space-y-3">
          {connectors.map((connector) => (
            <button
              key={connector.uid}
              onClick={() => {
                connect({ connector })
                setIsOpen(false)
              }}
              disabled={isPending}
              className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors disabled:opacity-50"
            >
              <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center">
                {connector.name === 'MetaMask' ? (
                  <svg className="w-6 h-6" viewBox="0 0 35 33" fill="none">
                    <path d="M32.958 1L19.514 10.928l2.497-5.882L32.958 1z" fill="#E17726" stroke="#E17726" strokeWidth=".25"/>
                    <path d="M2.042 1l13.32 10.02-2.374-5.973L2.042 1zM28.155 23.535l-3.576 5.477 7.655 2.107 2.198-7.462-6.277-.122zM.578 23.657l2.187 7.462 7.644-2.107-3.565-5.477-6.266.122z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
                    <path d="M9.925 14.488l-2.137 3.231 7.612.347-.269-8.196-5.206 4.618zM25.075 14.488l-5.268-4.71-.178 8.288 7.602-.347-2.156-3.231zM10.409 29.012l4.568-2.23-3.944-3.081-.624 5.311zM20.023 26.782l4.578 2.23-.634-5.311-3.944 3.081z" fill="#E27625" stroke="#E27625" strokeWidth=".25"/>
                    <path d="M24.601 29.012l-4.578-2.23.368 2.976-.041 1.256 4.251-1.932zM10.409 29.012l4.261 2.002-.03-1.256.357-2.976-4.588 2.23z" fill="#D5BFB2" stroke="#D5BFB2" strokeWidth=".25"/>
                    <path d="M14.753 21.783l-3.791-1.115 2.676-1.226 1.115 2.341zM20.247 21.783l1.115-2.341 2.686 1.226-3.801 1.115z" fill="#233447" stroke="#233447" strokeWidth=".25"/>
                    <path d="M10.409 29.012l.654-5.477-4.22.122 3.566 5.355zM23.947 23.535l.654 5.477 3.555-5.355-4.209-.122zM27.212 17.719l-7.602.347.706 3.717 1.115-2.341 2.686 1.226 3.095-2.949zM10.962 20.668l2.686-1.226 1.105 2.341.716-3.717-7.612-.347 3.105 2.949z" fill="#CC6228" stroke="#CC6228" strokeWidth=".25"/>
                    <path d="M7.857 17.719l3.228 6.295-.112-3.346-3.116-2.949zM24.117 20.668l-.122 3.346 3.217-6.295-3.095 2.949zM15.469 18.066l-.716 3.717.899 4.648.204-6.122-.387-2.243zM19.61 18.066l-.378 2.233.183 6.132.909-4.648-.714-3.717z" fill="#E27525" stroke="#E27525" strokeWidth=".25"/>
                    <path d="M20.324 21.783l-.909 4.648.652.458 3.944-3.081.122-3.346-3.809 1.321zM10.962 20.668l.112 3.346 3.944 3.081.653-.458-.899-4.648-3.81-1.321z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25"/>
                    <path d="M20.396 31.014l.04-1.256-.347-.295h-5.078l-.337.295.03 1.256-4.261-2.002 1.49 1.22 3.016 2.088h5.163l3.026-2.088 1.479-1.22-4.221 2.002z" fill="#C0AC9D" stroke="#C0AC9D" strokeWidth=".25"/>
                    <path d="M20.023 26.782l-.653-.458h-3.74l-.653.458-.357 2.976.337-.295h5.078l.347.295-.359-2.976z" fill="#161616" stroke="#161616" strokeWidth=".25"/>
                    <path d="M33.516 11.357l1.14-5.497L32.958 1l-12.935 9.59 4.978 4.208 7.034 2.057 1.561-1.818-.673-.488 1.074-.979-.826-.642 1.074-.816-.714-.545zM.344 5.86l1.151 5.497-.735.545 1.084.816-.816.642 1.074.979-.684.488 1.55 1.818 7.034-2.057 4.978-4.208L2.042 1 .344 5.86z" fill="#763E1A" stroke="#763E1A" strokeWidth=".25"/>
                    <path d="M32.035 16.898l-7.034-2.057 2.156 3.231-3.217 6.295 4.22-.053h6.277l-2.402-7.416zM9.925 14.841l-7.034 2.057-2.313 7.416h6.266l4.209.053-3.227-6.295 2.099-3.231zM19.61 18.066l.448-7.773 2.048-5.542H12.893l2.038 5.542.458 7.773.173 2.253.01 6.112h3.74l.02-6.112.178-2.253z" fill="#F5841F" stroke="#F5841F" strokeWidth=".25"/>
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 text-left">
                <div className="font-medium text-white">{connector.name}</div>
                <div className="text-xs text-zinc-500">
                  {connector.name === 'MetaMask' ? 'Connect using MetaMask' : 'Connect using browser wallet'}
                </div>
              </div>
              <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error.message}
            </div>
          )}

          <p className="text-xs text-zinc-500 text-center pt-2">
            By connecting, you agree to the Terms of Service
          </p>
        </div>
      </Modal>
    </>
  )
}
