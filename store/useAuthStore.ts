import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Location } from "../types";
import {
  saveAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../storange/auth.storage";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token?: string | null;

  // Auth actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => Promise<void>;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  logout: () => Promise<void>;

  // User actions
  updateUserLocation: (location: Location) => void;
  toggleOnlineStatus: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      token: null,

      setUser: (user) => set({ user }),
      setToken: async (token) => {
        if (token) {
          await saveAccessToken(token);
        } else {
          await removeAccessToken();
        }
        set({ token });
      },
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setLoading: (isLoading) => set({ isLoading }),

      logout: async () => {
        await removeAccessToken();
        set({
          user: null,
          isAuthenticated: false,
          token: null,
        });
      },

      updateUserLocation: (location: Location) => {
        set((state) => ({
          user: state.user ? { ...state.user, location } : null,
        }));
      },

      toggleOnlineStatus: () => {
        set((state) => ({
          user: state.user
            ? { ...state.user, isOnline: !state.user.isOnline }
            : null,
        }));
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
