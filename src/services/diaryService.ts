import { diaryDB } from './db';
import { DiaryEntry } from '../types/diary';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export async function getDiaryEntries(): Promise<DiaryEntry[]> {
  try {
    const entries = await diaryDB.getAll();
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Failed to get diary entries:', error);
    throw error;
  }
}

export async function createDiaryEntry(
  data: Omit<DiaryEntry, 'id'>
): Promise<DiaryEntry> {
  try {
    const entry: DiaryEntry = {
      ...data,
      id: generateId(),
    };
    await diaryDB.add(entry);
    return entry;
  } catch (error) {
    console.error('Failed to create diary entry:', error);
    throw error;
  }
}

export async function deleteDiaryEntry(id: string): Promise<void> {
  try {
    await diaryDB.delete(id);
  } catch (error) {
    console.error('Failed to delete diary entry:', error);
    throw error;
  }
}
