import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { persist, createJSONStorage } from "zustand/middleware";
import { User, Location } from "@/types";
import { mockUser } from "@/mocks/user";

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
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            // For demo, accept any credentials
            if (email && password) {
              set({ 
                user: mockUser,
                isAuthenticated: true,
                isLoading: false
              });
              resolve(true);
            } else {
              set({ isLoading: false });
              resolve(false);
            }
          }, 1000);
        });
      },
      
      register: async (name: string, email: string, phone: string, password: string) => {
        set({ isLoading: true });
        
        // Simulate API call
        return new Promise<boolean>((resolve) => {
          setTimeout(() => {
            if (name && email && phone && password) {
              const newUser: User = {
                ...mockUser,
                name,
                email,
                phone
              };
              
              set({ 
                user: newUser,
                isAuthenticated: true,
                isLoading: false
              });
              resolve(true);
            } else {
              set({ isLoading: false });
              resolve(false);
            }
          }, 1000);
        });
      },
      
      logout: () => {
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