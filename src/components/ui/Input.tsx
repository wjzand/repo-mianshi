import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, LabelHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn('input-base', className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        rows={rows}
        className={cn('input-base resize-none', className)}
        ref={ref}
        {...props}
      />
    )
  }
)
TextArea.displayName = 'TextArea'

export interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        className={cn('input-label', className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Label.displayName = 'Label'
