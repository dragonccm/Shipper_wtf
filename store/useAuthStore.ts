import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Location } from "../types";
import {
  saveAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../storange/auth.storage";
import { API_URL } from "@/constants/config";

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
        try {
          // Clear local storage first
          await removeAccessToken();
          await AsyncStorage.removeItem('auth-storage');
          // Reset state
          set({
            user: null,
            isAuthenticated: false,
            token: null,
          });
          // Try to call logout API, but don't wait for it
          const token = await getAccessToken();
          if (token) {
            fetch(`${API_URL}/api/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            }).catch(error => {
              console.log('Logout API call failed:', error);
              // Ignore API errors since we've already cleared local data
            });
          }

        } catch (error) {
          console.error('Error during logout:', error);
          // Even if there's an error, we still want to clear local data
          await removeAccessToken();
          await AsyncStorage.removeItem('auth-storage');
          set({
            user: null,
            isAuthenticated: false,
            token: null,
          });
        }
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
