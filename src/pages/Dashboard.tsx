import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  CheckCircle,
  Star,
  Clock,
  TrendingUp,
  BarChart3,
  PieChart as PieChartIcon,
  HelpCircle,
  Smile,
  Sparkles,
  Plus,
  Rocket,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LineChart from '@/components/charts/LineChart';
import RadarChart from '@/components/charts/RadarChart';
import PieChart from '@/components/charts/PieChart';
import { useInterviewStore } from '@/store/interviewStore';
import { useProfileStore } from '@/store/profileStore';
import {
  calculateStats,
  getTopQuestions,
  getAbilityTrend,
} from '@/utils/analysis';
import { formatDate } from '@/utils/date';
import type { Interview, MoodType } from '@/types/interview';

function getMoodValue(mood: MoodType): number {
  switch (mood) {
    case 'good':
      return 3;
    case 'neutral':
      return 2;
    case 'bad':
      return 1;
    default:
      return 2;
  }
}

function getResultValue(result: Interview['result']): number {
  switch (result) {
    case 'pass':
      return 100;
    case 'pending':
      return 50;
    case 'fail':
      return 0;
    default:
      return 0;
  }
}

function getRoundDistribution(interviews: Interview[]) {
  const countMap: Record<string, number> = {};
  interviews.forEach((iv) => {
    countMap[iv.round] = (countMap[iv.round] || 0) + 1;
  });
  const colors = ['#165DFF', '#36BFFA', '#00B42A', '#FF7D00', '#722ED1'];
  return Object.entries(countMap).map(([label, value], index) => ({
    label,
    value,
    color: colors[index % colors.length],
  }));
}

function getResultDistribution(interviews: Interview[]) {
  const passCount = interviews.filter((iv) => iv.result === 'pass').length;
  const pendingCount = interviews.filter((iv) => iv.result === 'pending').length;
  const failCount = interviews.filter((iv) => iv.result === 'fail').length;
  return [
    { label: '通过', value: passCount, color: '#00B42A' },
    { label: '待定', value: pendingCount, color: '#FF7D00' },
    { label: '未通过', value: failCount, color: '#86909C' },
  ].filter((item) => item.value > 0);
}

function getEncouragementMessage(
  stats: ReturnType<typeof calculateStats>,
  sortedInterviews: Interview[]
): string {
  if (sortedInterviews.length >= 10) {
    const recent = sortedInterviews.slice(0, 5);
    const earlier = sortedInterviews.slice(5, 10);
    const recentPass = recent.filter((iv) => iv.result === 'pass').length;
    const earlierPass = earlier.filter((iv) => iv.result === 'pass').length;
    if (recentPass > earlierPass) {
      return '你已持续进步，最近几次面试表现越来越好！';
    }
  }
  if (stats.total > 10) {
    return '面试经验丰富，相信你离心仪Offer不远了！';
  }
  if (stats.failCount > 0) {
    return '失败是成功之母，每次面试都是成长的机会';
  }
  return '坚持复盘，每一次面试都是进步的阶梯';
}

const statConfig = [
  {
    key: 'total',
    label: '总面试次数',
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
  },
  {
    key: 'avgRating',
    label: '平均评分',
    icon: Star,
    bgColor: 'bg-accent-50',
    iconColor: 'text-accent-500',
    valueColor: 'text-accent-600',
  },
  {
    key: 'pendingCount',
    label: '待定面试',
    icon: Clock,
    bgColor: 'bg-amber-50',
    iconColor: 'text-amber-500',
    valueColor: 'text-amber-600',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const loadInterviews = useInterviewStore((s) => s.loadInterviews);
  const interviews = useInterviewStore((s) => s.interviews);
  const loadProfile = useProfileStore((s) => s.loadProfile);

  useEffect(() => {
    loadInterviews();
    loadProfile();
  }, [loadInterviews, loadProfile]);

  const sortedInterviews = useMemo(
    () =>
      [...interviews].sort(
        (a, b) =>
          new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime()
      ),
    [interviews]
  );

  const stats = useMemo(() => calculateStats(interviews), [interviews]);
  const topQuestions = useMemo(() => getTopQuestions(interviews, 10), [interviews]);
  const abilityTrend = useMemo(() => getAbilityTrend(interviews), [interviews]);

  const recent10 = useMemo(() => sortedInterviews.slice(0, 10), [sortedInterviews]);

  const passTrendData = useMemo(() => {
    const reversed = [...recent10].reverse();
    return {
      labels: reversed.map((iv) =>
        iv.company.length > 4 ? iv.company.slice(0, 4) : iv.company
      ),
      datasets: [
        {
          label: '通过率',
          data: reversed.map((iv) => getResultValue(iv.result)),
          color: '#165DFF',
        },
      ],
    };
  }, [recent10]);

  const moodTrendData = useMemo(() => {
    const reversed = [...recent10].reverse();
    return {
      labels: reversed.map((iv) => formatDate(iv.interviewDate, 'MM-dd')),
      datasets: [
        {
          label: '心情指数',
          data: reversed.map((iv) => getMoodValue(iv.mood)),
          color: '#FF7D00',
        },
      ],
    };
  }, [recent10]);

  const roundDistribution = useMemo(
    () => getRoundDistribution(interviews),
    [interviews]
  );
  const resultDistribution = useMemo(
    () => getResultDistribution(interviews),
    [interviews]
  );

  const encouragement = useMemo(
    () => getEncouragementMessage(stats, sortedInterviews),
    [stats, sortedInterviews]
  );

  const handleNewInterview = () => {
    navigate('/interview/new');
  };

  if (interviews.length === 0) {
    return (
      <div className="flex flex-col min-h-full">
        <PageHeader title="成长看板" />
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-16 animate-fade-in animate-slide-up">
          <div className="w-28 h-28 rounded-full bg-gradient-primary flex items-center justify-center mb-6 shadow-glow">
            <BarChart3 className="w-14 h-14 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">
            开始记录你的面试成长
          </h3>
          <p className="text-sm text-neutral-500 mb-8 text-center px-8 max-w-sm">
            添加第一条面试记录后，这里将展示你的面试数据、能力成长和趋势分析
          </p>
          <Button onClick={handleNewInterview} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            新增面试记录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="成长看板" />

      <div className="flex-1 px-4 py-4 space-y-4 safe-bottom">
        <div className="animate-fade-in animate-slide-up animate-stagger-1">
          <div className="grid grid-cols-2 gap-3">
            {statConfig.map((config, index) => {
              const Icon = config.icon;
              const rawValue = stats[config.key as keyof typeof stats];
              const displayValue =
                config.key === 'avgRating'
                  ? Number(rawValue).toFixed(1)
                  : rawValue;
              const suffix = config.suffix || '';

              return (
                <div key={config.key} className="card p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div
                      className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center',
                        config.bgColor
                      )}
                    >
                      <Icon className={cn('w-5 h-5', config.iconColor)} />
                    </div>
                  </div>
                  <div className={cn('text-2xl font-bold mb-1', config.valueColor)}>
                    {displayValue}
                    {suffix}
                  </div>
                  <p className="text-sm text-neutral-500">{config.label}</p>
                </div>
              );
            })}
          </div>
        </div>

        <Card className="animate-fade-in animate-slide-up animate-stagger-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-500" />
              <CardTitle>通过率趋势</CardTitle>
            </div>
            <CardDescription>近10次面试结果变化</CardDescription>
          </CardHeader>
          <CardContent>
            {recent10.length > 0 ? (
              <LineChart
                labels={passTrendData.labels}
                datasets={passTrendData.datasets}
                height={240}
              />
            ) : (
              <div className="h-60 flex items-center justify-center text-neutral-400 text-sm">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-3">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-accent-500" />
              <CardTitle>能力成长对比</CardTitle>
            </div>
            <CardDescription>最早5次 vs 最近5次</CardDescription>
          </CardHeader>
          <CardContent>
            <RadarChart
              data={abilityTrend.recent}
              comparisonData={abilityTrend.early}
              height={300}
            />
            <button
              type="button"
              onClick={() => navigate('/simulation/setup')}
              className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-blue-600 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            >
              <Rocket className="w-4 h-4" />
              模拟提升
            </button>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary-500" />
              <CardTitle>面试分布</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-neutral-600 mb-3">
                面试轮次分布
              </h4>
              {roundDistribution.length > 0 ? (
                <PieChart data={roundDistribution} height={240} />
              ) : (
                <div className="h-60 flex items-center justify-center text-neutral-400 text-sm">
                  暂无数据
                </div>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium text-neutral-600 mb-3">
                面试结果分布
              </h4>
              {resultDistribution.length > 0 ? (
                <PieChart data={resultDistribution} height={240} />
              ) : (
                <div className="h-60 flex items-center justify-center text-neutral-400 text-sm">
                  暂无数据
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-primary-500" />
              <CardTitle>高频问题</CardTitle>
            </div>
            <CardDescription>出现次数最多的面试问题 Top10</CardDescription>
          </CardHeader>
          <CardContent>
            {topQuestions.length > 0 ? (
              <div className="space-y-3">
                {topQuestions.map((item, index) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 py-2 border-b border-neutral-50 last:border-0 last:pb-0"
                  >
                    <div
                      className={cn(
                        'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5',
                        index < 3
                          ? 'bg-gradient-accent text-white'
                          : 'bg-neutral-100 text-neutral-500'
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700 leading-relaxed break-all">
                        {item.title}
                      </p>
                    </div>
                    <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full flex-shrink-0">
                      {item.count}次
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-neutral-400 text-sm">
                暂无问题记录
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-6">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smile className="w-5 h-5 text-accent-500" />
              <CardTitle>心情变化曲线</CardTitle>
            </div>
            <CardDescription>近10次面试的心情变化</CardDescription>
          </CardHeader>
          <CardContent>
            {recent10.length > 0 ? (
              <LineChart
                labels={moodTrendData.labels}
                datasets={moodTrendData.datasets}
                height={220}
              />
            ) : (
              <div className="h-60 flex items-center justify-center text-neutral-400 text-sm">
                暂无数据
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-6 overflow-hidden">
          <div className="bg-gradient-card p-6">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-accent flex items-center justify-center flex-shrink-0 shadow-button">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-neutral-700 mb-2">
                  成长寄语
                </h3>
                <p className="text-neutral-600 leading-relaxed">
                  {encouragement}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
