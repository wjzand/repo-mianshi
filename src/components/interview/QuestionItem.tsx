import { useState } from 'react';
import { ChevronDown, ChevronUp, Star, Pencil, Trash2, MessageSquare } from 'lucide-react';
import { InterviewQuestion } from '@/types/interview';
import { cn } from '@/lib/utils';

interface QuestionItemProps {
  question: InterviewQuestion;
  editable?: boolean;
  onEdit?: (question: InterviewQuestion) => void;
  onDelete?: (id: string) => void;
}

export default function QuestionItem({ question, editable, onEdit, onDelete }: QuestionItemProps) {
  const [expanded, setExpanded] = useState(false);

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              'w-4 h-4',
              i < rating ? 'text-accent-500 fill-accent-500' : 'text-neutral-200'
            )}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors"
      >
        <div className="flex-1 min-w-0 mr-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="tag-primary">{question.category}</span>
          </div>
          <p className="text-neutral-700 font-medium truncate">{question.question}</p>
        </div>
        <div className="flex items-center gap-3">
          {renderStars(question.rating)}
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="w-5 h-5 text-neutral-400 flex-shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 animate-slide-down space-y-4">
          <div className="divider" />

          <div className="space-y-3">
            <div>
              <label className="input-label mb-1">问题</label>
              <p className="text-neutral-700 bg-neutral-50 rounded-xl p-3 text-sm">
                {question.question}
              </p>
            </div>

            {question.answer && (
              <div>
                <label className="input-label mb-1">我的回答</label>
                <p className="text-neutral-600 bg-neutral-50 rounded-xl p-3 text-sm whitespace-pre-wrap">
                  {question.answer}
                </p>
              </div>
            )}

            <div>
              <label className="input-label mb-1">评分</label>
              {renderStars(question.rating)}
            </div>

            {question.feedback && (
              <div>
                <div className="flex items-center gap-2 input-label mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>面试官反馈</span>
                </div>
                <p className="text-neutral-600 bg-primary-50 rounded-xl p-3 text-sm whitespace-pre-wrap">
                  {question.feedback}
                </p>
              </div>
            )}
          </div>

          {editable && (
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onEdit?.(question)}
                className="btn-ghost flex items-center gap-1 text-primary-600 hover:bg-primary-50"
              >
                <Pencil className="w-4 h-4" />
                <span>编辑</span>
              </button>
              <button
                onClick={() => onDelete?.(question.id)}
                className="btn-ghost flex items-center gap-1 text-neutral-500 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
