import { interviewDB } from './db';
import type { Interview } from '../types/interview';

export interface GetInterviewsOptions {
  filter?: Partial<Pick<Interview, 'company' | 'position' | 'result'>>;
  sort?: {
    field: 'interviewDate' | 'createdAt' | 'overallRating';
    direction: 'asc' | 'desc';
  };
  limit?: number;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function getInterviews(options?: GetInterviewsOptions): Promise<Interview[]> {
  try {
    let interviews: Interview[] = await interviewDB.getAll();

    if (options?.filter) {
      const { filter } = options;
      interviews = interviews.filter((item) => {
        if (filter.company && !item.company.includes(filter.company)) return false;
        if (filter.position && !item.position.includes(filter.position)) return false;
        if (filter.result && item.result !== filter.result) return false;
        return true;
      });
    }

    if (options?.sort) {
      const { field, direction } = options.sort;
      interviews.sort((a, b) => {
        const aVal = a[field];
        const bVal = b[field];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return direction === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return direction === 'asc'
          ? (aVal as number) - (bVal as number)
          : (bVal as number) - (aVal as number);
      });
    } else {
      interviews.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }

    if (options?.limit) {
      interviews = interviews.slice(0, options.limit);
    }

    return interviews;
  } catch (error) {
    console.error('Failed to get interviews:', error);
    throw error;
  }
}

export async function getInterviewById(id: string): Promise<Interview | undefined> {
  try {
    return await interviewDB.get(id);
  } catch (error) {
    console.error('Failed to get interview by id:', error);
    throw error;
  }
}

export async function createInterview(
  data: Omit<Interview, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Interview> {
  try {
    const now = new Date().toISOString();
    const interview: Interview = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    };
    await interviewDB.add(interview);
    return interview;
  } catch (error) {
    console.error('Failed to create interview:', error);
    throw error;
  }
}

export async function updateInterview(
  id: string,
  data: Partial<Omit<Interview, 'id' | 'createdAt'>>
): Promise<Interview> {
  try {
    const existing = await interviewDB.get(id);
    if (!existing) {
      throw new Error(`Interview with id ${id} not found`);
    }
    const updated: Interview = {
      ...existing,
      ...data,
      id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await interviewDB.put(updated);
    return updated;
  } catch (error) {
    console.error('Failed to update interview:', error);
    throw error;
  }
}

export async function deleteInterview(id: string): Promise<void> {
  try {
    await interviewDB.delete(id);
  } catch (error) {
    console.error('Failed to delete interview:', error);
    throw error;
  }
}

export async function clearAllInterviews(): Promise<void> {
  try {
    await interviewDB.clear();
  } catch (error) {
    console.error('Failed to clear all interviews:', error);
    throw error;
  }
}
