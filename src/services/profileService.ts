import { profileDB } from './db';
import type { UserProfile, JobStatus } from '../types/profile';

export function getDefaultProfile(): UserProfile {
  return {
    id: 'default',
    jobStatus: 'actively_looking' as JobStatus,
    targetPosition: '',
    targetIndustry: '',
    voiceEnabled: true,
    notificationEnabled: true,
    lastInterviewDate: null,
  };
}

export async function getProfile(): Promise<UserProfile | undefined> {
  try {
    const profile = await profileDB.get('default');
    return profile;
  } catch (error) {
    console.error('Failed to get profile:', error);
    throw error;
  }
}

export async function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  try {
    const existing = await profileDB.get('default');
    const defaultProfile = getDefaultProfile();
    const updated: UserProfile = {
      ...defaultProfile,
      ...existing,
      ...data,
      id: 'default',
    };
    await profileDB.put(updated);
    return updated;
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
}
