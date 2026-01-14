'use client'

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info'

interface BadgeProps {
  children: React.ReactNode
  variant?: Variant
  size?: 'sm' | 'md'
  dot?: boolean
}

const variants: Record<Variant, string> = {
  default: 'bg-zinc-800 text-zinc-300',
  success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/10 text-red-400 border border-red-500/20',
  info: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
}

const sizes = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

export function Badge({ children, variant = 'default', size = 'sm', dot }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
      `}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full ${
          variant === 'success' ? 'bg-emerald-400' :
          variant === 'warning' ? 'bg-amber-400' :
          variant === 'danger' ? 'bg-red-400' :
          variant === 'info' ? 'bg-blue-400' :
          'bg-zinc-400'
        }`} />
      )}
      {children}
    </span>
  )
}

interface ChainBadgeProps {
  chain: string
  size?: 'sm' | 'md'
}

const chainColors: Record<string, string> = {
  ethereum: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  arbitrum: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  optimism: 'bg-red-500/10 text-red-400 border-red-500/20',
  base: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  polygon: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  bsc: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  avalanche: 'bg-red-500/10 text-red-400 border-red-500/20',
  sonic: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  berachain: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  kaia: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
  ton: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  sui: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
}

export function ChainBadge({ chain, size = 'sm' }: ChainBadgeProps) {
  const colorClass = chainColors[chain.toLowerCase()] || 'bg-zinc-800 text-zinc-400 border-zinc-700'

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 font-medium rounded-full border
        ${colorClass}
        ${sizes[size]}
      `}
    >
      {chain}
    </span>
  )
}
