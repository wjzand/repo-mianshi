export type JobStatus = 'actively_looking' | 'watching' | 'hired';

export interface UserProfile {
  id: string;
  jobStatus: JobStatus;
  targetPosition: string;
  targetIndustry: string;
  voiceEnabled: boolean;
  notificationEnabled: boolean;
  lastInterviewDate: string;
}
