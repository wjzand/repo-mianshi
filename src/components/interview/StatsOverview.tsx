import { FileText, CheckCircle, Star, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsOverviewProps {
  stats: {
    total: number;
    passRate: number;
    avgRating: number;
    pendingCount: number;
  };
}

const statConfig = [
  {
    key: 'total',
    label: '面试总数',
    icon: FileText,
    bgColor: 'bg-primary-50',
    iconColor: 'text-primary-500',
    valueColor: 'text-primary-600',
  },
  {
    key: 'passRate',
    label: '通过率',
    icon: CheckCircle,
    bgColor: 'bg-success-50',
    iconColor: 'text-success-500',
    valueColor: 'text-success-600',
    suffix: '%',
    format: (v: number) => Math.round(v),
  },
  {
    key: 'avgRating',
    label: '平均评分',
    icon: Star,
    bgColor: 'bg-accent-50',
    iconColor: 'text-accent-500',
    valueColor: 'text-accent-600',
    format: (v: number) => v.toFixed(1),
  },
  {
    key: 'pendingCount',
    label: '待处理',
    icon: Clock,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-500',
    valueColor: 'text-amber-600',
  },
];

export default function StatsOverview({ stats }: StatsOverviewProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {statConfig.map((config, index) => {
        const Icon = config.icon;
        const rawValue = stats[config.key as keyof typeof stats];
        const displayValue = config.format ? config.format(rawValue) : rawValue;
        const suffix = config.suffix || '';

        return (
          <div
            key={config.key}
            className="card p-4 animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                config.bgColor
              )}>
                <Icon className={cn('w-5 h-5', config.iconColor)} />
              </div>
            </div>
            <div className={cn(
              'text-2xl font-bold mb-1',
              config.valueColor
            )}>
              {displayValue}{suffix}
            </div>
            <p className="text-sm text-neutral-500">{config.label}</p>
          </div>
        );
      })}
    </div>
  );
}
