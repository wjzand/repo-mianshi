import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
  Pencil,
  Trash2,
  Mic,
  Square,
  Shuffle,
  Save,
  BookOpen,
} from 'lucide-react';
import type {
  Question,
  QuestionCategory,
  PositionType,
  DifficultyLevel,
} from '@/types/question';
import { useQuestionStore } from '@/store/questionStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, TextArea, Label } from '@/components/ui/Input';
import { Tag } from '@/components/ui/Tag';
import { Chip } from '@/components/ui/Chip';
import { Rating } from '@/components/ui/Rating';
import { Modal } from '@/components/ui/Modal';
import PageHeader from '@/components/layout/PageHeader';
import {
  createQuestion,
  updateQuestion as updateQuestionService,
  deleteQuestion as deleteQuestionService,
} from '@/services/questionService';
import { setItem, getItem } from '@/utils/storage';
import { cn } from '@/lib/utils';

const categoryMap: Record<QuestionCategory, string> = {
  behavior: '行为面',
  technical: '技术面',
  hr: 'HR面',
  case: '案例面',
};

const positionMap: Record<PositionType, string> = {
  frontend: '前端',
  backend: '后端',
  product: '产品',
  operation: '运营',
  design: '设计',
};

const difficultyMap: Record<DifficultyLevel, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

const difficultyVariant: Record<DifficultyLevel, 'success' | 'pending' | 'fail'> = {
  easy: 'success',
  medium: 'pending',
  hard: 'fail',
};

const positionOptions: Array<PositionType | 'all'> = [
  'all',
  'frontend',
  'backend',
  'product',
  'operation',
  'design',
];

const categoryOptions: Array<QuestionCategory | 'all'> = [
  'all',
  'behavior',
  'technical',
  'hr',
  'case',
];

const difficultyOptions: Array<DifficultyLevel | 'all'> = [
  'all',
  'easy',
  'medium',
  'hard',
];

interface PracticeRecord {
  id: string;
  questionId: string;
  questionTitle: string;
  transcript: string;
  rating: number;
  createdAt: string;
}

interface FormState {
  title: string;
  answer: string;
  category: QuestionCategory;
  positionType: PositionType;
  difficulty: DifficultyLevel;
  importance: 1 | 2 | 3 | 4 | 5;
}

const initialFormState: FormState = {
  title: '',
  answer: '',
  category: 'behavior',
  positionType: 'frontend',
  difficulty: 'medium',
  importance: 3,
};

export default function QuestionBank() {
  const {
    questions,
    loadQuestions,
    addQuestion,
    updateQuestion,
    removeQuestion,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedPosition,
    setSelectedPosition,
    searchQuery,
    getFilteredQuestions,
  } = useQuestionStore();

  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | 'all'>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [questionFormOpen, setQuestionFormOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [currentPracticeQuestion, setCurrentPracticeQuestion] = useState<Question | null>(null);
  const [practiceTranscript, setPracticeTranscript] = useState('');
  const [practiceRating, setPracticeRating] = useState(0);
  const [formState, setFormState] = useState<FormState>(initialFormState);

  const {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  useEffect(() => {
    if (isListening) {
      setPracticeTranscript(transcript);
    }
  }, [transcript, isListening]);

  const filteredQuestions = useMemo(() => {
    const base = getFilteredQuestions();
    if (selectedDifficulty === 'all') {
      return base;
    }
    return base.filter((q) => q.difficulty === selectedDifficulty);
  }, [getFilteredQuestions, selectedDifficulty]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const openPractice = (question: Question) => {
    setCurrentPracticeQuestion(question);
    setPracticeTranscript('');
    setPracticeRating(0);
    resetTranscript();
    setPracticeModalOpen(true);
  };

  const closePractice = () => {
    if (isListening) {
      stopListening();
    }
    setPracticeModalOpen(false);
    setCurrentPracticeQuestion(null);
  };

  const handleRandomQuestion = () => {
    const pool = filteredQuestions.length > 0 ? filteredQuestions : questions;
    if (pool.length === 0) return;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomQuestion = pool[randomIndex];
    setCurrentPracticeQuestion(randomQuestion);
    setPracticeTranscript('');
    setPracticeRating(0);
    resetTranscript();
  };

  const handleSaveRecord = () => {
    if (!currentPracticeQuestion || !practiceTranscript.trim()) return;
    const records = getItem<PracticeRecord[]>('practiceRecords', []) || [];
    const newRecord: PracticeRecord = {
      id: 'record_' + Date.now().toString(36),
      questionId: currentPracticeQuestion.id,
      questionTitle: currentPracticeQuestion.title,
      transcript: practiceTranscript,
      rating: practiceRating,
      createdAt: new Date().toISOString(),
    };
    records.unshift(newRecord);
    setItem('practiceRecords', records);
    closePractice();
  };

  const openAddForm = () => {
    setEditingQuestion(null);
    setFormState(initialFormState);
    setQuestionFormOpen(true);
  };

  const openEditForm = (question: Question) => {
    setEditingQuestion(question);
    setFormState({
      title: question.title,
      answer: question.answer,
      category: question.category,
      positionType: question.positionType,
      difficulty: question.difficulty,
      importance: question.importance,
    });
    setQuestionFormOpen(true);
  };

  const handleFormSubmit = async () => {
    if (!formState.title.trim()) return;

    if (editingQuestion) {
      const updated = await updateQuestionService(editingQuestion.id, formState);
      updateQuestion(editingQuestion.id, updated);
    } else {
      const created = await createQuestion({
        title: formState.title,
        answer: formState.answer,
        category: formState.category,
        positionType: formState.positionType,
        difficulty: formState.difficulty,
        importance: formState.importance,
        tags: [],
      });
      addQuestion(created);
    }
    setQuestionFormOpen(false);
  };

  const handleDeleteQuestion = async (question: Question) => {
    await deleteQuestionService(question.id);
    removeQuestion(question.id);
  };

  const renderImportanceStars = (importance: number) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={cn(
            'w-3.5 h-3.5',
            i < importance ? 'text-accent-500 fill-accent-500' : 'text-neutral-200'
          )}
        />
      ))}
    </div>
  );

  const renderWaveAnimation = () => (
    <div className="flex items-center justify-center gap-1 h-12">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className={cn(
            'w-1 bg-primary-500 rounded-full animate-pulse',
            isListening && 'wave-bar'
          )}
          style={{
            height: isListening ? `${20 + Math.random() * 28}px` : '8px',
            animationDelay: `${i * 0.05}s`,
            opacity: isListening ? 1 : 0.3,
            transition: 'height 0.1s ease, opacity 0.2s ease',
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-neutral-50">
      <PageHeader
        title="模拟题库"
        rightAction={
          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 p-0 rounded-full"
            onClick={openAddForm}
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      />

      <div className="flex-1 px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            placeholder="搜索题目..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="space-y-3">
          <div>
            <Label className="text-xs text-neutral-500 mb-2 block">岗位类型</Label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {positionOptions.map((pos) => (
                <Chip
                  key={pos}
                  active={selectedPosition === pos}
                  onClick={() => setSelectedPosition(pos)}
                  className="flex-shrink-0"
                >
                  {pos === 'all' ? '全部' : positionMap[pos]}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-neutral-500 mb-2 block">题目类型</Label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {categoryOptions.map((cat) => (
                <Chip
                  key={cat}
                  active={selectedCategory === cat}
                  onClick={() => setSelectedCategory(cat)}
                  className="flex-shrink-0"
                >
                  {cat === 'all' ? '全部' : categoryMap[cat]}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-xs text-neutral-500 mb-2 block">难度</Label>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
              {difficultyOptions.map((diff) => (
                <Chip
                  key={diff}
                  active={selectedDifficulty === diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className="flex-shrink-0"
                >
                  {diff === 'all' ? '全部' : difficultyMap[diff]}
                </Chip>
              ))}
            </div>
          </div>
        </div>

        {filteredQuestions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary-500" />
            </div>
            <h3 className="text-base font-semibold text-neutral-700 mb-2">
              {questions.length === 0 ? '还没有题目' : '没有匹配的题目'}
            </h3>
            <p className="text-sm text-neutral-500 mb-6 max-w-xs">
              {questions.length === 0
                ? '点击右上角 "+" 添加自定义题目，开始你的面试练习之旅'
                : '试试调整筛选条件或搜索关键词'}
            </p>
            {questions.length === 0 && (
              <Button onClick={openAddForm}>
                <Plus className="w-4 h-4 mr-2" />
                添加题目
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filteredQuestions.map((question) => {
              const isExpanded = expandedIds.has(question.id);
              return (
                <Card key={question.id} className="overflow-hidden">
                  <button
                    onClick={() => toggleExpand(question.id)}
                    className="w-full p-4 flex items-start justify-between text-left hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-3">
                      <div className="flex flex-wrap items-center gap-1.5 mb-2">
                        <Tag variant="primary" className="text-xs">
                          {categoryMap[question.category]}
                        </Tag>
                        <Tag variant={difficultyVariant[question.difficulty]} className="text-xs">
                          {difficultyMap[question.difficulty]}
                        </Tag>
                        <Tag variant="accent" className="text-xs">
                          {positionMap[question.positionType]}
                        </Tag>
                        {renderImportanceStars(question.importance)}
                      </div>
                      <p className="text-neutral-700 font-medium leading-relaxed">
                        {question.title}
                      </p>
                    </div>
                    <div className="flex-shrink-0 mt-1">
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-neutral-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-neutral-400" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-4 animate-slide-down">
                      <div className="h-px bg-neutral-100 -mx-4" />

                      {question.answer && (
                        <div className="space-y-2">
                          <Label className="text-xs text-neutral-500">参考答案提示</Label>
                          <p className="text-sm text-neutral-600 bg-neutral-50 rounded-xl p-3 whitespace-pre-wrap leading-relaxed">
                            {question.answer}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1">
                        <Button size="sm" onClick={() => openPractice(question)}>
                          <Mic className="w-4 h-4 mr-1.5" />
                          模拟练习
                        </Button>
                        {question.isCustom && (
                          <>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => openEditForm(question)}
                            >
                              <Pencil className="w-4 h-4 mr-1.5" />
                              编辑
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:bg-red-50 hover:text-red-600"
                              onClick={() => handleDeleteQuestion(question)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Modal
        open={practiceModalOpen}
        onClose={closePractice}
        title="模拟练习"
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleRandomQuestion}>
              <Shuffle className="w-4 h-4 mr-1.5" />
              再练一题
            </Button>
            <Button
              onClick={handleSaveRecord}
              disabled={!practiceTranscript.trim() || practiceRating === 0}
            >
              <Save className="w-4 h-4 mr-1.5" />
              保存记录
            </Button>
          </div>
        }
      >
        {currentPracticeQuestion && (
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag variant="primary" className="text-xs">
                  {categoryMap[currentPracticeQuestion.category]}
                </Tag>
                <Tag variant={difficultyVariant[currentPracticeQuestion.difficulty]} className="text-xs">
                  {difficultyMap[currentPracticeQuestion.difficulty]}
                </Tag>
                <Tag variant="accent" className="text-xs">
                  {positionMap[currentPracticeQuestion.positionType]}
                </Tag>
              </div>
              <p className="text-neutral-700 font-medium text-lg leading-relaxed">
                {currentPracticeQuestion.title}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center">
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={cn(
                    'relative flex items-center justify-center rounded-full transition-all duration-300',
                    isListening
                      ? 'w-16 h-16 bg-red-500 hover:bg-red-600'
                      : 'w-14 h-14 bg-primary-500 hover:bg-primary-600',
                    !isSupported && 'opacity-50 cursor-not-allowed'
                  )}
                  disabled={!isSupported}
                >
                  {isListening ? (
                    <Square className="w-6 h-6 text-white fill-white" />
                  ) : (
                    <Mic className="w-7 h-7 text-white" />
                  )}
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-red-400 opacity-30 animate-ping" />
                      <span className="absolute inset-0 rounded-full bg-red-400 opacity-20 animate-ping" style={{ animationDelay: '0.5s' }} />
                    </>
                  )}
                </button>
              </div>

              <p className="text-center text-xs text-neutral-500">
                {isListening
                  ? '正在录音...点击停止'
                  : isSupported
                  ? '点击开始录音'
                  : '当前浏览器不支持语音识别'}
              </p>

              {renderWaveAnimation()}

              {error && (
                <p className="text-sm text-red-500 text-center">{error}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">转录文本</Label>
              <TextArea
                value={practiceTranscript}
                onChange={(e) => setPracticeTranscript(e.target.value)}
                placeholder="你的回答将显示在这里，也可以手动编辑..."
                className="min-h-[120px]"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-neutral-500">自我评分</Label>
              <Rating value={practiceRating} onChange={setPracticeRating} size="lg" />
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={questionFormOpen}
        onClose={() => setQuestionFormOpen(false)}
        title={editingQuestion ? '编辑题目' : '新增自定义题目'}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setQuestionFormOpen(false)}>
              取消
            </Button>
            <Button onClick={handleFormSubmit} disabled={!formState.title.trim()}>
              保存
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="space-y-2">
            <Label>题目内容</Label>
            <TextArea
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              placeholder="请输入面试题目..."
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>参考答案</Label>
            <TextArea
              value={formState.answer}
              onChange={(e) => setFormState({ ...formState, answer: e.target.value })}
              placeholder="请输入参考答案提示（可选）..."
              className="min-h-[80px]"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">题型</Label>
            <div className="flex gap-2 flex-wrap">
              {(categoryOptions.filter((c) => c !== 'all') as QuestionCategory[]).map((cat) => (
                <Chip
                  key={cat}
                  active={formState.category === cat}
                  onClick={() => setFormState({ ...formState, category: cat })}
                >
                  {categoryMap[cat]}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">岗位</Label>
            <div className="flex gap-2 flex-wrap">
              {(positionOptions.filter((p) => p !== 'all') as PositionType[]).map((pos) => (
                <Chip
                  key={pos}
                  active={formState.positionType === pos}
                  onClick={() => setFormState({ ...formState, positionType: pos })}
                >
                  {positionMap[pos]}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">难度</Label>
            <div className="flex gap-2 flex-wrap">
              {(difficultyOptions.filter((d) => d !== 'all') as DifficultyLevel[]).map((diff) => (
                <Chip
                  key={diff}
                  active={formState.difficulty === diff}
                  onClick={() => setFormState({ ...formState, difficulty: diff })}
                >
                  {difficultyMap[diff]}
                </Chip>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-neutral-500">重要性</Label>
            <Rating
              value={formState.importance}
              onChange={(v) => setFormState({ ...formState, importance: v as 1 | 2 | 3 | 4 | 5 })}
              size="lg"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
