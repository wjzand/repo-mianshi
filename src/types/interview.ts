export type InterviewResult = 'pass' | 'pending' | 'fail';
export type InterviewMethod = 'onsite' | 'phone' | 'video';
export type InterviewerRole = 'hr' | 'tech' | 'manager';
export type MoodType = 'good' | 'neutral' | 'bad';
export type TagType = 'strength' | 'weakness';

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  rating: number;
  feedback: string;
  category: string;
}

export interface AnalysisTag {
  id: string;
  type: TagType;
  content: string;
}

export interface Interview {
  id: string;
  company: string;
  position: string;
  round: string;
  interviewDate: string;
  interviewMethod: InterviewMethod;
  interviewerRoles: InterviewerRole[];
  result: InterviewResult;
  duration: number;
  overallRating: number;
  mood: MoodType;
  notes: string;
  questions: InterviewQuestion[];
  strengths: AnalysisTag[];
  weaknesses: AnalysisTag[];
  improvements: string;
  createdAt: string;
  updatedAt: string;
}

export interface AbilityScores {
  technical: number;
  communication: number;
  logic: number;
  project: number;
  pressure: number;
  match: number;
}

export interface InterviewStats {
  total: number;
  passRate: number;
  avgRating: number;
  passCount: number;
  pendingCount: number;
  failCount: number;
}

export interface AbilityTrend {
  early: AbilityScores;
  recent: AbilityScores;
}

export interface TopQuestion {
  title: string;
  count: number;
}
