import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Interview, InterviewResult } from '@/types/interview';
import {
  getInterviews,
  createInterview,
  updateInterview as updateInterviewService,
  deleteInterview as deleteInterviewService,
} from '@/services/interviewService';

export interface InterviewFilters {
  result?: InterviewResult;
  position?: string;
  dateFrom?: string;
  dateTo?: string;
}

interface InterviewState {
  interviews: Interview[];
  loading: boolean;
  error: string | null;
  currentInterview: Interview | null;
  searchQuery: string;
  filters: InterviewFilters;

  setInterviews: (interviews: Interview[]) => void;
  addInterview: (interview: Interview) => void;
  updateInterview: (id: string, data: Partial<Interview>) => void;
  removeInterview: (id: string) => void;
  setCurrentInterview: (interview: Interview | null) => void;
  setSearchQuery: (query: string) => void;
  setFilters: (filters: Partial<InterviewFilters>) => void;
  loadInterviews: () => Promise<void>;
  saveInterview: (data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Promise<Interview>;
  deleteInterview: (id: string) => Promise<void>;
  getFilteredInterviews: () => Interview[];
}

export const useInterviewStore = create<InterviewState>()(
  persist(
    (set, get) => ({
      interviews: [],
      loading: false,
      error: null,
      currentInterview: null,
      searchQuery: '',
      filters: {},

      setInterviews: (interviews) => set({ interviews }),

      addInterview: (interview) =>
        set((state) => ({
          interviews: [interview, ...state.interviews],
        })),

      updateInterview: (id, data) =>
        set((state) => ({
          interviews: state.interviews.map((iv) =>
            iv.id === id ? { ...iv, ...data, updatedAt: new Date().toISOString() } : iv
          ),
          currentInterview:
            state.currentInterview?.id === id
              ? { ...state.currentInterview, ...data, updatedAt: new Date().toISOString() }
              : state.currentInterview,
        })),

      removeInterview: (id) =>
        set((state) => ({
          interviews: state.interviews.filter((iv) => iv.id !== id),
          currentInterview: state.currentInterview?.id === id ? null : state.currentInterview,
        })),

      setCurrentInterview: (interview) => set({ currentInterview: interview }),

      setSearchQuery: (query) => set({ searchQuery: query }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),

      loadInterviews: async () => {
        set({ loading: true, error: null });
        try {
          const interviews = await getInterviews({
            sort: { field: 'interviewDate', direction: 'desc' },
          });
          set({ interviews, loading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : '加载失败', loading: false });
        }
      },

      saveInterview: async (data) => {
        const isUpdate = !!data.id;
        let interview: Interview;

        if (isUpdate && data.id) {
          const { id, ...rest } = data;
          interview = await updateInterviewService(id, rest);
          get().updateInterview(interview.id, interview);
        } else {
          interview = await createInterview(data as Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>);
          get().addInterview(interview);
        }
        return interview;
      },

      deleteInterview: async (id) => {
        await deleteInterviewService(id);
        get().removeInterview(id);
      },

      getFilteredInterviews: () => {
        const { interviews, searchQuery, filters } = get();
        let result = interviews;

        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          result = result.filter(
            (iv) =>
              iv.company.toLowerCase().includes(query) ||
              iv.position.toLowerCase().includes(query) ||
              iv.notes.toLowerCase().includes(query) ||
              iv.round.toLowerCase().includes(query)
          );
        }

        if (filters.result) {
          result = result.filter((iv) => iv.result === filters.result);
        }

        if (filters.position) {
          result = result.filter((iv) =>
            iv.position.toLowerCase().includes(filters.position!.toLowerCase())
          );
        }

        if (filters.dateFrom) {
          result = result.filter((iv) => iv.interviewDate >= filters.dateFrom!);
        }

        if (filters.dateTo) {
          result = result.filter((iv) => iv.interviewDate <= filters.dateTo!);
        }

        return result;
      },
    }),
    {
      name: 'interview-store',
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        filters: state.filters,
      }),
    }
  )
);
