import { questionDB } from './db';
import type { Question, QuestionCategory, PositionType } from '../types/question';
import { defaultQuestions } from '../data/questions';

export interface GetQuestionsOptions {
  filter?: {
    category?: QuestionCategory;
    positionType?: PositionType;
    isCustom?: boolean;
  };
  sort?: {
    field: 'importance' | 'difficulty';
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

function generateId(): string {
  return 'custom_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function getQuestions(options?: GetQuestionsOptions): Promise<Question[]> {
  try {
    let questions: Question[] = await questionDB.getAll();

    if (options?.filter) {
      const { filter } = options;
      questions = questions.filter((item) => {
        if (filter.category && item.category !== filter.category) return false;
        if (filter.positionType && item.positionType !== filter.positionType) return false;
        if (filter.isCustom !== undefined && item.isCustom !== filter.isCustom) return false;
        return true;
      });
    }

    if (options?.sort) {
      const { field, direction } = options.sort;
      questions.sort((a, b) => {
        const aVal = a[field] as number;
        const bVal = b[field] as number;
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      });
    }

    if (options?.limit) {
      questions = questions.slice(0, options.limit);
    }

    return questions;
  } catch (error) {
    console.error('Failed to get questions:', error);
    throw error;
  }
}

export async function getQuestionById(id: string): Promise<Question | undefined> {
  try {
    return await questionDB.get(id);
  } catch (error) {
    console.error('Failed to get question by id:', error);
    throw error;
  }
}

export async function createQuestion(
  data: Omit<Question, 'id' | 'isCustom'>
): Promise<Question> {
  try {
    const question: Question = {
      ...data,
      id: generateId(),
      isCustom: true,
    };
    await questionDB.add(question);
    return question;
  } catch (error) {
    console.error('Failed to create question:', error);
    throw error;
  }
}

export async function updateQuestion(
  id: string,
  data: Partial<Omit<Question, 'id'>>
): Promise<Question> {
  try {
    const existing = await questionDB.get(id);
    if (!existing) {
      throw new Error(`Question with id ${id} not found`);
    }
    const updated: Question = {
      ...existing,
      ...data,
      id,
    };
    await questionDB.put(updated);
    return updated;
  } catch (error) {
    console.error('Failed to update question:', error);
    throw error;
  }
}

export async function deleteQuestion(id: string): Promise<void> {
  try {
    await questionDB.delete(id);
  } catch (error) {
    console.error('Failed to delete question:', error);
    throw error;
  }
}

export async function initDefaultQuestions(): Promise<void> {
  try {
    const existing = await questionDB.getAll();
    if (existing.length > 0) {
      return;
    }
    await questionDB.bulkAdd(defaultQuestions);
  } catch (error) {
    console.error('Failed to init default questions:', error);
    throw error;
  }
}
