import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, BookOpen, Trophy, TrendingUp, Calendar, ChevronRight, Trash2, Target } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Modal } from '@/components/ui/Modal';
import { useSimulationStore } from '@/store/simulationStore';
import { cn } from '@/lib/utils';
import { DIMENSION_LABELS } from '@/types/simulation';
import type { SimulationDimension, SimulationMode } from '@/types/simulation';
import { formatDate } from '@/utils/date';

const modeLabels: Record<SimulationMode, string> = {
  practice: '练习模式',
  exam: '考核模式',
};

const modeTagVariant: Record<SimulationMode, 'primary' | 'fail'> = {
  practice: 'primary',
  exam: 'fail',
};

function getScoreColor(score: number): string {
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-500';
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return 'bg-green-50';
  if (score >= 50) return 'bg-amber-50';
  return 'bg-red-50';
}

export default function SimulationHistory() {
  const navigate = useNavigate();
  const { reports, loadReports, deleteReport } = useSimulationStore();

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const totalCount = reports.length;
  const avgScore = totalCount > 0
    ? Math.round(reports.reduce((sum, r) => sum + r.totalScore, 0) / totalCount)
    : 0;
  const now = new Date();
  const thisMonthCount = reports.filter((r) => {
    const d = new Date(r.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  }).length;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteReport(deleteTarget);
    setDeleteTarget(null);
  };

  const getTopWeakDimensions = (dimensionScores: Record<SimulationDimension, number>) => {
    return Object.entries(dimensionScores)
      .sort(([, a], [, b]) => a - b)
      .slice(0, 2)
      .map(([dim]) => dim as SimulationDimension);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <PageHeader title="模拟记录" />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 pb-24">
        {reports.length > 0 && (
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
              </div>
              <div className="text-2xl font-bold text-primary-600">{totalCount}</div>
              <p className="text-xs text-neutral-500 mt-1">总模拟</p>
            </div>
            <div className="card p-4 text-center">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2', getScoreBgColor(avgScore))}>
                <Trophy className={cn('w-5 h-5', getScoreColor(avgScore))} />
              </div>
              <div className={cn('text-2xl font-bold', getScoreColor(avgScore))}>{avgScore}</div>
              <p className="text-xs text-neutral-500 mt-1">平均分</p>
            </div>
            <div className="card p-4 text-center">
              <div className="w-10 h-10 rounded-xl bg-accent-50 flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-5 h-5 text-accent-500" />
              </div>
              <div className="text-2xl font-bold text-accent-600">{thisMonthCount}</div>
              <p className="text-xs text-neutral-500 mt-1">本月</p>
            </div>
          </div>
        )}

        {reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary-50 flex items-center justify-center mb-5">
              <Target className="w-10 h-10 text-primary-400" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              还没有模拟记录
            </h3>
            <p className="text-sm text-neutral-500 max-w-xs leading-relaxed">
              完成一次面试模拟后，你的练习记录和成绩报告将展示在这里
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((report) => {
              const weakDims = getTopWeakDimensions(report.dimensionScores);
              return (
                <Card
                  key={report.id}
                  className="overflow-hidden cursor-pointer hover:shadow-card transition-shadow duration-200"
                  onClick={() => navigate(`/simulation/report/${report.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Tag variant={modeTagVariant[report.config.mode]} className="text-xs">
                            {modeLabels[report.config.mode]}
                          </Tag>
                          <span className="text-xs text-neutral-400">
                            {report.config.questionCount}题
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-neutral-500 mb-2">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatDate(report.createdAt, 'yyyy-MM-dd HH:mm')}</span>
                        </div>

                        {weakDims.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <TrendingUp className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                            {weakDims.map((dim) => (
                              <Tag key={dim} variant="pending" className="text-xs">
                                {DIMENSION_LABELS[dim]}
                              </Tag>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className={cn(
                          'w-14 h-14 rounded-xl flex items-center justify-center',
                          getScoreBgColor(report.totalScore)
                        )}>
                          <span className={cn('text-xl font-bold', getScoreColor(report.totalScore))}>
                            {report.totalScore}
                          </span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-neutral-300" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {reports.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-safe-bottom bg-gradient-to-t from-neutral-50 via-neutral-50/95 to-transparent pt-6">
          <div className="max-w-2xl mx-auto">
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate('/simulation/setup')}
            >
              开始新模拟
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
          确定要删除这条模拟记录吗？删除后无法恢复。
        </p>
      </Modal>
    </div>
  );
}
