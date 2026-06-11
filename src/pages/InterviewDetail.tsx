import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Share2, CheckCircle2, AlertCircle, Lightbulb, ArrowLeft, Loader2, Rocket } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tag } from '@/components/ui/Tag';
import { Rating } from '@/components/ui/Rating';
import { Modal } from '@/components/ui/Modal';
import RadarChart from '@/components/charts/RadarChart';
import QuestionItem from '@/components/interview/QuestionItem';
import { useInterviewStore } from '@/store/interviewStore';
import { calculateAbilityScores, generateAnalysisText, generateSuggestions } from '@/utils/analysis';
import { formatDateTime } from '@/utils/date';
import type { Interview, InterviewMethod, InterviewResult, MoodType } from '@/types/interview';

const interviewMethodMap: Record<InterviewMethod, string> = {
  onsite: '现场',
  phone: '电话',
  video: '视频',
};

const interviewResultMap: Record<InterviewResult, string> = {
  pass: '已通过',
  pending: '待定',
  fail: '未通过',
};

const resultTagVariantMap: Record<InterviewResult, 'success' | 'pending' | 'fail'> = {
  pass: 'success',
  pending: 'pending',
  fail: 'fail',
};

const moodEmojiMap: Record<MoodType, string> = {
  good: '😊',
  neutral: '😐',
  bad: '😟',
};

export default function InterviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { interviews, loading, loadInterviews, deleteInterview } = useInterviewStore();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (interviews.length === 0) {
      loadInterviews();
    }
  }, [interviews.length, loadInterviews]);

  const interview = useMemo(() => {
    if (!id) return null;
    return interviews.find((iv) => iv.id === id) || null;
  }, [id, interviews]);

  const abilityScores = useMemo(() => {
    if (!interview) return null;
    return calculateAbilityScores(interview);
  }, [interview]);

  const analysisText = useMemo(() => {
    if (!interview) return '';
    return generateAnalysisText(interview);
  }, [interview]);

  const suggestions = useMemo(() => {
    if (!interview) return [];
    return generateSuggestions(interview);
  }, [interview]);

  const analysisParagraphs = useMemo(() => {
    return analysisText.split('\n').filter((p) => p.trim());
  }, [analysisText]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (id) {
      navigate(`/interview/edit/${id}`);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteInterview(id);
      setDeleteModalOpen(false);
      navigate('/');
    } catch (err) {
      console.error('删除失败:', err);
    } finally {
      setDeleting(false);
    }
  };

  const generateShareText = (iv: Interview): string => {
    const lines: string[] = [];
    lines.push(`【面试复盘】${iv.company} - ${iv.position}`);
    lines.push('');
    lines.push(`面试轮次：${iv.round}`);
    lines.push(`面试时间：${formatDateTime(iv.interviewDate)}`);
    lines.push(`面试方式：${interviewMethodMap[iv.interviewMethod]}`);
    lines.push(`面试结果：${interviewResultMap[iv.result]}`);
    lines.push(`综合评分：${iv.overallRating} / 5`);
    lines.push('');
    lines.push('--- 复盘分析 ---');
    lines.push(analysisText);
    return lines.join('\n');
  };

  const handleShare = async () => {
    if (!interview) return;
    const shareText = generateShareText(interview);

    if (navigator.share) {
      try {
        await navigator.share({
          title: '面试复盘',
          text: shareText,
        });
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('分享失败:', err);
        }
      }
    } else if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(shareText);
        alert('复盘内容已复制到剪贴板');
      } catch (err) {
        console.error('复制失败:', err);
        alert('复制失败，请手动复制');
      }
    } else {
      alert('当前浏览器不支持分享功能');
    }
  };

  if (loading && interviews.length === 0) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <PageHeader title="复盘报告" showBack onBack={handleBack} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary-500 animate-spin" />
            <p className="text-sm text-neutral-500">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!interview) {
    return (
      <div className="flex flex-col min-h-screen bg-neutral-50">
        <PageHeader title="复盘报告" showBack onBack={handleBack} />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-neutral-400" />
            </div>
            <h2 className="text-lg font-semibold text-neutral-700 mb-2">未找到面试记录</h2>
            <p className="text-sm text-neutral-500 mb-6">该面试记录可能已被删除或不存在</p>
            <Button variant="secondary" onClick={handleBack} className="inline-flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span>返回</span>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50">
      <PageHeader
        title="复盘报告"
        showBack
        onBack={handleBack}
        rightAction={
          <button
            type="button"
            onClick={handleEdit}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-600 transition-all duration-200 hover:bg-neutral-100 active:scale-95"
          >
            <Pencil className="h-5 w-5" strokeWidth={2} />
          </button>
        }
      />

      <main className="flex-1 px-4 py-4 pb-24 space-y-4">
        <Card>
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold text-neutral-800 mb-3">
              {interview.company} · {interview.position}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-500 mb-4">
              <span>{interview.round}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span>{formatDateTime(interview.interviewDate)}</span>
              <span className="w-1 h-1 rounded-full bg-neutral-300" />
              <span>{interviewMethodMap[interview.interviewMethod]}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Tag variant={resultTagVariantMap[interview.result]}>
                {interviewResultMap[interview.result]}
              </Tag>
              <Rating value={interview.overallRating} readOnly size="sm" />
              <span className="text-2xl">{moodEmojiMap[interview.mood]}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>能力评估</CardTitle>
            <CardDescription>六维能力模型，数值越高代表该维度表现越好</CardDescription>
          </CardHeader>
          <CardContent>
            {abilityScores && <RadarChart data={abilityScores} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>复盘分析</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              {analysisParagraphs.map((paragraph, idx) => (
                <p key={idx} className="text-sm text-neutral-600 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            {interview.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">优势</h4>
                <div className="flex flex-wrap gap-2">
                  {interview.strengths.map((tag) => (
                    <Tag key={tag.id} variant="success" className="inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tag.content}</span>
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {interview.weaknesses.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">不足</h4>
                <div className="flex flex-wrap gap-2">
                  {interview.weaknesses.map((tag) => (
                    <Tag key={tag.id} variant="pending" className="inline-flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{tag.content}</span>
                    </Tag>
                  ))}
                </div>
              </div>
            )}

            {suggestions.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-neutral-700 mb-2">改进建议</h4>
                <ul className="space-y-2">
                  {suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-neutral-600">
                      <Lightbulb className="w-4 h-4 text-accent-500 flex-shrink-0 mt-0.5" />
                      <span>{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>面试问题回顾</CardTitle>
            <CardDescription>共 {interview.questions.length} 个问题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {interview.questions.map((question) => (
              <QuestionItem key={question.id} question={question} editable={false} />
            ))}
          </CardContent>
        </Card>

        {interview.notes && (
          <Card>
            <CardHeader>
              <CardTitle>心情日记</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-3">
                <span className="text-2xl flex-shrink-0">{moodEmojiMap[interview.mood]}</span>
                <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                  {interview.notes}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {interview.improvements && (
          <Card>
            <CardHeader>
              <CardTitle>待改进项</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 leading-relaxed whitespace-pre-wrap">
                {interview.improvements}
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-neutral-200 safe-bottom">
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={() => navigate('/simulation/setup')}
            className="flex-1 inline-flex items-center justify-center gap-2"
          >
            <Rocket className="w-4 h-4" />
            <span>模拟训练</span>
          </Button>
          <Button
            variant="secondary"
            onClick={handleEdit}
            className="flex-1 inline-flex items-center justify-center gap-2"
          >
            <Pencil className="w-4 h-4" />
            <span>编辑</span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => setDeleteModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 text-red-600 hover:text-red-700"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={handleShare}
            className="inline-flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <Modal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="确认删除"
        footer={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setDeleteModalOpen(false)}
              disabled={deleting}
              className="flex-1"
            >
              取消
            </Button>
            <Button
              variant="primary"
              onClick={handleDelete}
              loading={deleting}
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              确认删除
            </Button>
          </div>
        }
      >
        <p className="text-sm text-neutral-600">
          确定要删除这条面试记录吗？此操作不可撤销。
        </p>
      </Modal>
    </div>
  );
}
