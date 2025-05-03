import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Location } from "@/types";
import { authAPI } from "@/services/api";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, phone: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUserLocation: (location: Location) => void;
  toggleOnlineStatus: () => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      checkAuth: async () => {
        set({ isLoading: true });
        
        try {
          const { isAuthenticated, user } = await authAPI.checkAuth();
          
          if (isAuthenticated && user) {
            set({ 
              user,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          } else {
            set({ 
              user: null,
              isAuthenticated: false,
              isLoading: false
            });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const result = await authAPI.login(email, password);
          
          if (result.success && result.user) {
            set({ 
              user: result.user,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
      
      register: async (name: string, email: string, phone: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const result = await authAPI.register(name, email, phone, password);
          
          if (result.success && result.user) {
            set({ 
              user: result.user,
              isAuthenticated: true,
              isLoading: false
            });
            return true;
          } else {
            set({ isLoading: false });
            return false;
          }
        } catch (error) {
          set({ isLoading: false });
          return false;
        }
      },
      
      logout: async () => {
        await authAPI.logout();
        set({ 
          user: null,
          isAuthenticated: false
        });
      },
      
      updateUserLocation: (location: Location) => {
        const { user } = get();
        
        if (user) {
          set({ 
            user: { 
              ...user, 
              currentLocation: location 
            } 
          });
        }
      },
      
      toggleOnlineStatus: () => {
        const { user } = get();
        
        if (user) {
          set({ 
            user: { 
              ...user, 
              isOnline: !user.isOnline 
            } 
          });
        }
      }
    }),
    {
      name: "shipper-auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
);