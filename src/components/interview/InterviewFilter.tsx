import { Search, Calendar, Filter } from 'lucide-react';
import { InterviewResult } from '@/types/interview';
import { cn } from '@/lib/utils';

export type TimeFilter = 'all' | 'week' | 'month' | '3months';

export interface InterviewFilters {
  result: InterviewResult | 'all';
  time: TimeFilter;
}

interface InterviewFilterProps {
  filters: InterviewFilters;
  onFilterChange: (filters: InterviewFilters) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const resultOptions: { value: InterviewResult | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pass', label: '通过' },
  { value: 'pending', label: '待定' },
  { value: 'fail', label: '未通过' },
];

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: 'all', label: '全部时间' },
  { value: 'week', label: '近一周' },
  { value: 'month', label: '近一月' },
  { value: '3months', label: '近三月' },
];

export default function InterviewFilter({
  filters,
  onFilterChange,
  searchQuery,
  onSearchChange,
}: InterviewFilterProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
        <input
          type="text"
          placeholder="搜索公司、岗位..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'input-base pl-12',
            'focus:shadow-glow'
          )}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Filter className="w-4 h-4" />
          <span>结果筛选</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {resultOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange({ ...filters, result: option.value })}
              className={cn(
                'chip',
                filters.result === option.value && 'chip-active'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-neutral-500">
          <Calendar className="w-4 h-4" />
          <span>时间筛选</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFilterChange({ ...filters, time: option.value })}
              className={cn(
                'chip',
                filters.time === option.value && 'chip-active'
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
