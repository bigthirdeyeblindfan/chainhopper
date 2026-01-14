'use client'

import { useState, useRef, useEffect } from 'react'

interface Option {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface SelectProps {
  options: Option[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  icon?: React.ReactNode
}

export function Select({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  label,
  icon,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const selectedOption = options.find((opt) => opt.value === value)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="space-y-1.5" ref={ref}>
      {label && (
        <label className="block text-sm font-medium text-zinc-400">{label}</label>
      )}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full h-12 px-4 bg-white/5 border border-white/10 rounded-xl
            flex items-center justify-between gap-3
            text-left text-white
            hover:border-white/20 focus:outline-none focus:border-emerald-500/50
            transition-all duration-200
          `}
        >
          <div className="flex items-center gap-3 min-w-0">
            {icon || selectedOption?.icon}
            <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
              {selectedOption?.label || placeholder}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden">
            <div className="max-h-64 overflow-y-auto py-1">
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`
                    w-full px-4 py-3 flex items-center gap-3
                    hover:bg-white/5 transition-colors text-left
                    ${option.value === value ? 'bg-white/5' : ''}
                  `}
                >
                  {option.icon}
                  <div className="min-w-0">
                    <div className="text-white font-medium">{option.label}</div>
                    {option.description && (
                      <div className="text-xs text-zinc-500">{option.description}</div>
                    )}
                  </div>
                  {option.value === value && (
                    <svg className="w-4 h-4 text-emerald-400 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
