import { defineChain } from 'viem'

export const kaiaTestnet = defineChain({
  id: 1001,
  name: 'Kaia Kairos',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: {
      http: ['https://public-en-kairos.node.kaia.io'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Kaiascope',
      url: 'https://kairos.kaiascope.com',
    },
  },
  testnet: true,
})

export const kaiaMainnet = defineChain({
  id: 8217,
  name: 'Kaia',
  nativeCurrency: {
    decimals: 18,
    name: 'KAIA',
    symbol: 'KAIA',
  },
  rpcUrls: {
    default: {
      http: ['https://public-en-cypress.klaytn.net'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Kaiascope',
      url: 'https://kaiascope.com',
    },
  },
})

export const supportedChains = [kaiaTestnet] as const
