import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Square, Type, ChevronRight, Clock, Award, MessageCircle, Send, X } from 'lucide-react';
import { useSimulationStore } from '@/store/simulationStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { TextArea } from '@/components/ui/Input';
import { Rating } from '@/components/ui/Rating';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { DIMENSION_LABELS } from '@/types/simulation';

const EXAM_TIME_PER_QUESTION = 180;

const SCORE_DIMENSIONS = [
  { key: 'completeness' as const, label: '内容完整性' },
  { key: 'clarity' as const, label: '逻辑清晰度' },
  { key: 'evidence' as const, label: '案例支撑度' },
  { key: 'fluency' as const, label: '表达流畅度' },
];

export default function SimulationRoom() {
  const navigate = useNavigate();
  const session = useSimulationStore((s) => s.session);
  const submitAnswer = useSimulationStore((s) => s.submitAnswer);
  const nextQuestion = useSimulationStore((s) => s.nextQuestion);
  const resetSession = useSimulationStore((s) => s.resetSession);

  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [textAnswer, setTextAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showImproved, setShowImproved] = useState(false);
  const [timeLeft, setTimeLeft] = useState(EXAM_TIME_PER_QUESTION);
  const [autoAdvanceCountdown, setAutoAdvanceCountdown] = useState<number | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    isSupported: speechSupported,
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (!session || session.status !== 'ongoing') {
      navigate('/simulation/setup');
    }
  }, [session, navigate]);

  const isExam = session?.config.mode === 'exam';
  const currentQuestion = session?.questions[session?.currentQuestionIndex];
  const latestAnswer = session?.answers[session?.answers.length - 1];
  const totalQuestions = session?.questions.length ?? 0;
  const currentIndex = session?.currentQuestionIndex ?? 0;
  const answeredCount = session?.answers.length ?? 0;

  useEffect(() => {
    if (isExam && currentQuestion && !showFeedback && !isCompleted) {
      setTimeLeft(EXAM_TIME_PER_QUESTION);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExam, currentQuestion, showFeedback, isCompleted]);

  useEffect(() => {
    if (isExam && timeLeft === 0 && !showFeedback && !isCompleted) {
      handleSubmit('');
    }
  }, [timeLeft, isExam, showFeedback, isCompleted]);

  useEffect(() => {
    if (transcript) {
      setTextAnswer(transcript);
    }
  }, [transcript]);

  useEffect(() => {
    if (session?.status === 'completed' && !isCompleted) {
      setIsCompleted(true);
    }
  }, [session?.status, isCompleted]);

  useEffect(() => {
    return () => {
      if (autoAdvanceRef.current) clearTimeout(autoAdvanceRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const handleSubmit = useCallback(
    (answerOverride?: string) => {
      const answer = answerOverride !== undefined ? answerOverride : textAnswer;
      if (!answer.trim() && answerOverride === undefined) return;

      submitAnswer(answer, null);
      setTextAnswer('');
      resetTranscript();
      if (timerRef.current) clearInterval(timerRef.current);

      if (isExam) {
        setAutoAdvanceCountdown(3);
        autoAdvanceRef.current = setTimeout(() => {
          setShowFeedback(false);
          setAutoAdvanceCountdown(null);
          nextQuestion();
        }, 3000);
      } else {
        setShowFeedback(true);
      }
    },
    [textAnswer, submitAnswer, resetTranscript, isExam, nextQuestion]
  );

  const handleNextQuestion = useCallback(() => {
    setShowFeedback(false);
    setShowImproved(false);
    setTextAnswer('');
    resetTranscript();
    nextQuestion();
  }, [nextQuestion, resetTranscript]);

  const handleViewReport = useCallback(() => {
    if (session) {
      navigate(`/simulation/report/${session.id}`);
    }
  }, [session, navigate]);

  const handleExit = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const handleConfirmExit = useCallback(() => {
    resetSession();
    navigate('/simulation/setup');
  }, [resetSession, navigate]);

  const handleMicDown = useCallback(() => {
    if (!speechSupported) return;
    setIsRecording(true);
    startListening();
  }, [speechSupported, startListening]);

  const handleMicUp = useCallback(() => {
    if (!isRecording) return;
    setIsRecording(false);
    stopListening();
  }, [isRecording, stopListening]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!session || session.status !== 'ongoing' || !currentQuestion) {
    return null;
  }

  if (isCompleted) {
    const totalScore = session.totalScore;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700">
        <div className="text-center animate-fade-in px-6">
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-accent flex items-center justify-center shadow-button animate-bounce-slow">
            <Award className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">模拟完成！</h1>
          <p className="text-primary-200 text-lg mb-2">你的表现很棒</p>
          <div className="my-8">
            <div className="text-6xl font-bold text-gradient-accent inline-block">{totalScore}</div>
            <div className="text-primary-300 text-sm mt-1">综合评分</div>
          </div>
          <Button size="lg" onClick={handleViewReport} className="bg-gradient-accent shadow-button text-white font-bold text-lg px-12 py-4 rounded-full">
            查看报告
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-primary-900 via-primary-800 to-primary-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExit}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <span className="text-white/80 text-sm font-medium">
            {currentIndex + 1} / {totalQuestions}
          </span>
          <div className="flex items-center gap-1.5">
            {session.questions.map((_, idx) => (
              <div
                key={idx}
                className={cn(
                  'w-2 h-2 rounded-full transition-all duration-300',
                  idx < answeredCount && 'bg-accent-400',
                  idx === currentIndex && 'bg-white animate-pulse-slow w-3 h-3',
                  idx > currentIndex && 'bg-white/20'
                )}
              />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isExam && (
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium',
                timeLeft <= 30 ? 'bg-red-500/20 text-red-300' : 'bg-white/10 text-white/80'
              )}
            >
              <Clock className="w-3.5 h-3.5" />
              {formatTime(timeLeft)}
            </div>
          )}
          <span
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              isExam ? 'bg-accent-500/20 text-accent-300' : 'bg-success-500/20 text-success-300'
            )}
          >
            {isExam ? '考核' : '练习'}
          </span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-4 overflow-y-auto">
        <div className="relative mb-6 animate-fade-in">
          <div
            className={cn(
              'w-20 h-20 rounded-full flex items-center justify-center',
              'bg-gradient-to-br from-primary-400 to-accent-400 shadow-glow',
              isRecording ? 'animate-pulse' : 'animate-breathing'
            )}
          >
            <MessageCircle className="w-10 h-10 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-accent-500 flex items-center justify-center shadow-button">
            <Award className="w-4 h-4 text-white" />
          </div>
        </div>

        <div className="w-full max-w-md animate-slide-up">
          <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10">
            <div className="absolute -top-2 left-6">
              <span className="tag text-xs bg-primary-500/30 text-primary-200 border-0">
                {DIMENSION_LABELS[currentQuestion.dimension]}
              </span>
            </div>
            <p className="text-white text-lg leading-relaxed mt-2">{currentQuestion.question}</p>
          </div>
        </div>
      </div>

      {showFeedback && latestAnswer && !isExam && (
        <div className="absolute inset-x-0 bottom-0 z-40 animate-slide-up max-h-[70vh] overflow-y-auto">
          <div className="bg-white rounded-t-3xl shadow-card-lg p-6 safe-bottom">
            <div className="w-10 h-1 bg-neutral-200 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-neutral-700 mb-3 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-primary-500" />
              AI 反馈
            </h3>
            <p className="text-sm text-neutral-600 leading-relaxed mb-4">{latestAnswer.feedback}</p>

            <div className="space-y-3 mb-4">
              {SCORE_DIMENSIONS.map((dim) => (
                <div key={dim.key} className="flex items-center gap-3">
                  <span className="text-xs text-neutral-500 w-20 shrink-0">{dim.label}</span>
                  <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-accent transition-all duration-700"
                      style={{ width: `${latestAnswer.scores[dim.key]}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-neutral-700 w-8 text-right">
                    {latestAnswer.scores[dim.key]}
                  </span>
                </div>
              ))}
            </div>

            {latestAnswer.highlights.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-neutral-500 mb-1.5">亮点</p>
                <div className="flex flex-wrap gap-1.5">
                  {latestAnswer.highlights.map((h, i) => (
                    <span key={i} className="tag text-xs bg-success-50 text-success-600 border-0">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {latestAnswer.improvements.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-neutral-500 mb-1.5">改进建议</p>
                <div className="flex flex-wrap gap-1.5">
                  {latestAnswer.improvements.map((im, i) => (
                    <span key={i} className="tag text-xs bg-accent-50 text-accent-600 border-0">
                      {im}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {latestAnswer.improvedAnswer && (
              <div className="mb-4">
                <button
                  onClick={() => setShowImproved(!showImproved)}
                  className="text-xs text-primary-500 font-medium flex items-center gap-1"
                >
                  <ChevronRight
                    className={cn('w-3.5 h-3.5 transition-transform', showImproved && 'rotate-90')}
                  />
                  参考优化回答
                </button>
                {showImproved && (
                  <div className="mt-2 p-3 bg-primary-50 rounded-xl text-sm text-neutral-600 leading-relaxed animate-fade-in">
                    {latestAnswer.improvedAnswer}
                  </div>
                )}
              </div>
            )}

            <Button fullWidth onClick={handleNextQuestion} className="bg-gradient-accent shadow-button text-white font-medium rounded-xl">
              下一题
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {autoAdvanceCountdown !== null && isExam && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 shadow-card-lg text-center">
            <div className="text-4xl font-bold text-primary-500 mb-2 animate-bounce-slow">
              {autoAdvanceCountdown}
            </div>
            <p className="text-sm text-neutral-500">即将进入下一题</p>
          </div>
        </div>
      )}

      <div className="px-4 pb-6 safe-bottom">
        <div className="flex items-center justify-center gap-3 mb-4">
          <button
            onClick={() => setInputMode('voice')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              inputMode === 'voice'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            )}
          >
            <Mic className="w-4 h-4" />
            语音
          </button>
          <button
            onClick={() => setInputMode('text')}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200',
              inputMode === 'text'
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            )}
          >
            <Type className="w-4 h-4" />
            文字
          </button>
        </div>

        {inputMode === 'voice' ? (
          <div className="flex flex-col items-center gap-3">
            <div
              onMouseDown={handleMicDown}
              onMouseUp={handleMicUp}
              onMouseLeave={() => { if (isRecording) handleMicUp(); }}
              onTouchStart={handleMicDown}
              onTouchEnd={handleMicUp}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200 select-none',
                isRecording
                  ? 'bg-red-500 shadow-button scale-110 animate-pulse'
                  : 'bg-white/20 hover:bg-white/30 active:scale-95'
              )}
            >
              {isRecording ? (
                <Square className="w-8 h-8 text-white fill-white" />
              ) : (
                <Mic className="w-8 h-8 text-white" />
              )}
            </div>
            {isRecording && (
              <div className="flex items-center gap-1 h-6">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/60 rounded-full animate-pulse"
                    style={{
                      height: `${12 + Math.random() * 16}px`,
                      animationDelay: `${i * 100}ms`,
                      animationDuration: `${0.4 + Math.random() * 0.4}s`,
                    }}
                  />
                ))}
              </div>
            )}
            <span className="text-white/50 text-xs">
              {isRecording ? '松开结束录音' : '按住说话'}
            </span>
            {textAnswer && (
              <div className="w-full max-w-md">
                <div className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <p className="text-white/80 text-sm line-clamp-3">{textAnswer}</p>
                </div>
                <Button
                  size="sm"
                  fullWidth
                  className="mt-2 bg-gradient-accent shadow-button text-white font-medium rounded-xl"
                  onClick={() => handleSubmit()}
                >
                  提交回答
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-end gap-2 max-w-md mx-auto">
            <TextArea
              value={textAnswer}
              onChange={(e) => setTextAnswer(e.target.value)}
              placeholder="输入你的回答..."
              rows={3}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/30 focus:border-white/40 focus:ring-white/10 rounded-xl"
            />
            <Button
              size="sm"
              className="bg-gradient-accent shadow-button text-white rounded-xl shrink-0 h-12 w-12 p-0"
              onClick={() => handleSubmit()}
              disabled={!textAnswer.trim()}
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        )}
      </div>

      <Modal
        open={showExitModal}
        onClose={() => setShowExitModal(false)}
        title="退出模拟"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setShowExitModal(false)} className="flex-1">
              继续模拟
            </Button>
            <Button onClick={handleConfirmExit} className="flex-1" style={{ background: 'linear-gradient(135deg, #F53F3F 0%, #FF7875 100%)' }}>
              确认退出
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <p className="text-neutral-600 leading-relaxed">
            确定要退出模拟面试吗？
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            当前进度不会被保存，退出后需要重新开始。
          </p>
        </div>
      </Modal>
    </div>
  );
}
