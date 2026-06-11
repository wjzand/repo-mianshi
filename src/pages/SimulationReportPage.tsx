import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  BookOpen,
  Target,
  ChevronDown,
  ChevronUp,
  Star,
  Plus,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import RadarChart from '@/components/charts/RadarChart';
import { useSimulationStore } from '@/store/simulationStore';
import { cn } from '@/lib/utils';
import { DIMENSION_LABELS } from '@/types/simulation';
import type { SimulationDimension, SimulationAnswer } from '@/types/simulation';

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-success-500';
  if (score >= 60) return 'text-primary-500';
  if (score >= 40) return 'text-accent-500';
  return 'text-red-500';
}

function getBarColor(score: number): string {
  if (score >= 80) return 'bg-success-500';
  if (score >= 60) return 'bg-primary-500';
  if (score >= 40) return 'bg-accent-500';
  return 'bg-red-500';
}

function getBarBgColor(score: number): string {
  if (score >= 80) return 'bg-success-100';
  if (score >= 60) return 'bg-primary-100';
  if (score >= 40) return 'bg-accent-100';
  return 'bg-red-100';
}

function getScoreLabel(score: number): string {
  if (score >= 90) return '优秀';
  if (score >= 80) return '良好';
  if (score >= 60) return '合格';
  if (score >= 40) return '待提升';
  return '需加强';
}

function ComparisonArrow({ diff }: { diff: number | undefined }) {
  if (diff === undefined || diff === 0) {
    return (
      <span className="flex items-center gap-0.5 text-neutral-400 text-xs">
        <Minus className="w-3 h-3" />
        <span>持平</span>
      </span>
    );
  }
  if (diff > 0) {
    return (
      <span className="flex items-center gap-0.5 text-success-500 text-xs">
        <TrendingUp className="w-3 h-3" />
        <span>+{diff}</span>
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-red-500 text-xs">
      <TrendingDown className="w-3 h-3" />
      <span>{diff}</span>
    </span>
  );
}

function MiniScoreBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-neutral-500 w-10 flex-shrink-0">{label}</span>
      <div className={cn('flex-1 h-1.5 rounded-full', getBarBgColor(value))}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', getBarColor(value))}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={cn('text-xs font-medium w-7 text-right', getScoreColor(value))}>
        {value}
      </span>
    </div>
  );
}

function AnswerCard({
  answer,
  index,
  total,
}: {
  answer: SimulationAnswer;
  index: number;
  total: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showImproved, setShowImproved] = useState(false);
  const addFailQuestion = useSimulationStore((s) => s.addFailQuestion);

  const avgScore = useMemo(() => {
    const { completeness, clarity, evidence, fluency } = answer.scores;
    return Math.round((completeness + clarity + evidence + fluency) / 4);
  }, [answer.scores]);

  const isWeak = avgScore < 60;

  const handleAddToFailBank = () => {
    addFailQuestion({
      id: Date.now().toString(36) + Math.random().toString(36).substring(2, 9),
      question: answer.question,
      originalAnswer: answer.answer,
      source: 'simulation',
      sourceId: answer.questionId,
      weaknessTags: answer.improvements.slice(0, 3),
      suggestion: answer.improvements[0] || '',
      dimension: 'technical',
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <Card className="overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left"
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-neutral-700">
                第 {index + 1} 题
              </span>
              <span className="text-xs text-neutral-400">/ {total}</span>
              <Tag variant={avgScore >= 60 ? 'primary' : 'fail'} className="text-xs">
                {getScoreLabel(avgScore)}
              </Tag>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn('text-lg font-bold', getScoreColor(avgScore))}>
                {avgScore}
              </span>
              {expanded ? (
                <ChevronUp className="w-4 h-4 text-neutral-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              )}
            </div>
          </div>
          <p className="text-sm text-neutral-600 leading-relaxed line-clamp-2">
            {answer.question}
          </p>
        </div>
      </button>

      {expanded && (
        <CardContent className="border-t border-neutral-100 pt-4 space-y-4">
          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1.5">你的回答</h4>
            <p className="text-sm text-neutral-700 leading-relaxed bg-neutral-50 rounded-lg p-3">
              {answer.answer}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-2">分项评分</h4>
            <div className="space-y-2">
              <MiniScoreBar label="完整度" value={answer.scores.completeness} />
              <MiniScoreBar label="清晰度" value={answer.scores.clarity} />
              <MiniScoreBar label="论据性" value={answer.scores.evidence} />
              <MiniScoreBar label="流畅度" value={answer.scores.fluency} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-medium text-neutral-500 mb-1.5">AI 反馈</h4>
            <p className="text-sm text-neutral-600 leading-relaxed">{answer.feedback}</p>
          </div>

          {answer.highlights.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">亮点</h4>
              <div className="flex flex-wrap gap-1.5">
                {answer.highlights.map((h, i) => (
                  <Tag key={i} variant="success" className="text-xs">
                    {h}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {answer.improvements.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-neutral-500 mb-2">待改进</h4>
              <div className="flex flex-wrap gap-1.5">
                {answer.improvements.map((imp, i) => (
                  <Tag key={i} variant="pending" className="text-xs">
                    {imp}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {answer.improvedAnswer && (
            <div>
              <button
                type="button"
                onClick={() => setShowImproved(!showImproved)}
                className="flex items-center gap-1 text-xs text-primary-500 font-medium mb-2"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>{showImproved ? '收起参考答案' : '查看参考答案'}</span>
                {showImproved ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </button>
              {showImproved && (
                <p className="text-sm text-neutral-600 leading-relaxed bg-primary-50 rounded-lg p-3">
                  {answer.improvedAnswer}
                </p>
              )}
            </div>
          )}

          {isWeak && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddToFailBank}
              className="text-accent-600"
            >
              <Plus className="w-4 h-4" />
              加入翻车题库
            </Button>
          )}
        </CardContent>
      )}
    </Card>
  );
}

export default function SimulationReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { reports, loadReports, addFailQuestion } = useSimulationStore();

  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (reports.length === 0) {
      loadReports().then(() => setLoaded(true));
    } else {
      setLoaded(true);
    }
  }, [reports.length, loadReports]);

  const report = useMemo(() => {
    if (!sessionId) return null;
    return reports.find((r) => r.sessionId === sessionId) || null;
  }, [sessionId, reports]);

  useEffect(() => {
    if (loaded && !report) {
      navigate('/simulation/history', { replace: true });
    }
  }, [loaded, report, navigate]);

  const radarData = useMemo(() => {
    if (!report) return null;
    return {
      labels: Object.keys(report.dimensionScores).map(
        (k) => DIMENSION_LABELS[k as SimulationDimension]
      ),
      values: Object.values(report.dimensionScores),
    };
  }, [report]);

  const dimensionEntries = useMemo(() => {
    if (!report) return [];
    return Object.entries(report.dimensionScores) as [SimulationDimension, number][];
  }, [report]);

  const formattedDate = useMemo(() => {
    if (!report) return '';
    const d = new Date(report.createdAt);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  }, [report]);

  if (!loaded || !report) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <PageHeader title="模拟报告" showBack onBack={() => navigate(-1)} />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-neutral-400">加载中...</p>
        </div>
      </div>
    );
  }

  const scorePercentage = report.totalScore / 100;

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <PageHeader title="模拟报告" showBack onBack={() => navigate(-1)} />

      <main className="max-w-2xl mx-auto w-full px-4 py-6 space-y-5 pb-24">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center">
            <div className="relative w-36 h-36 mb-4">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-neutral-100"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="52"
                  fill="none"
                  stroke="url(#scoreGradient)"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 52}`}
                  strokeDashoffset={`${2 * Math.PI * 52 * (1 - scorePercentage)}`}
                  className="transition-all duration-1000 ease-out"
                />
                <defs>
                  <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#165DFF" />
                    <stop offset="100%" stopColor="#FF7D00" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-3xl font-bold', getScoreColor(report.totalScore))}>
                  {report.totalScore}
                </span>
                <span className="text-xs text-neutral-400">综合得分</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <Tag variant="primary">
                {report.config.mode === 'exam' ? '考试模式' : '练习模式'}
              </Tag>
              <Tag variant="accent">{report.config.questionCount} 题</Tag>
            </div>

            <p className="text-xs text-neutral-400">{formattedDate}</p>

            {report.comparedToLast && report.comparedToLast['total'] !== undefined && (
              <div className="mt-2">
                <ComparisonArrow diff={report.comparedToLast['total']} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-500" />
              <CardTitle>维度评分</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {radarData && <RadarChart data={radarData} height={280} />}

            <div className="mt-4 space-y-3">
              {dimensionEntries.map(([dim, score]) => (
                <div key={dim} className="flex items-center gap-3">
                  <span className="text-sm text-neutral-600 w-16 flex-shrink-0">
                    {DIMENSION_LABELS[dim]}
                  </span>
                  <div className={cn('flex-1 h-2.5 rounded-full', getBarBgColor(score))}>
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        getBarColor(score)
                      )}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                  <span className={cn('text-sm font-semibold w-8 text-right', getScoreColor(score))}>
                    {score}
                  </span>
                  <ComparisonArrow diff={report.comparedToLast?.[dim]} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <BookOpen className="w-4 h-4 text-accent-500" />
            <h3 className="text-base font-semibold text-neutral-700">逐题回顾</h3>
            <span className="text-xs text-neutral-400">({report.answers.length} 题)</span>
          </div>
          <div className="space-y-3">
            {report.answers.map((answer, idx) => (
              <AnswerCard
                key={answer.questionId}
                answer={answer}
                index={idx}
                total={report.answers.length}
              />
            ))}
          </div>
        </div>

        {report.suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-accent-500" />
                <CardTitle>改进建议</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {report.suggestions.map((suggestion, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-neutral-600 leading-relaxed"
                  >
                    <TrendingUp className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>

              <Button
                fullWidth
                className="mt-5"
                onClick={() => navigate('/simulation/setup')}
              >
                <Trophy className="w-4 h-4" />
                开始新一轮模拟
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-neutral-200 safe-bottom">
        <div className="max-w-2xl mx-auto flex items-center gap-2">
          <Button
            variant="secondary"
            fullWidth
            onClick={() => navigate('/')}
          >
            返回首页
          </Button>
          <Button
            fullWidth
            onClick={() => navigate('/simulation/setup')}
          >
            再次模拟
          </Button>
        </div>
      </div>
    </div>
  );
}
