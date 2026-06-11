import { HTMLAttributes } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

type TagVariant = 'success' | 'pending' | 'fail' | 'primary' | 'accent'

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: TagVariant
  closable?: boolean
  onClose?: () => void
}

const variantClasses: Record<TagVariant, string> = {
  success: 'tag-success',
  pending: 'tag-pending',
  fail: 'tag-fail',
  primary: 'tag-primary',
  accent: 'tag-accent',
}

export function Tag({
  variant = 'primary',
  closable = false,
  onClose,
  className,
  children,
  ...props
}: TagProps) {
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation()
    onClose?.()
  }

  return (
    <span
      className={cn(
        variantClasses[variant],
        closable && 'pr-2',
        className
      )}
      {...props}
    >
      {children}
      {closable && (
        <button
          type="button"
          onClick={handleClose}
          className={cn(
            'ml-1 rounded-full p-0.5 transition-colors',
            'hover:bg-black/10 active:bg-black/20'
          )}
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  )
}
