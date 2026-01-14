'use client'

interface TableProps {
  children: React.ReactNode
  className?: string
}

export function Table({ children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">{children}</table>
    </div>
  )
}

export function TableHeader({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-white/5">
        {children}
      </tr>
    </thead>
  )
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-white/5">{children}</tbody>
}

export function TableRow({
  children,
  onClick,
  className = ''
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  return (
    <tr
      onClick={onClick}
      className={`
        ${onClick ? 'cursor-pointer hover:bg-white/5' : ''}
        transition-colors
        ${className}
      `}
    >
      {children}
    </tr>
  )
}

interface TableCellProps {
  children: React.ReactNode
  header?: boolean
  align?: 'left' | 'center' | 'right'
  className?: string
}

export function TableCell({
  children,
  header = false,
  align = 'left',
  className = ''
}: TableCellProps) {
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }

  if (header) {
    return (
      <th className={`px-4 py-3 text-xs font-medium text-zinc-500 uppercase tracking-wider ${alignClasses[align]} ${className}`}>
        {children}
      </th>
    )
  }

  return (
    <td className={`px-4 py-4 text-sm text-zinc-300 ${alignClasses[align]} ${className}`}>
      {children}
    </td>
  )
}
