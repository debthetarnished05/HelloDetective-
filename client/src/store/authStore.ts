import { create } from 'zustand';
import type { IUser, DetectiveRank } from '../types/auth';
import { authApi, setAccessToken, getAccessToken } from '../api/client';

interface AuthState {
  user: IUser | null;
  accessToken: string | null;
  isGuest: boolean;
  isLoading: boolean;
  authModalOpen: boolean;
  profileModalOpen: boolean;
  authModalInitialTab: 'login' | 'register';
  authModalMessage: string | null;

  // Actions
  openAuthModal: (tab?: 'login' | 'register', message?: string) => void;
  closeAuthModal: () => void;
  openProfileModal: () => void;
  closeProfileModal: () => void;
  setUser: (user: IUser | null) => void;
  initAuth: () => Promise<void>;
  login: (identifier: string, password: string, guestSessionId?: string) => Promise<void>;
  register: (username: string, email: string, password: string, guestSessionId?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserStatsAndBadges: (updates: { userRank?: DetectiveRank; newBadges?: string[]; userStats?: any }) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: getAccessToken(),
  isGuest: true,
  isLoading: true,
  authModalOpen: false,
  profileModalOpen: false,
  authModalInitialTab: 'login',
  authModalMessage: null,

  openAuthModal: (tab = 'login', message) =>
    set({
      authModalOpen: true,
      authModalInitialTab: tab,
      authModalMessage: message || null
    }),

  closeAuthModal: () =>
    set({
      authModalOpen: false,
      authModalMessage: null
    }),

  openProfileModal: () => set({ profileModalOpen: true }),
  closeProfileModal: () => set({ profileModalOpen: false }),

  setUser: (user) =>
    set({
      user,
      isGuest: !user
    }),

  initAuth: async () => {
    set({ isLoading: true });
    try {
      const token = getAccessToken();
      if (token) {
        try {
          const user = await authApi.getMe();
          set({ user, isGuest: false, accessToken: token, isLoading: false });
          return;
        } catch (meErr: any) {
          // Token may have expired, try refresh
          try {
            const refreshRes = await authApi.refresh();
            const user = await authApi.getMe();
            set({ user, isGuest: false, accessToken: refreshRes.accessToken, isLoading: false });
            return;
          } catch (refErr) {
            setAccessToken(null);
          }
        }
      }
      set({ user: null, isGuest: true, accessToken: null, isLoading: false });
    } catch (err) {
      set({ user: null, isGuest: true, accessToken: null, isLoading: false });
    }
  },

  login: async (identifier, password, guestSessionId) => {
    set({ isLoading: true });
    try {
      const data = await authApi.login(identifier, password, guestSessionId);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isGuest: false,
        isLoading: false,
        authModalOpen: false
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  register: async (username, email, password, guestSessionId) => {
    set({ isLoading: true });
    try {
      const data = await authApi.register(username, email, password, guestSessionId);
      set({
        user: data.user,
        accessToken: data.accessToken,
        isGuest: false,
        isLoading: false,
        authModalOpen: false
      });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authApi.logout();
    } finally {
      set({
        user: null,
        accessToken: null,
        isGuest: true,
        isLoading: false,
        profileModalOpen: false
      });
    }
  },

  updateUserStatsAndBadges: ({ userRank, userStats }) => {
    const currentUser = get().user;
    if (!currentUser) return;
    set({
      user: {
        ...currentUser,
        rank: userRank || currentUser.rank,
        stats: userStats || currentUser.stats
      }
    });
  }
}));
