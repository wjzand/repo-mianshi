import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Question, QuestionCategory, PositionType } from '@/types/question';
import {
  getQuestions,
  createQuestion,
  updateQuestion as updateQuestionService,
  deleteQuestion as deleteQuestionService,
  initDefaultQuestions as initDefaultQuestionsService,
} from '@/services/questionService';

interface QuestionState {
  questions: Question[];
  loading: boolean;
  error: string | null;
  selectedCategory: QuestionCategory | 'all';
  selectedPosition: PositionType | 'all';
  searchQuery: string;

  setQuestions: (questions: Question[]) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, data: Partial<Question>) => void;
  removeQuestion: (id: string) => void;
  setSelectedCategory: (category: QuestionCategory | 'all') => void;
  setSelectedPosition: (position: PositionType | 'all') => void;
  setSearchQuery: (query: string) => void;
  loadQuestions: () => Promise<void>;
  initDefaultQuestions: () => Promise<void>;
  getFilteredQuestions: () => Question[];
}

export const useQuestionStore = create<QuestionState>()(
  persist(
    (set, get) => ({
      questions: [],
      loading: false,
      error: null,
      selectedCategory: 'all',
      selectedPosition: 'all',
      searchQuery: '',

      setQuestions: (questions) => set({ questions }),

      addQuestion: (question) =>
        set((state) => ({
          questions: [question, ...state.questions],
        })),

      updateQuestion: (id, data) =>
        set((state) => ({
          questions: state.questions.map((q) => (q.id === id ? { ...q, ...data } : q)),
        })),

      removeQuestion: (id) =>
        set((state) => ({
          questions: state.questions.filter((q) => q.id !== id),
        })),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      setSelectedPosition: (position) => set({ selectedPosition: position }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      loadQuestions: async () => {
        set({ loading: true, error: null });
        try {
          await initDefaultQuestionsService();
          const questions = await getQuestions({
            sort: { field: 'importance', direction: 'desc' },
          });
          set({ questions, loading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : '加载失败', loading: false });
        }
      },

      initDefaultQuestions: async () => {
        set({ loading: true, error: null });
        try {
          await initDefaultQuestionsService();
          const questions = await getQuestions({
            sort: { field: 'importance', direction: 'desc' },
          });
          set({ questions, loading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : '初始化失败', loading: false });
        }
      },

      getFilteredQuestions: () => {
        const { questions, selectedCategory, selectedPosition, searchQuery } = get();
        let result = questions;

        if (selectedCategory !== 'all') {
          result = result.filter((q) => q.category === selectedCategory);
        }

        if (selectedPosition !== 'all') {
          result = result.filter((q) => q.positionType === selectedPosition);
        }

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          result = result.filter(
            (q) =>
              q.title.toLowerCase().includes(query) ||
              q.answer.toLowerCase().includes(query) ||
              q.tags.some((tag) => tag.toLowerCase().includes(query))
          );
        }

        return result;
      },
    }),
    {
      name: 'question-store',
      partialize: (state) => ({
        selectedCategory: state.selectedCategory,
        selectedPosition: state.selectedPosition,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
