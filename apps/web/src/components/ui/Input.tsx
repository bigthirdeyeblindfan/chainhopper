'use client'

import { forwardRef, InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, hint, icon, suffix, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-zinc-400">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full h-12 bg-white/5 border border-white/10 rounded-xl
              text-white placeholder:text-zinc-500
              focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
              transition-all duration-200
              ${icon ? 'pl-10' : 'pl-4'}
              ${suffix ? 'pr-20' : 'pr-4'}
              ${error ? 'border-red-500/50' : ''}
              ${className}
            `}
            {...props}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {suffix}
            </div>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-zinc-500">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

interface TokenInputProps {
  value: string
  onChange: (value: string) => void
  label?: string
  balance?: string
  onMax?: () => void
  tokenButton?: React.ReactNode
  disabled?: boolean
  readOnly?: boolean
}

export function TokenInput({
  value,
  onChange,
  label = 'Amount',
  balance,
  onMax,
  tokenButton,
  disabled,
  readOnly,
}: TokenInputProps) {
  return (
    <div className="bg-zinc-900/50 rounded-2xl p-4 border border-white/5">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-zinc-500">{label}</span>
        {balance && (
          <button
            onClick={onMax}
            className="text-sm text-zinc-500 hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Balance: {balance}</span>
            {onMax && (
              <span className="text-emerald-400 text-xs font-medium">MAX</span>
            )}
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="0.00"
          disabled={disabled}
          readOnly={readOnly}
          className="flex-1 bg-transparent text-3xl font-semibold text-white placeholder:text-zinc-600 outline-none"
        />
        {tokenButton}
      </div>
    </div>
  )
}
