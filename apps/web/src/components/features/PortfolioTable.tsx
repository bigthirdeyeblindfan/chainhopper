'use client'

import { Table, TableHeader, TableBody, TableRow, TableCell } from '../ui'
import { ChainBadge } from '../ui/Badge'

interface Asset {
  symbol: string
  name: string
  chain: string
  balance: string
  value: string
  price: string
  change24h: number
  logoUrl?: string
}

interface PortfolioTableProps {
  assets: Asset[]
  isLoading?: boolean
}

export function PortfolioTable({ assets, isLoading }: PortfolioTableProps) {
  if (isLoading) {
    return <PortfolioTableSkeleton />
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-white/5 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="text-zinc-400 font-medium">No assets found</p>
        <p className="text-zinc-600 text-sm mt-1">Your portfolio will appear here</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableCell header>Asset</TableCell>
          <TableCell header>Chain</TableCell>
          <TableCell header align="right">Price</TableCell>
          <TableCell header align="right">24h</TableCell>
          <TableCell header align="right">Balance</TableCell>
          <TableCell header align="right">Value</TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {assets.map((asset, index) => (
          <TableRow key={`${asset.chain}-${asset.symbol}-${index}`}>
            <TableCell>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {asset.symbol[0]}
                </div>
                <div>
                  <div className="font-medium text-white">{asset.symbol}</div>
                  <div className="text-sm text-zinc-500">{asset.name}</div>
                </div>
              </div>
            </TableCell>
            <TableCell>
              <ChainBadge chain={asset.chain} />
            </TableCell>
            <TableCell align="right">
              <span className="text-white">${asset.price}</span>
            </TableCell>
            <TableCell align="right">
              <span className={asset.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
              </span>
            </TableCell>
            <TableCell align="right">
              <span className="text-white">{asset.balance}</span>
            </TableCell>
            <TableCell align="right">
              <span className="text-white font-medium">${asset.value}</span>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function PortfolioTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl animate-pulse">
          <div className="w-10 h-10 bg-zinc-700 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-zinc-700 rounded w-24" />
            <div className="h-3 bg-zinc-800 rounded w-16" />
          </div>
          <div className="h-4 bg-zinc-700 rounded w-20" />
          <div className="h-4 bg-zinc-700 rounded w-16" />
          <div className="h-4 bg-zinc-700 rounded w-24" />
        </div>
      ))}
    </div>
  )
}
