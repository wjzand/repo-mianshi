import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type RatingSize = 'sm' | 'md' | 'lg'

export interface RatingProps {
  value: number
  onChange?: (value: number) => void
  readOnly?: boolean
  size?: RatingSize
  className?: string
}

const sizeClasses: Record<RatingSize, string> = {
  sm: 'gap-1',
  md: 'gap-1.5',
  lg: 'gap-2',
}

const starSizeMap: Record<RatingSize, { width: number; height: number }> = {
  sm: { width: 16, height: 16 },
  md: { width: 24, height: 24 },
  lg: { width: 32, height: 32 },
}

export function Rating({
  value,
  onChange,
  readOnly = false,
  size = 'md',
  className,
}: RatingProps) {
  const starSize = starSizeMap[size]

  const handleClick = (index: number) => {
    if (readOnly || !onChange) return
    onChange(index)
  }

  return (
    <div className={cn('flex items-center', sizeClasses[size], className)}>
      {[1, 2, 3, 4, 5].map((index) => {
        const isActive = index <= value
        return (
          <Star
            key={index}
            width={starSize.width}
            height={starSize.height}
            fill={isActive ? 'currentColor' : 'none'}
            onClick={() => handleClick(index)}
            className={cn(
              'rating-star',
              isActive && 'rating-star-active',
              !readOnly && 'hover:scale-110 active:scale-95'
            )}
            style={{ cursor: readOnly ? 'default' : 'pointer' }}
          />
        )
      })}
    </div>
  )
}
