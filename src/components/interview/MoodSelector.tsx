import { MoodType } from '@/types/interview';
import { cn } from '@/lib/utils';

interface MoodSelectorProps {
  value: MoodType;
  onChange: (value: MoodType) => void;
}

const moodOptions: { value: MoodType; emoji: string; label: string; activeClass: string }[] = [
  {
    value: 'good',
    emoji: '😊',
    label: '不错',
    activeClass: 'bg-success-50 border-success-300 text-success-600',
  },
  {
    value: 'neutral',
    emoji: '😐',
    label: '一般',
    activeClass: 'bg-accent-50 border-accent-300 text-accent-600',
  },
  {
    value: 'bad',
    emoji: '😟',
    label: '不好',
    activeClass: 'bg-red-50 border-red-300 text-red-600',
  },
];

export default function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex items-center gap-3">
      {moodOptions.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'flex flex-col items-center justify-center gap-1',
              'px-6 py-3 rounded-2xl border-2 border-neutral-200',
              'transition-all duration-200 cursor-pointer select-none',
              'hover:scale-105',
              isActive && [option.activeClass, 'scale-105 shadow-md']
            )}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span className={cn(
              'text-sm font-medium',
              isActive ? '' : 'text-neutral-500'
            )}>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
