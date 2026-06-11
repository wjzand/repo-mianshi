import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, FileText, Sparkles, Rocket } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import FloatingButton from '@/components/layout/FloatingButton';
import StatsOverview from '@/components/interview/StatsOverview';
import InterviewFilter from '@/components/interview/InterviewFilter';
import type { InterviewFilters as UIFilters, TimeFilter } from '@/components/interview/InterviewFilter';
import InterviewCard from '@/components/interview/InterviewCard';
import { Button } from '@/components/ui/Button';
import { useInterviewStore } from '@/store/interviewStore';
import { useProfileStore } from '@/store/profileStore';
import { useSimulationStore } from '@/store/simulationStore';
import { calculateStats } from '@/utils/analysis';
import type { InterviewResult } from '@/types/interview';

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 9) return '早上好';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  if (hour < 22) return '晚上好';
  return '夜深了';
}

function getTimeRange(time: TimeFilter): { dateFrom?: string; dateTo?: string } {
  const now = new Date();
  const today = format(now, 'yyyy-MM-dd');

  switch (time) {
    case 'week': {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { dateFrom: format(weekAgo, 'yyyy-MM-dd'), dateTo: today };
    }
    case 'month': {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { dateFrom: format(monthAgo, 'yyyy-MM-dd'), dateTo: today };
    }
    case '3months': {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      return { dateFrom: format(threeMonthsAgo, 'yyyy-MM-dd'), dateTo: today };
    }
    default:
      return {};
  }
}

export default function Home() {
  const navigate = useNavigate();
  const loadInterviews = useInterviewStore((s) => s.loadInterviews);
  const getFilteredInterviews = useInterviewStore((s) => s.getFilteredInterviews);
  const setSearchQuery = useInterviewStore((s) => s.setSearchQuery);
  const setFilters = useInterviewStore((s) => s.setFilters);
  const interviews = useInterviewStore((s) => s.interviews);
  const { profile, loadProfile } = useProfileStore();
  const { reports, loadReports } = useSimulationStore();

  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => {
    loadInterviews();
    loadProfile();
    loadReports();
  }, [loadInterviews, loadProfile, loadReports]);
  const [uiFilters, setUiFilters] = useState<UIFilters>({
    result: 'all',
    time: 'all',
  });
  const [localSearch, setLocalSearch] = useState('');

  useEffect(() => {
    loadInterviews();
    loadProfile();
  }, [loadInterviews, loadProfile]);

  useEffect(() => {
    setSearchQuery(localSearch);
  }, [localSearch, setSearchQuery]);

  useEffect(() => {
    const { result, time } = uiFilters;
    const timeRange = getTimeRange(time);
    setFilters({
      result: result === 'all' ? undefined : (result as InterviewResult),
      ...timeRange,
    });
  }, [uiFilters, setFilters]);

  const filteredInterviews = useMemo(() => {
    return getFilteredInterviews().sort(
      (a, b) => new Date(b.interviewDate).getTime() - new Date(a.interviewDate).getTime()
    );
  }, [getFilteredInterviews]);

  const stats = useMemo(() => calculateStats(interviews), [interviews]);

  const handleFilterChange = (filters: UIFilters) => {
    setUiFilters(filters);
  };

  const handleSearchChange = (query: string) => {
    setLocalSearch(query);
  };

  const handleCardClick = (id: string) => {
    navigate(`/interview/${id}`);
  };

  const handleNewInterview = () => {
    navigate('/interview/new');
  };

  const greeting = getGreeting();
  const today = format(new Date(), 'M月d日 EEEE', { locale: zhCN });
  const targetPosition = profile?.targetPosition || '求职者';

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="面试记录"
        rightAction={
          <button
            type="button"
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              'text-neutral-600 transition-all duration-200',
              'hover:bg-neutral-100 active:scale-95',
              showFilter && 'bg-primary-50 text-primary-600'
            )}
          >
            <Search className="h-5 w-5" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-5">
        <div className="animate-fade-in animate-slide-up animate-stagger-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-xl font-bold text-neutral-800">
              {greeting}，{targetPosition}
            </h2>
            <Sparkles className="w-5 h-5 text-accent-500" />
          </div>
          <p className="text-sm text-neutral-500">{today}</p>
        </div>

        <div className="animate-fade-in animate-slide-up animate-stagger-2">
          <StatsOverview stats={stats} />
        </div>

        <div
          className="animate-fade-in animate-slide-up animate-stagger-3 cursor-pointer"
          onClick={() => navigate('/simulation/setup')}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-500 via-primary-600 to-blue-600 p-5 text-white shadow-glow">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/5 rounded-full translate-y-6 -translate-x-6" />
            <div className="relative flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Rocket className="w-5 h-5" />
                  <h3 className="text-lg font-bold">面试模拟舱</h3>
                </div>
                <p className="text-sm text-white/80 mb-3">
                  {reports.length > 0
                    ? `上次得分 ${reports[0].totalScore}分，继续加油！`
                    : '事前演练，告别面试现场才是第一次开口'}
                </p>
                <span className="inline-flex items-center gap-1 text-xs font-medium bg-white/20 rounded-full px-3 py-1">
                  开始模拟 →
                </span>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Rocket className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {showFilter && (
          <div className="card p-4 animate-fade-in animate-slide-down">
            <InterviewFilter
              filters={uiFilters}
              onFilterChange={handleFilterChange}
              searchQuery={localSearch}
              onSearchChange={handleSearchChange}
            />
          </div>
        )}

        {filteredInterviews.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between animate-fade-in">
              <h3 className="section-title mb-0">
                <FileText className="w-5 h-5 text-primary-500" />
                面试列表
              </h3>
              <span className="text-sm text-neutral-400">
                共 {filteredInterviews.length} 条
              </span>
            </div>
            <div className="space-y-3">
              {filteredInterviews.map((interview, index) => (
                <div
                  key={interview.id}
                  className="animate-fade-in animate-slide-up"
                  style={{ animationDelay: `${Math.min(index, 5) * 50 + 100}ms` }}
                >
                  <InterviewCard
                    interview={interview}
                    onClick={handleCardClick}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 animate-fade-in animate-slide-up">
            <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
              <FileText className="w-12 h-12 text-primary-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              还没有面试记录
            </h3>
            <p className="text-sm text-neutral-500 mb-6 text-center px-8">
              每次面试后记录复盘，帮助你快速成长
            </p>
            <Button onClick={handleNewInterview} size="md">
              <Plus className="w-4 h-4 mr-1.5" />
              新增面试记录
            </Button>
          </div>
        )}
      </div>

      <FloatingButton onClick={handleNewInterview} />
    </div>
  );
}
