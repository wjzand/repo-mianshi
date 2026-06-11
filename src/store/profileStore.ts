import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/types/profile';
import {
  getProfile,
  updateProfile as updateProfileService,
  getDefaultProfile,
} from '@/services/profileService';

interface ProfileState {
  profile: UserProfile;
  loading: boolean;

  setProfile: (profile: UserProfile) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  loadProfile: () => Promise<void>;
  saveProfile: () => Promise<void>;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: getDefaultProfile(),
      loading: false,

      setProfile: (profile) => set({ profile }),

      updateProfile: (data) =>
        set((state) => ({
          profile: { ...state.profile, ...data },
        })),

      loadProfile: async () => {
        set({ loading: true });
        try {
          const profile = await getProfile();
          if (profile) {
            set({ profile, loading: false });
          } else {
            set({ profile: getDefaultProfile(), loading: false });
          }
        } catch {
          set({ loading: false });
        }
      },

      saveProfile: async () => {
        const { profile } = get();
        try {
          const updated = await updateProfileService(profile);
          set({ profile: updated });
        } catch {
          // persist middleware will save to localStorage as fallback
        }
      },
    }),
    {
      name: 'profile-store',
    }
  )
);
