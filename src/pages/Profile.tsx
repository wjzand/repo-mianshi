import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Target,
  Calendar,
  Download,
  Trash2,
  Info,
  MessageSquare,
  Mic,
  Bell,
  ChevronRight,
  BookOpen,
  Clock,
  CheckCircle,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Label } from '@/components/ui/Input';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { useProfileStore } from '@/store/profileStore';
import { useInterviewStore } from '@/store/interviewStore';
import { useQuestionStore } from '@/store/questionStore';
import { calculateStats } from '@/utils/analysis';
import type { JobStatus } from '@/types/profile';

const JOB_STATUS_MAP: Record<JobStatus, { label: string; color: string }> = {
  actively_looking: { label: '积极寻找', color: 'bg-primary-50 text-primary-600' },
  watching: { label: '观望中', color: 'bg-accent-50 text-accent-600' },
  hired: { label: '已入职', color: 'bg-success-50 text-success-600' },
};

const JOB_STATUS_OPTIONS: JobStatus[] = ['actively_looking', 'watching', 'hired'];

const STREAK_KEY = 'interview-streak-dates';

function getStreakDays(interviewDates: string[]): number {
  if (interviewDates.length === 0) return 0;

  const dateSet = new Set(
    interviewDates.map((d) => new Date(d).toISOString().split('T')[0])
  );

  let streak = 0;
  const today = new Date();
  const checkDate = new Date(today);

  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (streak === 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        const prevDateStr = checkDate.toISOString().split('T')[0];
        if (dateSet.has(prevDateStr)) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
      }
      break;
    }
  }

  return streak;
}

export default function Profile() {
  const navigate = useNavigate();
  const { profile, updateProfile, saveProfile, loadProfile } = useProfileStore();
  const { interviews, setInterviews, loadInterviews } = useInterviewStore();
  const { questions, setQuestions, loadQuestions } = useQuestionStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editTargetPosition, setEditTargetPosition] = useState('');
  const [editTargetIndustry, setEditTargetIndustry] = useState('');
  const [editJobStatus, setEditJobStatus] = useState<JobStatus>('actively_looking');

  const [showClearModal, setShowClearModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  useEffect(() => {
    loadProfile();
    loadInterviews();
    loadQuestions();
  }, [loadProfile, loadInterviews, loadQuestions]);

  useEffect(() => {
    setEditTargetPosition(profile.targetPosition);
    setEditTargetIndustry(profile.targetIndustry);
    setEditJobStatus(profile.jobStatus);
  }, [profile]);

  const stats = useMemo(() => calculateStats(interviews), [interviews]);

  const streakDays = useMemo(() => {
    const dates = interviews.map((i) => i.interviewDate);
    return getStreakDays(dates);
  }, [interviews]);

  const totalDuration = useMemo(() => {
    return interviews.reduce((sum, i) => sum + (i.duration || 0), 0);
  }, [interviews]);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
  };

  const handleStartEdit = () => {
    setEditTargetPosition(profile.targetPosition);
    setEditTargetIndustry(profile.targetIndustry);
    setEditJobStatus(profile.jobStatus);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    updateProfile({
      targetPosition: editTargetPosition,
      targetIndustry: editTargetIndustry,
      jobStatus: editJobStatus,
    });
    await saveProfile();
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleExportData = () => {
    const data = {
      profile,
      interviews,
      questions,
      exportAt: new Date().toISOString(),
      version: '1.0.0',
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearData = async () => {
    setInterviews([]);
    setQuestions([]);
    setShowClearModal(false);

    try {
      const { deleteInterview } = useInterviewStore.getState();
      const { removeQuestion } = useQuestionStore.getState();
      for (const iv of interviews) {
        await deleteInterview(iv.id);
      }
      for (const q of questions) {
        await removeQuestion(q.id);
      }
    } catch {
      // ignore
    }
  };

  const handleVoiceToggle = async (checked: boolean) => {
    updateProfile({ voiceEnabled: checked });
    await saveProfile();
  };

  const handleNotificationToggle = async (checked: boolean) => {
    updateProfile({ notificationEnabled: checked });
    await saveProfile();
  };

  const statItems = [
    {
      label: '总面试数',
      value: stats.total,
      icon: FileText,
      bgColor: 'bg-primary-50',
      iconColor: 'text-primary-500',
      valueColor: 'text-primary-600',
    },
    {
      label: '通过率',
      value: `${stats.passRate}%`,
      icon: CheckCircle,
      bgColor: 'bg-success-50',
      iconColor: 'text-success-500',
      valueColor: 'text-success-600',
    },
    {
      label: '连续复盘天数',
      value: `${streakDays}天`,
      icon: Calendar,
      bgColor: 'bg-accent-50',
      iconColor: 'text-accent-500',
      valueColor: 'text-accent-600',
    },
    {
      label: '累计时长',
      value: formatDuration(totalDuration),
      icon: Clock,
      bgColor: 'bg-amber-50',
      iconColor: 'text-amber-500',
      valueColor: 'text-amber-600',
    },
  ];

  const featureItems = [
    {
      label: '成长日记',
      icon: BookOpen,
      onClick: () => navigate('/diary'),
    },
    {
      label: '数据导出',
      icon: Download,
      onClick: handleExportData,
      hint: 'JSON格式',
    },
    {
      label: '清空数据',
      icon: Trash2,
      onClick: () => setShowClearModal(true),
      danger: true,
    },
    {
      label: '关于我们',
      icon: Info,
      onClick: () => setShowAboutModal(true),
    },
    {
      label: '意见反馈',
      icon: MessageSquare,
      onClick: () => {
        window.location.href = 'mailto:feedback@example.com';
      },
      hint: 'feedback@example.com',
    },
  ];

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="我的" />

      <div className="flex-1 px-4 py-4 space-y-4 pb-24">
        <Card className="overflow-hidden animate-fade-in animate-slide-up">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-glow">
                <User className="w-8 h-8 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={cn(
                      'inline-flex items-center px-3 py-1 rounded-full text-xs font-medium',
                      JOB_STATUS_MAP[profile.jobStatus].color
                    )}
                  >
                    {JOB_STATUS_MAP[profile.jobStatus].label}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Target className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">
                      {profile.targetPosition || '未设置'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-neutral-400" />
                    <span className="text-neutral-700">
                      {profile.targetIndustry || '未设置'}
                    </span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleStartEdit}>
                编辑
              </Button>
            </div>

            {isEditing && (
              <div className="mt-5 pt-5 border-t border-neutral-100 space-y-4 animate-fade-in animate-slide-down">
                <div>
                  <Label>求职状态</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {JOB_STATUS_OPTIONS.map((status) => (
                      <Chip
                        key={status}
                        active={editJobStatus === status}
                        onClick={() => setEditJobStatus(status)}
                      >
                        {JOB_STATUS_MAP[status].label}
                      </Chip>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>目标岗位</Label>
                  <Input
                    className="mt-2"
                    placeholder="例如：前端工程师"
                    value={editTargetPosition}
                    onChange={(e) => setEditTargetPosition(e.target.value)}
                  />
                </div>
                <div>
                  <Label>目标行业</Label>
                  <Input
                    className="mt-2"
                    placeholder="例如：互联网"
                    value={editTargetIndustry}
                    onChange={(e) => setEditTargetIndustry(e.target.value)}
                  />
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleCancelEdit} className="flex-1">
                    取消
                  </Button>
                  <Button onClick={handleSaveEdit} className="flex-1">
                    保存
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-1">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-neutral-700 mb-4">数据统计</h3>
            <div className="grid grid-cols-2 gap-3">
              {statItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="p-3 rounded-xl bg-neutral-50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', item.bgColor)}>
                        <Icon className={cn('w-4 h-4', item.iconColor)} />
                      </div>
                    </div>
                    <div className={cn('text-lg font-bold', item.valueColor)}>
                      {item.value}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{item.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-2">
          <CardContent className="p-0">
            <h3 className="text-base font-semibold text-neutral-700 px-5 pt-5 pb-2">功能</h3>
            <div>
              {featureItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className={cn(
                      'w-full flex items-center justify-between px-5 py-4 transition-colors',
                      'hover:bg-neutral-50 active:bg-neutral-100',
                      index !== featureItems.length - 1 && 'border-b border-neutral-50',
                      item.danger && 'text-red-500'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center',
                        item.danger ? 'bg-red-50' : 'bg-primary-50'
                      )}>
                        <Icon className={cn(
                          'w-5 h-5',
                          item.danger ? 'text-red-500' : 'text-primary-500'
                        )} />
                      </div>
                      <div className="text-left">
                        <span className={cn(
                          'text-sm font-medium',
                          item.danger ? 'text-red-500' : 'text-neutral-700'
                        )}>
                          {item.label}
                        </span>
                        {item.hint && (
                          <p className="text-xs text-neutral-400 mt-0.5">{item.hint}</p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      'w-5 h-5',
                      item.danger ? 'text-red-300' : 'text-neutral-300'
                    )} />
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-slide-up animate-stagger-3">
          <CardContent className="p-5">
            <h3 className="text-base font-semibold text-neutral-700 mb-4">设置</h3>
            <div className="space-y-4">
              <div>
                <Switch
                  checked={profile.voiceEnabled}
                  onChange={handleVoiceToggle}
                  label={
                    <div className="flex items-center gap-2">
                      <Mic className="w-4 h-4 text-primary-500" />
                      <span>语音转文字</span>
                    </div>
                  }
                />
              </div>
              <div>
                <Switch
                  checked={profile.notificationEnabled}
                  onChange={handleNotificationToggle}
                  label={
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-primary-500" />
                      <span>面试提醒</span>
                    </div>
                  }
                />
                <p className="text-xs text-neutral-400 mt-2 ml-6">
                  开启后7天无面试记录会提示
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center py-6 space-y-1">
          <p className="text-xs text-neutral-400">v1.0.0</p>
          <p className="text-sm text-gradient-primary font-medium">
            持续复盘，持续成长
          </p>
        </div>
      </div>

      <Modal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        title="清空数据"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowClearModal(false)} className="flex-1">
              取消
            </Button>
            <Button onClick={handleClearData} className="flex-1" style={{ background: 'linear-gradient(135deg, #F53F3F 0%, #FF7875 100%)' }}>
              确认清空
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-neutral-600 leading-relaxed">
            确定要清空所有面试记录和题库数据吗？
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            此操作不可恢复，请谨慎操作。
          </p>
        </div>
      </Modal>

      <Modal
        open={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        title="关于我们"
      >
        <div className="py-4 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-glow">
            <User className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-lg font-bold text-neutral-700 mb-1">面试复盘助手</h3>
          <p className="text-sm text-neutral-400 mb-4">v1.0.0</p>
          <p className="text-sm text-neutral-600 leading-relaxed">
            一款专业的面试复盘工具，帮助你记录每次面试，分析优劣势，持续成长。
          </p>
          <p className="text-sm text-gradient-primary font-medium mt-4">
            持续复盘，持续成长
          </p>
        </div>
      </Modal>
    </div>
  );
}
