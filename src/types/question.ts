export type QuestionCategory = 'behavior' | 'technical' | 'hr' | 'case';

export type PositionType = 'frontend' | 'backend' | 'product' | 'operation' | 'design';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface Question {
  id: string;
  title: string;
  answer: string;
  category: QuestionCategory;
  positionType: PositionType;
  difficulty: DifficultyLevel;
  isCustom: boolean;
  importance: 1 | 2 | 3 | 4 | 5;
  tags: string[];
}
