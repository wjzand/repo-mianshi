import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

export function Chip({
  active = false,
  className,
  children,
  ...props
}: ChipProps) {
  return (
    <button
      type="button"
      className={cn(
        'chip',
        active && 'chip-active',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
