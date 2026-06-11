import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, BookOpen, Trash2, Filter, Target, Plus, ChevronRight } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { useSimulationStore } from '@/store/simulationStore';
import { cn } from '@/lib/utils';
import { DIMENSION_LABELS } from '@/types/simulation';
import type { SimulationDimension } from '@/types/simulation';

type FilterOption = 'all' | SimulationDimension;

const filterOptions: FilterOption[] = ['all', ...Object.keys(DIMENSION_LABELS) as SimulationDimension[]];

const sourceLabels: Record<string, string> = {
  interview: '来自面试',
  simulation: '来自模拟',
};

export default function FailQuestionBank() {
  const navigate = useNavigate();
  const { failQuestions, loadFailQuestions, deleteFailQuestion } = useSimulationStore();

  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadFailQuestions();
  }, [loadFailQuestions]);

  const filtered = activeFilter === 'all'
    ? failQuestions
    : failQuestions.filter((q) => q.dimension === activeFilter);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteFailQuestion(deleteTarget);
    setDeleteTarget(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader
        title="翻车题库"
        rightAction={
          failQuestions.length > 0 ? (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-primary-500 text-white text-xs font-bold">
              {failQuestions.length}
            </span>
          ) : undefined
        }
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-neutral-400" />
            <span className="text-sm text-neutral-500">按维度筛选</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {filterOptions.map((opt) => (
              <Chip
                key={opt}
                active={activeFilter === opt}
                onClick={() => setActiveFilter(opt)}
                className="flex-shrink-0"
              >
                {opt === 'all' ? '全部' : DIMENSION_LABELS[opt]}
              </Chip>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center mb-5">
              <AlertTriangle className="w-10 h-10 text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              还没有翻车题目
            </h3>
            <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
              在面试模拟或真实面试中获得低分的回答会自动收录到这里，帮助你针对性攻克薄弱环节
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((q) => {
              const isExpanded = expandedIds.has(q.id);
              return (
                <Card key={q.id} className="overflow-hidden">
                  <div
                    className="p-4 cursor-pointer hover:bg-neutral-50 transition-colors"
                    onClick={() => toggleExpand(q.id)}
                  >
                    <p className="text-neutral-800 font-bold leading-relaxed mb-3">
                      {q.question}
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Tag variant="primary" className="text-xs">
                        {sourceLabels[q.source] ?? q.source}
                      </Tag>
                      <Tag variant="accent" className="text-xs">
                        {DIMENSION_LABELS[q.dimension]}
                      </Tag>
                      {q.weaknessTags.map((tag) => (
                        <Tag key={tag} variant="pending" className="text-xs">
                          {tag}
                        </Tag>
                      ))}
                      <ChevronRight
                        className={cn(
                          'w-4 h-4 text-neutral-400 ml-auto transition-transform duration-200',
                          isExpanded && 'rotate-90'
                        )}
                      />
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 animate-slide-down">
                      <div className="h-px bg-neutral-100" />

                      {q.suggestion && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-primary-500" />
                            <span className="text-xs font-medium text-neutral-500">改进建议</span>
                          </div>
                          <p className="text-sm text-neutral-600 bg-primary-50/60 rounded-xl p-3 leading-relaxed">
                            {q.suggestion}
                          </p>
                        </div>
                      )}

                      {q.originalAnswer && (
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-4 h-4 text-neutral-400" />
                            <span className="text-xs font-medium text-neutral-500">原始回答</span>
                          </div>
                          <p className="text-sm text-neutral-500 bg-neutral-50 rounded-xl p-3 leading-relaxed line-clamp-4">
                            {q.originalAnswer}
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(q.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          删除
                        </Button>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {failQuestions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-bottom bg-gradient-to-t from-neutral-50 via-neutral-50/95 to-transparent pt-6">
          <div className="max-w-2xl mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate('/simulation/setup?mode=failtrain')}
            >
              <Plus className="w-5 h-5 mr-2" />
              开始翻车特训
            </Button>
          </div>
        </div>
      )}

      <Modal
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        title="确认删除"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setDeleteTarget(null)}>
              取消
            </Button>
            <Button
              className="bg-red-500 hover:bg-red-600 text-white"
              onClick={handleDelete}
            >
              删除
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          确定要删除这道翻车题目吗？删除后无法恢复。
        </p>
      </Modal>
    </div>
  );
}
