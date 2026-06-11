import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Rocket, BookOpen, Clock, Zap, Target, Shield, ChevronRight, AlertTriangle, History } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Switch } from '@/components/ui/Switch';
import { useSimulationStore } from '@/store/simulationStore';
import { useInterviewStore } from '@/store/interviewStore';
import { useProfileStore } from '@/store/profileStore';
import { cn } from '@/lib/utils';
import type { SimulationConfig, SimulationMode, SimulationDimension } from '@/types/simulation';
import { DIMENSION_LABELS } from '@/types/simulation';

const ROUND_OPTIONS = ['一面', '二面', '终面', '自定义'];
const DURATION_OPTIONS = [
  { count: 3 as const, label: '快速3题', desc: '约15分钟', icon: Zap },
  { count: 5 as const, label: '标准5题', desc: '约25分钟', icon: Target },
  { count: 10 as const, label: '深度10题', desc: '约50分钟', icon: Shield },
];
const ALL_DIMENSIONS = Object.keys(DIMENSION_LABELS) as SimulationDimension[];

const MODE_OPTIONS: {
  mode: SimulationMode;
  label: string;
  desc: string;
  icon: typeof BookOpen;
  gradient: string;
  iconBg: string;
}[] = [
  {
    mode: 'practice',
    label: '练习模式',
    desc: '每题即时反馈，参考答案对比，轻松提升',
    icon: BookOpen,
    gradient: 'from-primary-50 to-blue-50',
    iconBg: 'bg-primary-100 text-primary-600',
  },
  {
    mode: 'exam',
    label: '考核模式',
    desc: '限时作答，全程录音，模拟真实考场氛围',
    icon: Clock,
    gradient: 'from-accent-50 to-orange-50',
    iconBg: 'bg-accent-100 text-accent-600',
  },
];

export default function SimulationSetup() {
  const navigate = useNavigate();
  const { startSession } = useSimulationStore();
  const { interviews } = useInterviewStore();
  const { profile } = useProfileStore();

  const [position, setPosition] = useState(profile.targetPosition);
  const [round, setRound] = useState('一面');
  const [customRound, setCustomRound] = useState('');
  const [showCustomRound, setShowCustomRound] = useState(false);
  const [questionCount, setQuestionCount] = useState<3 | 5 | 10>(5);
  const [selectedDimensions, setSelectedDimensions] = useState<SimulationDimension[]>([...ALL_DIMENSIONS]);
  const [includeFailQuestions, setIncludeFailQuestions] = useState(true);
  const [mode, setMode] = useState<SimulationMode>('practice');

  const uniquePositions = useMemo(() => {
    const positions = interviews.map((iv) => iv.position).filter(Boolean);
    return [...new Set(positions)];
  }, [interviews]);

  const toggleDimension = (dim: SimulationDimension) => {
    setSelectedDimensions((prev) =>
      prev.includes(dim) ? prev.filter((d) => d !== dim) : [...prev, dim]
    );
  };

  const handleStart = () => {
    if (!position.trim()) return;
    if (selectedDimensions.length === 0) return;

    const roundValue = showCustomRound ? customRound : round;
    const config: SimulationConfig = {
      position: position.trim(),
      round: roundValue,
      questionCount,
      dimensions: selectedDimensions,
      includeFailQuestions,
      mode,
    };

    startSession(config, interviews);
    navigate('/simulation/room');
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <PageHeader title="模拟舱设置" showBack onBack={() => navigate(-1)} />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <Card className="overflow-hidden border-0">
          <div className="bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 px-6 py-8 text-white">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Rocket className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight">面试模拟舱</h2>
                <p className="text-white/70 text-sm mt-0.5">
                  真实面试前，先来一轮模拟演练
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>目标岗位</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label>岗位名称</Label>
              <Input
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="请输入目标岗位"
              />
            </div>
            {uniquePositions.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-neutral-400">历史岗位</Label>
                <div className="flex flex-wrap gap-2">
                  {uniquePositions.map((pos) => (
                    <Chip
                      key={pos}
                      active={position === pos}
                      onClick={() => setPosition(pos)}
                    >
                      {pos}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>面试轮次</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ROUND_OPTIONS.map((r) =>
                r === '自定义' && showCustomRound ? (
                  <div key="custom" className="flex items-center gap-2">
                    <Input
                      value={customRound}
                      onChange={(e) => setCustomRound(e.target.value)}
                      placeholder="输入轮次"
                      className="w-28 py-1.5 px-3 text-sm"
                      autoFocus
                    />
                  </div>
                ) : (
                  <Chip
                    key={r}
                    active={
                      r === '自定义'
                        ? showCustomRound
                        : round === r && !showCustomRound
                    }
                    onClick={() => {
                      if (r === '自定义') {
                        setShowCustomRound(true);
                        setRound('');
                      } else {
                        setShowCustomRound(false);
                        setRound(r);
                        setCustomRound('');
                      }
                    }}
                  >
                    {r}
                  </Chip>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模拟时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {DURATION_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = questionCount === opt.count;
                return (
                  <button
                    key={opt.count}
                    type="button"
                    onClick={() => setQuestionCount(opt.count)}
                    className={cn(
                      'relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200',
                      isActive
                        ? 'border-primary-500 bg-primary-50 shadow-sm shadow-primary-100'
                        : 'border-neutral-200 bg-white hover:border-neutral-300'
                    )}
                  >
                    {isActive && (
                      <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-primary-500 flex items-center justify-center">
                        <ChevronRight className="w-2.5 h-2.5 text-white rotate-90" strokeWidth={3} />
                      </div>
                    )}
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center transition-colors',
                        isActive ? 'bg-primary-100 text-primary-600' : 'bg-neutral-100 text-neutral-400'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        isActive ? 'text-primary-600' : 'text-neutral-700'
                      )}
                    >
                      {opt.label}
                    </span>
                    <span className="text-xs text-neutral-400">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>侧重维度</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {ALL_DIMENSIONS.map((dim) => (
                <Chip
                  key={dim}
                  active={selectedDimensions.includes(dim)}
                  onClick={() => toggleDimension(dim)}
                >
                  {DIMENSION_LABELS[dim]}
                </Chip>
              ))}
            </div>
            <Switch
              checked={includeFailQuestions}
              onChange={setIncludeFailQuestions}
              label="包含翻车题"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模式选择</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {MODE_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isActive = mode === opt.mode;
                return (
                  <button
                    key={opt.mode}
                    type="button"
                    onClick={() => setMode(opt.mode)}
                    className={cn(
                      'relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 transition-all duration-200 text-left',
                      isActive
                        ? 'border-primary-500 shadow-sm shadow-primary-100'
                        : 'border-neutral-200 hover:border-neutral-300'
                    )}
                  >
                    {isActive && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary-500 flex items-center justify-center">
                        <ChevronRight className="w-3 h-3 text-white rotate-90" strokeWidth={3} />
                      </div>
                    )}
                    <div
                      className={cn(
                        'w-full rounded-xl bg-gradient-to-br p-3 flex items-center gap-3',
                        opt.gradient
                      )}
                    >
                      <div
                        className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                          opt.iconBg
                        )}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div
                          className={cn(
                            'font-semibold text-sm',
                            isActive ? 'text-primary-700' : 'text-neutral-700'
                          )}
                        >
                          {opt.label}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <button
              type="button"
              onClick={() => navigate('/simulation/fail-questions')}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50 active:bg-neutral-100 border-b border-neutral-50"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-accent-50">
                  <AlertTriangle className="w-5 h-5 text-accent-500" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-neutral-700">翻车题库</span>
                  <p className="text-xs text-neutral-400 mt-0.5">错题攻克，专项突破</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/simulation/history')}
              className="w-full flex items-center justify-between px-5 py-4 transition-colors hover:bg-neutral-50 active:bg-neutral-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-primary-50">
                  <History className="w-5 h-5 text-primary-500" />
                </div>
                <div className="text-left">
                  <span className="text-sm font-medium text-neutral-700">模拟历史</span>
                  <p className="text-xs text-neutral-400 mt-0.5">查看进步轨迹</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-300" />
            </button>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 safe-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Button
            variant="primary"
            fullWidth
            size="lg"
            onClick={handleStart}
            disabled={!position.trim() || selectedDimensions.length === 0}
          >
            <Rocket className="w-5 h-5" />
            开始模拟
          </Button>
        </div>
      </div>
    </div>
  );
}
