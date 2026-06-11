import { Building2, Star, Clock } from 'lucide-react';
import { Interview } from '@/types/interview';
import { cn } from '@/lib/utils';
import { getRelativeTime } from '@/utils/date';

interface InterviewCardProps {
  interview: Interview;
  onClick?: (id: string) => void;
}

const resultConfig = {
  pass: { label: '通过', className: 'tag-success' },
  pending: { label: '待定', className: 'tag-pending' },
  fail: { label: '未通过', className: 'tag-fail' },
};

export default function InterviewCard({ interview, onClick }: InterviewCardProps) {
  const { company, position, round, interviewDate, result, overallRating, questions, notes } = interview;
  const resultInfo = resultConfig[result];

  const summary = questions.length > 0 ? questions[0].question : notes;
  const displaySummary = summary.length > 40 ? summary.slice(0, 40) + '...' : summary;

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          'w-4 h-4',
          i < rating ? 'text-accent-500 fill-accent-500' : 'text-neutral-200'
        )}
      />
    ));
  };

  return (
    <div
      className={cn(
        'card p-5 cursor-pointer hover:-translate-y-1',
        'animate-fade-in animate-slide-up'
      )}
      onClick={() => onClick?.(interview.id)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-700 text-base">{company}</h3>
            <p className="text-sm text-neutral-500">{position}</p>
          </div>
        </div>
        <span className={resultInfo.className}>{resultInfo.label}</span>
      </div>

      <div className="flex items-center gap-4 mb-3 text-sm">
        <span className="text-neutral-500">{round}</span>
        <div className="flex items-center gap-1">
          {renderStars(overallRating)}
        </div>
      </div>

      {displaySummary && (
        <p className="text-sm text-neutral-500 mb-3 line-clamp-2">
          {displaySummary}
        </p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-neutral-400">
        <Clock className="w-3.5 h-3.5" />
        <span>{getRelativeTime(interviewDate)}</span>
      </div>
    </div>
  );
}
