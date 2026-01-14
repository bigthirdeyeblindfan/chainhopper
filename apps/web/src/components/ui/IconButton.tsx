'use client'

import { forwardRef, ButtonHTMLAttributes } from 'react'

type Size = 'sm' | 'md' | 'lg'
type Variant = 'default' | 'ghost' | 'outline'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: Size
  variant?: Variant
  loading?: boolean
}

const sizes: Record<Size, string> = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

const variants: Record<Variant, string> = {
  default: 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white',
  ghost: 'hover:bg-white/5 text-zinc-400 hover:text-white',
  outline: 'border border-white/10 hover:border-white/20 text-zinc-400 hover:text-white',
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className = '', size = 'md', variant = 'default', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center rounded-xl
          transition-all duration-200
          disabled:opacity-50 disabled:cursor-not-allowed
          ${sizes[size]}
          ${variants[variant]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : children}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
