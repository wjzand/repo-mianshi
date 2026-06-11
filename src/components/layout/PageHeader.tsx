import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  subtitle?: string
  showBack?: boolean
  onBack?: () => void
  rightAction?: ReactNode
}

export default function PageHeader({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-40 glass-effect border-b border-neutral-200/50',
        'safe-top'
      )}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {showBack && (
            <button
              type="button"
              onClick={onBack}
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                'text-neutral-600 transition-all duration-200',
                'hover:bg-neutral-100 active:scale-95'
              )}
            >
              <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-neutral-800">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-sm text-neutral-500 mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {rightAction && <div className="flex items-center gap-2">{rightAction}</div>}
      </div>
    </header>
  )
}
