import type { MoodType } from './interview';

export type DiaryType = 'interview' | 'note';

export interface DiaryEntry {
  id: string;
  type: DiaryType;
  interviewId?: string;
  content: string;
  mood?: MoodType;
  date: string;
}
