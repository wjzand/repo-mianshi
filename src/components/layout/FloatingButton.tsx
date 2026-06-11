import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FloatingButtonProps {
  onClick: () => void
  icon?: ReactNode
  label?: string
}

export default function FloatingButton({
  onClick,
  icon = <Plus className="h-6 w-6 text-white" strokeWidth={2.5} />,
  label,
}: FloatingButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'fixed right-4 bottom-[100px] z-50',
        'flex items-center justify-center gap-2',
        'h-14 min-w-14 rounded-full px-4',
        'bg-gradient-accent shadow-button',
        'transition-all duration-200',
        'hover:shadow-lg hover:brightness-105 active:scale-90'
      )}
    >
      {icon}
      {label && (
        <span className="text-sm font-semibold text-white">{label}</span>
      )}
    </button>
  )
}
