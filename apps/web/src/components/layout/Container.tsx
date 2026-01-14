'use client'

interface ContainerProps {
  children: React.ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizes = {
  sm: 'max-w-3xl',
  md: 'max-w-5xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'max-w-full',
}

export function Container({ children, className = '', size = 'xl' }: ContainerProps) {
  return (
    <div className={`mx-auto px-6 ${sizes[size]} ${className}`}>
      {children}
    </div>
  )
}

interface PageContainerProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageContainer({ children, title, subtitle, action }: PageContainerProps) {
  return (
    <div className="py-8">
      <Container>
        {(title || action) && (
          <div className="flex items-center justify-between mb-8">
            <div>
              {title && <h1 className="text-2xl font-bold text-white">{title}</h1>}
              {subtitle && <p className="text-zinc-500 mt-1">{subtitle}</p>}
            </div>
            {action}
          </div>
        )}
        {children}
      </Container>
    </div>
  )
}
