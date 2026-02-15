import { User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../../app/utils/supabase';

// Define the shape of the profile
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  role: 'user' | 'admin';
  plan?: string | null;
  created_at?: string | null;
}

interface UserAuthStore {
  isLoggedIn: boolean;
  user: User | null;
  profile: UserProfile | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  login: (user: User, profile: UserProfile) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearAuth: () => void;
}

const useUserAuthStore = create(
  persist<UserAuthStore>(
    (set, get) => ({
      isLoggedIn: false,
      user: null,
      profile: null,

      setUser: (user) => set({ user, isLoggedIn: !!user }),

      setProfile: (profile) => set({ profile }),

      login: (user, profile) => {
        set({
          isLoggedIn: true,
          user,
          profile,
        });
      },

      logout: async () => {
        set({ isLoggedIn: false, user: null, profile: null });
        await supabase.auth.signOut();
      },

      refreshProfile: async () => {
        const currentUser = get().user;
        if (!currentUser) return;

        try {
          // Use server-side API to hide DB calls and logic
          const res = await fetch('/api/profile');
          const data = await res.json();

          if (data.success && data.user) {
            set({ profile: data.user as UserProfile });
          } else {
            console.error('UserAuthStore: Failed to refresh profile', data.error);
          }
        } catch (err) {
          console.error('UserAuthStore: Error refreshing profile', err);
        }
      },

      clearAuth: () => set({ isLoggedIn: false, user: null, profile: null }),
    }),
    {
      name: 'user-auth-storage',
      partialize: (state) =>
        ({
          isLoggedIn: state.isLoggedIn,
          user: state.user,
          profile: state.profile,
        }) as any,
    }
  )
);

export default useUserAuthStore;
