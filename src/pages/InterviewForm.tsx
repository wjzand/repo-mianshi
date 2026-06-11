import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, Plus, Trash2, Save, X } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, TextArea, Label } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Rating } from '@/components/ui/Rating';
import TagSelector from '@/components/interview/TagSelector';
import MoodSelector from '@/components/interview/MoodSelector';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useInterviewStore } from '@/store/interviewStore';
import { STRENGTH_TAGS, WEAKNESS_TAGS } from '@/data/tags';
import type { Interview, InterviewQuestion, AnalysisTag, InterviewResult, InterviewMethod, InterviewerRole, MoodType } from '@/types/interview';

const ROUND_OPTIONS = ['一面', '二面', '三面', '终面'];
const METHOD_OPTIONS: { label: string; value: InterviewMethod }[] = [
  { label: '现场', value: 'onsite' },
  { label: '电话', value: 'phone' },
  { label: '视频', value: 'video' },
];
const ROLE_OPTIONS: { label: string; value: InterviewerRole }[] = [
  { label: 'HR', value: 'hr' },
  { label: '技术', value: 'tech' },
  { label: '部门负责人', value: 'manager' },
];
const RESULT_OPTIONS: { label: string; value: InterviewResult; color: string }[] = [
  { label: '通过', value: 'pass', color: 'bg-success-50 border-success-400 text-success-700' },
  { label: '待定', value: 'pending', color: 'bg-accent-50 border-accent-400 text-accent-700' },
  { label: '未通过', value: 'fail', color: 'bg-red-50 border-red-400 text-red-700' },
];

interface FormData {
  company: string;
  position: string;
  round: string;
  customRound: string;
  date: string;
  time: string;
  interviewMethod: InterviewMethod;
  interviewerRoles: InterviewerRole[];
  result: InterviewResult;
  duration: number;
  overallRating: number;
  mood: MoodType;
  notes: string;
  questions: InterviewQuestion[];
  strengths: string[];
  weaknesses: string[];
  improvements: string;
}

const defaultForm: FormData = {
  company: '',
  position: '',
  round: '一面',
  customRound: '',
  date: new Date().toISOString().split('T')[0],
  time: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
  interviewMethod: 'onsite' as InterviewMethod,
  interviewerRoles: [] as InterviewerRole[],
  result: 'pending' as InterviewResult,
  duration: 0,
  overallRating: 3,
  mood: 'neutral' as MoodType,
  notes: '',
  questions: [{ id: Date.now().toString(), question: '', answer: '', rating: 3, feedback: '', category: '' }],
  strengths: [] as string[],
  weaknesses: [] as string[],
  improvements: '',
};

function tagsToStrings(tags: AnalysisTag[]): string[] {
  return tags.map((t) => t.content);
}

function stringsToTags(strings: string[], type: 'strength' | 'weakness'): AnalysisTag[] {
  return strings.map((content) => ({
    id: `${type}-${content}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    content,
  }));
}

interface SpeechInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  rows?: number;
}

function SpeechTextArea({ value, onChange, placeholder, label, rows = 4 }: SpeechInputProps) {
  const { isSupported, isListening, transcript, startListening, stopListening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) {
      onChange(value + transcript);
      resetTranscript();
    }
  }, [transcript]);

  const toggleListen = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="space-y-1.5">
      {label && <Label>{label}</Label>}
      <div className="relative">
        <TextArea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={isSupported ? 'pr-12' : ''}
        />
        {isSupported && (
          <button
            type="button"
            onClick={toggleListen}
            className={`absolute right-3 top-3 p-2 rounded-full transition-all duration-300 ${
              isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-200'
                : 'text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <Mic className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function InterviewForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = !!id;
  const { interviews, saveInterview } = useInterviewStore();

  const [form, setForm] = useState<FormData>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [showCustomRound, setShowCustomRound] = useState(false);

  useEffect(() => {
    if (isEditMode && id) {
      const interview = interviews.find((iv) => iv.id === id);
      if (interview) {
        const dateObj = new Date(interview.interviewDate);
        const dateStr = dateObj.toISOString().split('T')[0];
        const timeStr = `${String(dateObj.getHours()).padStart(2, '0')}:${String(dateObj.getMinutes()).padStart(2, '0')}`;

        const isCustomRound = !ROUND_OPTIONS.includes(interview.round);

        setForm({
          company: interview.company,
          position: interview.position,
          round: isCustomRound ? '' : interview.round,
          customRound: isCustomRound ? interview.round : '',
          date: dateStr,
          time: timeStr,
          interviewMethod: interview.interviewMethod,
          interviewerRoles: interview.interviewerRoles,
          result: interview.result,
          duration: interview.duration,
          overallRating: interview.overallRating,
          mood: interview.mood,
          notes: interview.notes,
          questions: interview.questions.length > 0 ? interview.questions : defaultForm.questions,
          strengths: tagsToStrings(interview.strengths),
          weaknesses: tagsToStrings(interview.weaknesses),
          improvements: interview.improvements,
        });
        setShowCustomRound(isCustomRound);
      }
    }
  }, [isEditMode, id, interviews]);

  const updateForm = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleRole = (role: InterviewerRole) => {
    setForm((prev) => ({
      ...prev,
      interviewerRoles: prev.interviewerRoles.includes(role)
        ? prev.interviewerRoles.filter((r) => r !== role)
        : [...prev.interviewerRoles, role],
    }));
  };

  const toggleStrength = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      strengths: prev.strengths.includes(tag)
        ? prev.strengths.filter((t) => t !== tag)
        : [...prev.strengths, tag],
    }));
  };

  const toggleWeakness = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      weaknesses: prev.weaknesses.includes(tag)
        ? prev.weaknesses.filter((t) => t !== tag)
        : [...prev.weaknesses, tag],
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        { id: Date.now().toString(), question: '', answer: '', rating: 3, feedback: '', category: '' },
      ],
    }));
  };

  const removeQuestion = (questionId: string) => {
    if (form.questions.length <= 1) return;
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const updateQuestion = (questionId: string, field: keyof InterviewQuestion, value: string | number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? { ...q, [field]: value } : q
      ),
    }));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSave = async () => {
    if (!form.company.trim()) {
      alert('请输入公司名称');
      return;
    }
    if (!form.position.trim()) {
      alert('请输入岗位名称');
      return;
    }

    setLoading(true);

    try {
      const roundValue = form.round || form.customRound;
      const dateStr = form.date;
      const timeStr = form.time || `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
      const interviewDate = new Date(`${dateStr}T${timeStr}`).toISOString();

      const payload: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'> & { id?: string } = {
        ...(isEditMode && id ? { id } : {}),
        company: form.company,
        position: form.position,
        round: roundValue,
        interviewDate,
        interviewMethod: form.interviewMethod,
        interviewerRoles: form.interviewerRoles,
        result: form.result,
        duration: form.duration,
        overallRating: form.overallRating,
        mood: form.mood,
        notes: form.notes,
        questions: form.questions,
        strengths: stringsToTags(form.strengths, 'strength'),
        weaknesses: stringsToTags(form.weaknesses, 'weakness'),
        improvements: form.improvements,
      };

      await saveInterview(payload);
      navigate(-1);
    } catch (err) {
      console.error('保存失败:', err);
      alert('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-28">
      <PageHeader
        title={isEditMode ? '编辑面试' : '新增面试'}
        showBack
        onBack={() => navigate(-1)}
      />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>公司名称 <span className="text-red-500">*</span></Label>
              <Input
                value={form.company}
                onChange={(e) => updateForm('company', e.target.value)}
                placeholder="请输入公司名称"
              />
            </div>

            <div className="space-y-1.5">
              <Label>岗位名称 <span className="text-red-500">*</span></Label>
              <Input
                value={form.position}
                onChange={(e) => updateForm('position', e.target.value)}
                placeholder="请输入岗位名称"
              />
            </div>

            <div className="space-y-2">
              <Label>面试轮次</Label>
              <div className="flex flex-wrap gap-2">
                {ROUND_OPTIONS.map((round) => (
                  <Chip
                    key={round}
                    active={form.round === round && !showCustomRound}
                    onClick={() => {
                      setForm((prev) => ({ ...prev, round, customRound: '' }));
                      setShowCustomRound(false);
                    }}
                  >
                    {round}
                  </Chip>
                ))}
                {!showCustomRound ? (
                  <Chip onClick={() => setShowCustomRound(true)}>
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    自定义
                  </Chip>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={form.customRound}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, customRound: e.target.value, round: '' }));
                      }}
                      placeholder="输入轮次"
                      className="w-28 py-1.5 px-3 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomRound(false);
                        setForm((prev) => ({ ...prev, customRound: '', round: ROUND_OPTIONS[0] }));
                      }}
                      className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>面试日期</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => updateForm('date', e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>面试时间</Label>
                <Input
                  type="time"
                  value={form.time}
                  onChange={(e) => updateForm('time', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>面试方式</Label>
              <div className="flex flex-wrap gap-2">
                {METHOD_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    active={form.interviewMethod === option.value}
                    onClick={() => updateForm('interviewMethod', option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>面试官角色</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    active={form.interviewerRoles.includes(option.value)}
                    onClick={() => toggleRole(option.value)}
                  >
                    {option.label}
                  </Chip>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>面试结果</Label>
              <div className="flex flex-wrap gap-2">
                {RESULT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => updateForm('result', option.value)}
                    className={`chip ${
                      form.result === option.value ? option.color : ''
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>面试过程</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-1.5">
              <Label>面试时长(分钟)</Label>
              <Input
                type="number"
                value={form.duration}
                onChange={(e) => updateForm('duration', Number(e.target.value))}
                placeholder="请输入面试时长"
                min={0}
              />
            </div>

            <div className="space-y-4">
              <Label>面试问题</Label>
              {form.questions.map((question, idx) => (
                <div
                  key={question.id}
                  className="bg-neutral-50 rounded-xl p-4 border border-neutral-200 space-y-4 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-600">问题 {idx + 1}</span>
                    {form.questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <SpeechTextArea
                    value={question.question}
                    onChange={(v) => updateQuestion(question.id, 'question', v)}
                    placeholder="面试官问了什么问题？"
                  />

                  <SpeechTextArea
                    value={question.answer}
                    onChange={(v) => updateQuestion(question.id, 'answer', v)}
                    placeholder="你的回答摘要"
                  />

                  <div className="space-y-1.5">
                    <Label>自我评分</Label>
                    <Rating
                      value={question.rating}
                      onChange={(v) => updateQuestion(question.id, 'rating', v)}
                    />
                  </div>

                  <SpeechTextArea
                    value={question.feedback}
                    onChange={(v) => updateQuestion(question.id, 'feedback', v)}
                    placeholder="面试官的反馈（选填）"
                    rows={3}
                  />
                </div>
              ))}

              <Button variant="secondary" fullWidth onClick={addQuestion}>
                <Plus className="w-4 h-4 mr-2" />
                添加问题
              </Button>
            </div>

            <div className="pt-4 border-t border-neutral-200 space-y-4">
              <div className="space-y-2">
                <Label>整体心情</Label>
                <MoodSelector value={form.mood} onChange={(v) => updateForm('mood', v)} />
              </div>

              <SpeechTextArea
                value={form.notes}
                onChange={(v) => updateForm('notes', v)}
                label="整体感受备注"
                placeholder="记录面试整体感受..."
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>复盘分析</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label>优势点</Label>
              <TagSelector
                availableTags={[...STRENGTH_TAGS]}
                selectedTags={form.strengths}
                onToggle={toggleStrength}
              />
            </div>

            <div className="space-y-2">
              <Label>不足点</Label>
              <TagSelector
                availableTags={[...WEAKNESS_TAGS]}
                selectedTags={form.weaknesses}
                onToggle={toggleWeakness}
              />
            </div>

            <div className="space-y-1.5">
              <Label>待改进项</Label>
              <TextArea
                value={form.improvements}
                onChange={(e) => updateForm('improvements', e.target.value)}
                placeholder="写下需要改进的地方..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-neutral-200 safe-bottom">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button variant="secondary" fullWidth onClick={handleCancel} disabled={loading}>
            取消
          </Button>
          <Button variant="primary" fullWidth onClick={handleSave} loading={loading}>
            <Save className="w-4 h-4 mr-2" />
            保存
          </Button>
        </div>
      </div>
    </div>
  );
}
