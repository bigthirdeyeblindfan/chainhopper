'use client'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
  width?: string | number
  height?: string | number
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClass = 'animate-pulse bg-white/5'

  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
  }

  const style: React.CSSProperties = {
    width: width,
    height: height,
  }

  return (
    <div
      className={`${baseClass} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton width={120} height={20} />
        <Skeleton variant="circular" width={32} height={32} />
      </div>
      <Skeleton width="100%" height={40} variant="rectangular" />
      <div className="flex gap-4">
        <Skeleton width="50%" height={16} />
        <Skeleton width="30%" height={16} />
      </div>
    </div>
  )
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <div className="flex gap-4 px-4">
        <Skeleton width="20%" height={12} />
        <Skeleton width="25%" height={12} />
        <Skeleton width="20%" height={12} />
        <Skeleton width="15%" height={12} />
        <Skeleton width="20%" height={12} />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 px-4 py-3 border-t border-white/5">
          <Skeleton width="20%" height={16} />
          <Skeleton width="25%" height={16} />
          <Skeleton width="20%" height={16} />
          <Skeleton width="15%" height={16} />
          <Skeleton width="20%" height={16} />
        </div>
      ))}
    </div>
  )
}
