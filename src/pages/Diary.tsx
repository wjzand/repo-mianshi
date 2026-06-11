import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  MessageCircle,
  Smile,
  Meh,
  Frown,
  ChevronRight,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import MoodSelector from '@/components/interview/MoodSelector';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Chip } from '@/components/ui/Chip';
import { Modal } from '@/components/ui/Modal';
import { TextArea, Label } from '@/components/ui/Input';
import { useInterviewStore } from '@/store/interviewStore';
import { formatDateTime } from '@/utils/date';
import { getDiaryEntries, createDiaryEntry } from '@/services/diaryService';
import type { Interview, InterviewResult, MoodType } from '@/types/interview';
import type { DiaryEntry } from '@/types/diary';

type FilterType = 'all' | 'pass' | 'fail' | 'pending' | 'note';

interface TimelineInterviewNode {
  id: string;
  nodeType: 'interview';
  interview: Interview;
  date: string;
}

interface TimelineNoteNode {
  id: string;
  nodeType: 'note';
  diary: DiaryEntry;
  date: string;
}

type TimelineNode = TimelineInterviewNode | TimelineNoteNode;

const moodEmoji: Record<MoodType, string> = {
  good: '😊',
  neutral: '😐',
  bad: '😟',
};

const resultLabel: Record<InterviewResult, string> = {
  pass: '通过',
  pending: '待定',
  fail: '未通过',
};

const resultVariant: Record<InterviewResult, 'success' | 'pending' | 'fail'> = {
  pass: 'success',
  pending: 'pending',
  fail: 'fail',
};

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pass', label: '通过' },
  { value: 'fail', label: '未通过' },
  { value: 'pending', label: '待定' },
  { value: 'note', label: '仅日记' },
];

export default function Diary() {
  const navigate = useNavigate();
  const loadInterviews = useInterviewStore((s) => s.loadInterviews);
  const interviews = useInterviewStore((s) => s.interviews);

  const [filter, setFilter] = useState<FilterType>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [newMood, setNewMood] = useState<MoodType>('neutral');
  const [newContent, setNewContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadInterviews();
    loadDiaryEntries();
  }, [loadInterviews]);

  const loadDiaryEntries = async () => {
    try {
      const entries = await getDiaryEntries();
      setDiaryEntries(entries);
    } catch (error) {
      console.error('Failed to load diary entries:', error);
    }
  };

  const timelineNodes = useMemo<TimelineNode[]>(() => {
    const interviewNodes: TimelineInterviewNode[] = interviews.map((iv) => ({
      id: `iv-${iv.id}`,
      nodeType: 'interview',
      interview: iv,
      date: iv.interviewDate,
    }));

    const noteNodes: TimelineNoteNode[] = diaryEntries
      .filter((d) => d.type === 'note')
      .map((d) => ({
        id: `note-${d.id}`,
        nodeType: 'note',
        diary: d,
        date: d.date,
      }));

    return [...interviewNodes, ...noteNodes].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [interviews, diaryEntries]);

  const filteredNodes = useMemo(() => {
    if (filter === 'all') return timelineNodes;
    if (filter === 'note') {
      return timelineNodes.filter((n) => n.nodeType === 'note');
    }
    return timelineNodes.filter(
      (n) => n.nodeType === 'interview' && n.interview.result === filter
    );
  }, [timelineNodes, filter]);

  const handleSaveDiary = async () => {
    if (!newContent.trim()) return;

    setSaving(true);
    try {
      await createDiaryEntry({
        type: 'note',
        content: newContent.trim(),
        mood: newMood,
        date: new Date().toISOString(),
      });
      setNewContent('');
      setNewMood('neutral');
      setModalOpen(false);
      await loadDiaryEntries();
    } catch (error) {
      console.error('Failed to save diary:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleInterviewClick = (id: string) => {
    navigate(`/interview/${id}`);
  };

  const getInterviewSummary = (interview: Interview): string => {
    if (interview.strengths.length > 0) {
      return interview.strengths[0].content;
    }
    if (interview.notes.trim()) {
      return interview.notes.length > 60
        ? interview.notes.slice(0, 60) + '...'
        : interview.notes;
    }
    return '点击查看详情';
  };

  const renderMoodIcon = (mood?: MoodType) => {
    if (!mood) return null;
    const Icon = mood === 'good' ? Smile : mood === 'neutral' ? Meh : Frown;
    const colorClass =
      mood === 'good'
        ? 'text-success-500'
        : mood === 'neutral'
        ? 'text-accent-500'
        : 'text-red-500';
    return <Icon className={cn('w-5 h-5', colorClass)} />;
  };

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader
        title="成长日记"
        rightAction={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full',
              'text-neutral-600 transition-all duration-200',
              'hover:bg-neutral-100 active:scale-95',
              'bg-primary-50 text-primary-600 hover:bg-primary-100'
            )}
          >
            <Plus className="h-5 w-5" strokeWidth={2.5} />
          </button>
        }
      />

      <div className="px-4 py-3">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {filterOptions.map((opt) => (
            <Chip
              key={opt.value}
              active={filter === opt.value}
              onClick={() => setFilter(opt.value)}
              className="flex-shrink-0"
            >
              {opt.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex-1 px-4 pb-6">
        {filteredNodes.length > 0 ? (
          <div className="relative pl-6">
            <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-neutral-200" />

            <div className="space-y-4">
              {filteredNodes.map((node, index) => {
                const isLeft = index % 2 === 0;

                if (node.nodeType === 'interview') {
                  const { interview } = node;
                  return (
                    <div key={node.id} className="relative">
                      <div
                        className={cn(
                          'absolute w-4 h-4 rounded-full border-2 border-white bg-primary-500 shadow-md',
                          'left-0 top-4 -translate-x-1/2'
                        )}
                      />
                      <Card
                        className={cn(
                          'cursor-pointer transition-all duration-200',
                          'hover:shadow-card-md active:scale-[0.98]'
                        )}
                        onClick={() => handleInterviewClick(interview.id)}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-neutral-800 truncate">
                                  {interview.company}
                                </h3>
                                <span className="text-neutral-400">·</span>
                                <span className="text-sm text-neutral-500 truncate">
                                  {interview.position}
                                </span>
                              </div>
                            </div>
                            <Tag variant={resultVariant[interview.result]}>
                              {resultLabel[interview.result]}
                            </Tag>
                          </div>

                          <div className="flex items-center gap-1.5 text-sm text-neutral-400 mb-3">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{formatDateTime(interview.interviewDate)}</span>
                          </div>

                          <p className="text-sm text-neutral-600 line-clamp-2 mb-3">
                            {getInterviewSummary(interview)}
                          </p>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {renderMoodIcon(interview.mood)}
                              <span className="text-lg ml-1">
                                {moodEmoji[interview.mood]}
                              </span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-neutral-300" />
                          </div>
                        </div>
                      </Card>
                    </div>
                  );
                }

                const { diary } = node;
                return (
                  <div key={node.id} className="relative">
                    <div
                      className={cn(
                        'absolute w-4 h-4 rounded-full border-2 border-white bg-accent-400 shadow-md',
                        'left-0 top-4 -translate-x-1/2'
                      )}
                    />
                    <Card>
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Tag variant="accent">
                            <MessageCircle className="w-3.5 h-3.5 mr-1" />
                            心情日记
                          </Tag>
                          {diary.mood && (
                            <div className="flex items-center gap-1">
                              {renderMoodIcon(diary.mood)}
                              <span className="text-lg">
                                {moodEmoji[diary.mood]}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-sm text-neutral-400 mb-3">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatDateTime(diary.date)}</span>
                        </div>

                        <p className="text-sm text-neutral-600 whitespace-pre-wrap">
                          {diary.content}
                        </p>
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 rounded-full bg-primary-50 flex items-center justify-center mb-6">
              <MessageCircle className="w-12 h-12 text-primary-300" />
            </div>
            <h3 className="text-lg font-semibold text-neutral-700 mb-2">
              还没有日记记录
            </h3>
            <p className="text-sm text-neutral-500 mb-6 text-center px-8">
              记录面试复盘和日常心情，见证你的成长轨迹
            </p>
            <Button onClick={() => setModalOpen(true)} size="md">
              <Plus className="w-4 h-4 mr-1.5" />
              添加心情日记
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => !saving && setModalOpen(false)}
        title="添加心情日记"
        footer={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              onClick={handleSaveDiary}
              loading={saving}
              disabled={!newContent.trim()}
              className="flex-1"
            >
              保存
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <Label className="mb-3 block">今日心情</Label>
            <MoodSelector value={newMood} onChange={setNewMood} />
          </div>

          <div>
            <Label className="mb-2 block">
              日记内容 <span className="text-red-500">*</span>
            </Label>
            <TextArea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="记录今天的感受和收获..."
              rows={6}
              className="w-full"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
