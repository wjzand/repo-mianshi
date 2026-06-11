import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: ReactNode
  disabled?: boolean
  className?: string
}

export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
  className,
}: SwitchProps) {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {label && (
        <div className="text-sm font-medium text-neutral-700">{label}</div>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-50 focus:ring-offset-2',
          checked ? 'bg-primary-500' : 'bg-neutral-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <span
          className={cn(
            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
            checked ? 'translate-x-5' : 'translate-x-0'
          )}
        />
      </button>
    </div>
  )
}
