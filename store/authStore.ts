import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Location } from "../types";
import {
  saveAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../storange/auth.storage";

// In ra console toàn bộ request và response
const logRequestResponse = async (request: string, response: any) => {
  console.log("Request:", request);
  console.log("Response:", response);
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token?: string | null;

  // Auth actions
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  register: (phoneNumber: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setUser: (user: User) => void;

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

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const token = await getAccessToken();
          if (token) {
            const res = await fetch("  https://665c-14-240-55-19.ngrok-free.app/api/check-auth", {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
            // Check if the response is succes
            const data = await res.json();
            console.log("checkAuth response:", data);

            if (data.EC === "0" && data.DT) {
              set({
                user: data.DT,
                isAuthenticated: true,
                isLoading: false,
                token,
              });
              return true;
            }
          }
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            token: null,
          });
          return false;
        } catch (error) {
          console.error("checkAuth error:", error);
          set({ isLoading: false });
          return false;
        }
      },

      login: async (phoneNumber: string, password: string) => {
        console.log("Attempting login with:", { phoneNumber });
        set({ isLoading: true });
        try {
          const res = await fetch("  https://665c-14-240-55-19.ngrok-free.app", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              valueLogin: phoneNumber,
              password,
            }),
          });

          const data = await res.json();
          console.log("Login response:", data);

          if (data.EC === "0" && data.DT) {
            await saveAccessToken(data.DT.access_token);
            set({
              user: data.DT.account,
              isAuthenticated: true,
              isLoading: false,
              token: data.DT.access_token,
            });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error("login error:", error);
          set({ isLoading: false });
          return false;
        }
      },

      register: async (phoneNumber: string, password: string, name: string) => {
        console.log("Attempting register with:", { phoneNumber, name });
        set({ isLoading: true });
        try {
          const res = await fetch("  https://665c-14-240-55-19.ngrok-free.app/api/register_phone", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phone: phoneNumber,
              password,
              name,
            }),
          });

          const data = await res.json();
          console.log("Register response:", data);

          if (data.EC === "0" && data.DT) {
            await saveAccessToken(data.DT.access_token);
            set({
              user: data.DT.account,
              isAuthenticated: true,
              isLoading: false,
              token: data.DT.access_token,
            });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          console.error("register error:", error);
          set({ isLoading: false });
          return false;
        }
      },

      logout: async () => {
        try {
          const token = await getAccessToken();
          if (token) {
            await fetch("  https://665c-14-240-55-19.ngrok-free.app/api/logout", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
          }
          await removeAccessToken();
          set({
            user: null,
            isAuthenticated: false,
            token: null,
          });
        } catch (error) {
          console.error("logout error:", error);
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
