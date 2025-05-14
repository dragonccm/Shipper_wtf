import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Location } from "../types";
import {
  saveAccessToken,
  getAccessToken,
  removeAccessToken,
} from "../storange/auth.storage";
import AuthenApiRequest from "@/api/authen.api";


export interface User {
  id: string;
  phoneNumber?: string;
  phone?: string;
  name?: string;
  username?: string;
  email?: string;
  avatar?: string;
  avt?: string;
  role?: string;
  createdAt?: Date;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isVerifying: boolean;
  isNewUser: boolean;
  verificationId: string | null;
  phoneNumber: string | null;
  token?: string | null;

  // Auth actions
  login: (phoneNumber: string, password: string) => Promise<boolean>;
  register: (phoneNumber: string, password: string, name: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  setUser: (user: User) => void;

  // OTP actions
  setPhoneNumber: (phoneNumber: string) => void;
  setVerificationId: (verificationId: string) => void;
  setVerifying: (isVerifying: boolean) => void;
  setIsNewUser: (isNewUser: boolean) => void;
  requestOtp: (phoneNumber: string) => Promise<string>;
  verifyOtp: (otp: string) => Promise<boolean>;
  createPassword: (password: string) => Promise<boolean>;

  // User actions
  updateUserLocation: (location: Location) => void;
  toggleOnlineStatus: () => void;
  updateUserProfile: (userData: Partial<User>) => void;

  passwords: Record<string, string>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      isVerifying: false,
      isNewUser: false,
      verificationId: null,
      phoneNumber: null,
      token: null,
      passwords: {},

      setUser: (user: User) => {
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      // Mock OTP request (in a real app, this would call a backend API)
      checkAuth: async () => {
        set({ isLoading: true });
        try {
          const token = await getAccessToken();
          if (token) {
            const res = await fetch("https://smooth-taxis-rest.loca.lt/api/check-auth", {
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
          const res = await fetch("https://smooth-taxis-rest.loca.lt/api/login_phone", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              valueLogin: phoneNumber,
              password,
            }),
          });

          let data;
          try {
            data = await res.json();
          } catch (parseError) {
            console.error("JSON parse error:", parseError);
            set({ isLoading: false });
            return false;
          }
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
          const res = await fetch("https://smooth-taxis-rest.loca.lt/api/register_phone", {
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

      setPhoneNumber: (phoneNumber) => set({ phoneNumber }),

      setVerificationId: (verificationId) => set({ verificationId }),

      setVerifying: (isVerifying) => set({ isVerifying }),

      setIsNewUser: (isNewUser) => set({ isNewUser }),

      requestOtp: async (phoneNumber) => {
        try {
          const data = await AuthenApiRequest.send(phoneNumber);
          console.log("OTP request data:", data.payload);

          set({
            phoneNumber,
            isVerifying: data.payload.DT,
            isNewUser: !get().user,
          });

          return data.payload;
        } catch (error) {
          console.error("OTP request error:", error);
          throw error;
        }
      },

      verifyOtp: async (otp) => {
        const { phoneNumber } = get();
        if (!phoneNumber) return false;

        try {
          const data = await AuthenApiRequest.verify(phoneNumber, otp);
          console.log("OTP verification data:", data.payload);

          set({
            isVerifying: true,
            isNewUser: true,
          });

          return data.payload.EC === "0";
        } catch (error) {
          console.error("OTP verification error:", error);
          return false;
        }
      },

      createPassword: async (password) => {
        const { phoneNumber } = get();
        if (!phoneNumber) return false;

        function normalizePhoneNumber(phoneNumber: string): string {
          let cleaned = phoneNumber.replace(/^\+/, "");
          if (cleaned.startsWith("84")) {
            cleaned = "0" + cleaned.slice(2);
          }
          return cleaned;
        }

        try {
          const normalizedPhone = normalizePhoneNumber(phoneNumber);
          const registerData = await AuthenApiRequest.register(normalizedPhone, password);

          if (registerData.payload.EC !== "0") return false;

          const loginData = await AuthenApiRequest.login(normalizedPhone, password);
          if (loginData.payload.EC !== "0" || !loginData.payload.DT.access_token) return false;

          set({
            user: loginData.payload.DT.account,
            isAuthenticated: true,
            isVerifying: false,
            verificationId: null,
          });

          await saveAccessToken(loginData.payload.DT.access_token);
          return true;
        } catch (error) {
          console.error("Create password error:", error);
          return false;
        }
      },

      updateUserProfile: (userData) => {
        const { user } = get();
        if (user) {
          set({
            user: {
              ...user,
              ...userData,
            },
          });
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
