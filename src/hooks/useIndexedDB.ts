import { useState, useEffect, useCallback } from 'react';
import { Interview } from '../types/interview';
import { Question } from '../types/question';
import { UserProfile } from '../types/profile';
import {
  getInterviews,
  createInterview as createInterviewService,
  updateInterview as updateInterviewService,
  deleteInterview as deleteInterviewService,
  GetInterviewsOptions,
} from '../services/interviewService';
import {
  getQuestions,
  createQuestion as createQuestionService,
  updateQuestion as updateQuestionService,
  deleteQuestion as deleteQuestionService,
  initDefaultQuestions,
  GetQuestionsOptions,
} from '../services/questionService';
import {
  getProfile,
  updateProfile as updateProfileService,
  getDefaultProfile,
} from '../services/profileService';

export function useInterviews() {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchInterviews = useCallback(async (options?: GetInterviewsOptions) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getInterviews(options);
      setInterviews(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch interviews'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createInterview = useCallback(
    async (data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>) => {
      setLoading(true);
      setError(null);
      try {
        const newInterview = await createInterviewService(data);
        setInterviews((prev) => [newInterview, ...prev]);
        return newInterview;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create interview');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateInterview = useCallback(
    async (id: string, data: Partial<Omit<Interview, 'id' | 'createdAt'>>) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await updateInterviewService(id, data);
        setInterviews((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update interview');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteInterview = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteInterviewService(id);
      setInterviews((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete interview');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInterviews();
  }, [fetchInterviews]);

  return {
    interviews,
    loading,
    error,
    fetchInterviews,
    createInterview,
    updateInterview,
    deleteInterview,
  };
}

export function useQuestions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchQuestions = useCallback(async (options?: GetQuestionsOptions) => {
    setLoading(true);
    setError(null);
    try {
      await initDefaultQuestions();
      const data = await getQuestions(options);
      setQuestions(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch questions'));
    } finally {
      setLoading(false);
    }
  }, []);

  const createQuestion = useCallback(
    async (data: Omit<Question, 'id' | 'isCustom'>) => {
      setLoading(true);
      setError(null);
      try {
        const newQuestion = await createQuestionService(data);
        setQuestions((prev) => [...prev, newQuestion]);
        return newQuestion;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to create question');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const updateQuestion = useCallback(
    async (id: string, data: Partial<Omit<Question, 'id'>>) => {
      setLoading(true);
      setError(null);
      try {
        const updated = await updateQuestionService(id, data);
        setQuestions((prev) =>
          prev.map((item) => (item.id === id ? updated : item))
        );
        return updated;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to update question');
        setError(error);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const deleteQuestion = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await deleteQuestionService(id);
      setQuestions((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to delete question');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  return {
    questions,
    loading,
    error,
    fetchQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
  };
}

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data = await getProfile();
      if (!data) {
        data = getDefaultProfile();
      }
      setProfile(data);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
      return undefined;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<UserProfile>) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await updateProfileService(data);
      setProfile(updated);
      return updated;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}
