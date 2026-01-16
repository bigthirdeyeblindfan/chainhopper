'use client'

import { http, createConfig, createStorage } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { mainnet, arbitrum, optimism, base, polygon } from 'wagmi/chains'
import { kaiaTestnet, kaiaMainnet } from './chains'

// All supported chains
export const supportedChains = [
  mainnet,
  arbitrum,
  optimism,
  base,
  polygon,
  kaiaMainnet,
  kaiaTestnet,
] as const

export const wagmiConfig = createConfig({
  chains: supportedChains,
  connectors: [
    injected({
      target: 'metaMask',
    }),
    injected(),
  ],
  storage: createStorage({
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  }),
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [polygon.id]: http(),
    [kaiaMainnet.id]: http('https://public-en-cypress.klaytn.net'),
    [kaiaTestnet.id]: http('https://public-en-kairos.node.kaia.io'),
  },
  ssr: true,
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}
