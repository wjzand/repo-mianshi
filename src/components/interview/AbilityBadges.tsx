import { Code2, MessageSquare, Brain, Briefcase, Shield, Target } from 'lucide-react';
import { AbilityScores } from '@/types/interview';
import { cn } from '@/lib/utils';

interface AbilityBadgesProps {
  scores: AbilityScores;
}

const abilityConfig: {
  key: keyof AbilityScores;
  label: string;
  icon: typeof Code2;
  color: string;
}[] = [
  { key: 'technical', label: '技术能力', icon: Code2, color: 'bg-primary-500' },
  { key: 'communication', label: '沟通表达', icon: MessageSquare, color: 'bg-success-500' },
  { key: 'logic', label: '逻辑思维', icon: Brain, color: 'bg-accent-500' },
  { key: 'project', label: '项目经验', icon: Briefcase, color: 'bg-purple-500' },
  { key: 'pressure', label: '抗压能力', icon: Shield, color: 'bg-blue-500' },
  { key: 'match', label: '岗位匹配', icon: Target, color: 'bg-rose-500' },
];

export default function AbilityBadges({ scores }: AbilityBadgesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {abilityConfig.map((config) => {
        const score = scores[config.key];
        const Icon = config.icon;
        const percentage = (score / 5) * 100;

        return (
          <div
            key={config.key}
            className="card p-4 animate-fade-in"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center',
                'bg-gradient-card'
              )}>
                <Icon className="w-5 h-5 text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-neutral-700">{config.label}</span>
                  <span className="text-sm font-semibold text-neutral-600">{score.toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  config.color
                )}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
