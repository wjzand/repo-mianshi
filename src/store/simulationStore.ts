import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  SimulationConfig,
  SimulationSession,
  SimulationQuestion,
  SimulationAnswer,
  SimulationReport,
  FailQuestion,
  SimulationDimension,
} from '@/types/simulation';
import {
  getSimulationReports,
  saveSimulationReport,
  deleteSimulationReport as deleteReportService,
  getFailQuestions,
  addFailQuestion as addFailQuestionService,
  deleteFailQuestion as deleteFailQuestionService,
  syncFailQuestionsFromInterviews,
  generateSimulationQuestions,
  evaluateAnswer,
} from '@/services/simulationService';
import type { Interview } from '@/types/interview';

interface SimulationState {
  session: SimulationSession | null;
  reports: SimulationReport[];
  failQuestions: FailQuestion[];
  loading: boolean;

  startSession: (config: SimulationConfig, interviews: Interview[]) => void;
  submitAnswer: (answer: string, audioUrl: string | null) => void;
  nextQuestion: () => void;
  completeSession: () => SimulationReport | null;
  resetSession: () => void;

  loadReports: () => Promise<void>;
  deleteReport: (id: string) => Promise<void>;
  loadFailQuestions: () => Promise<void>;
  addFailQuestion: (question: FailQuestion) => Promise<void>;
  deleteFailQuestion: (id: string) => Promise<void>;
  syncFromInterviews: (interviews: Interview[]) => Promise<void>;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      session: null,
      reports: [],
      failQuestions: [],
      loading: false,

      startSession: (config, interviews) => {
        const { failQuestions } = get();
        const questions = generateSimulationQuestions(
          config.dimensions,
          config.questionCount,
          failQuestions,
          config.includeFailQuestions
        );

        const session: SimulationSession = {
          id: generateId(),
          config,
          status: 'ongoing',
          questions,
          answers: [],
          currentQuestionIndex: 0,
          startedAt: new Date().toISOString(),
          completedAt: null,
          totalScore: 0,
          dimensionScores: {} as Record<SimulationDimension, number>,
        };

        set({ session });
      },

      submitAnswer: (answer, audioUrl) => {
        const { session } = get();
        if (!session) return;

        const currentQ = session.questions[session.currentQuestionIndex];
        if (!currentQ) return;

        const eval_ = evaluateAnswer(currentQ.question, answer, currentQ.dimension);

        const simAnswer: SimulationAnswer = {
          questionId: currentQ.id,
          question: currentQ.question,
          answer,
          audioUrl,
          duration: currentQ.duration,
          scores: {
            completeness: eval_.completeness,
            clarity: eval_.clarity,
            evidence: eval_.evidence,
            fluency: eval_.fluency,
          },
          feedback: eval_.feedback,
          highlights: eval_.highlights,
          improvements: eval_.improvements,
          improvedAnswer: eval_.improvedAnswer,
        };

        set({
          session: {
            ...session,
            answers: [...session.answers, simAnswer],
          },
        });
      },

      nextQuestion: () => {
        const { session } = get();
        if (!session) return;

        const nextIndex = session.currentQuestionIndex + 1;
        if (nextIndex >= session.questions.length) {
          get().completeSession();
          return;
        }

        set({
          session: {
            ...session,
            currentQuestionIndex: nextIndex,
          },
        });
      },

      completeSession: () => {
        const { session } = get();
        if (!session) return null;

        const dimensionTotals: Record<string, { sum: number; count: number }> = {};
        let totalScore = 0;

        session.answers.forEach((a) => {
          const q = session.questions.find((q) => q.id === a.questionId);
          const dim = q?.dimension || 'technical';
          if (!dimensionTotals[dim]) dimensionTotals[dim] = { sum: 0, count: 0 };
          const avg = (a.scores.completeness + a.scores.clarity + a.scores.evidence + a.scores.fluency) / 4;
          dimensionTotals[dim].sum += avg;
          dimensionTotals[dim].count += 1;
          totalScore += avg;
        });

        const dimensionScores = {} as Record<SimulationDimension, number>;
        for (const [dim, data] of Object.entries(dimensionTotals)) {
          dimensionScores[dim as SimulationDimension] = Math.round(data.sum / data.count);
        }

        const avgTotal = session.answers.length > 0 ? Math.round(totalScore / session.answers.length) : 0;

        let comparedToLast: Record<string, number> = {};
        const { reports } = get();
        if (reports.length > 0) {
          const lastReport = reports[0];
          const lastAvg = lastReport.totalScore;
          for (const [dim, score] of Object.entries(dimensionScores)) {
            const lastDimScore = lastReport.dimensionScores[dim as SimulationDimension];
            if (lastDimScore !== undefined) {
              comparedToLast[dim] = score - lastDimScore;
            }
          }
          comparedToLast['total'] = avgTotal - lastReport.totalScore;
        }

        const suggestions: string[] = [];
        const weakDims = Object.entries(dimensionScores)
          .filter(([, score]) => score < 60)
          .sort(([, a], [, b]) => a - b);

        const dimLabels: Record<string, string> = {
          self_intro: '自我介绍',
          project: '项目深挖',
          technical: '技术基础',
          behavior: '行为面试',
          salary: '薪资谈判',
          counter_question: '反问环节',
        };

        weakDims.forEach(([dim]) => {
          suggestions.push(`${dimLabels[dim] || dim}维度表现较弱，建议针对性加强练习`);
        });

        if (suggestions.length === 0) {
          suggestions.push('整体表现优秀，建议继续保持，尝试更高难度的模拟');
        }

        const report: SimulationReport = {
          id: generateId(),
          sessionId: session.id,
          config: session.config,
          answers: session.answers,
          totalScore: avgTotal,
          dimensionScores,
          comparedToLast,
          suggestions,
          createdAt: new Date().toISOString(),
        };

        set({
          session: {
            ...session,
            status: 'completed',
            completedAt: new Date().toISOString(),
            totalScore: avgTotal,
            dimensionScores,
          },
          reports: [report, ...get().reports],
        });

        saveSimulationReport(report);

        return report;
      },

      resetSession: () => set({ session: null }),

      loadReports: async () => {
        set({ loading: true });
        try {
          const reports = await getSimulationReports();
          set({ reports, loading: false });
        } catch {
          set({ loading: false });
        }
      },

      deleteReport: async (id) => {
        await deleteReportService(id);
        set((state) => ({
          reports: state.reports.filter((r) => r.id !== id),
        }));
      },

      loadFailQuestions: async () => {
        try {
          const failQuestions = await getFailQuestions();
          set({ failQuestions });
        } catch {
          // ignore
        }
      },

      addFailQuestion: async (question) => {
        await addFailQuestionService(question);
        set((state) => ({
          failQuestions: [question, ...state.failQuestions],
        }));
      },

      deleteFailQuestion: async (id) => {
        await deleteFailQuestionService(id);
        set((state) => ({
          failQuestions: state.failQuestions.filter((q) => q.id !== id),
        }));
      },

      syncFromInterviews: async (interviews) => {
        await syncFailQuestionsFromInterviews(interviews);
        const failQuestions = await getFailQuestions();
        set({ failQuestions });
      },
    }),
    {
      name: 'simulation-store',
      partialize: (state) => ({
        session: state.session,
      }),
    }
  )
);
