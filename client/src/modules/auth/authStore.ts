// src/modules/auth/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Define the structure for the nested Role object (matching backend RoleRead)
interface Role {
  id: string; // Assuming UUIDs are strings in frontend
  name: string;
  description?: string | null;
  parent_id?: string | null;
  // Add other fields from RoleRead if needed
}

// Define the User structure matching backend UserPublic
export interface User {
  id: string; // Assuming UUIDs are strings in frontend
  email: string;
  full_name?: string | null;
  is_active: boolean;
  role: Role; // Nested Role object
  // Add avatarUrl if you plan to use it
  avatarUrl?: string;
}

// Define the state structure
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (userData: User | null, accessToken: string) => void; // Accepts token and optional user
  logout: () => void;
  setUser: (userData: User) => void; // Action to update user details later
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({ // Add get() to access current state if needed
      user: null,
      token: null,
      isAuthenticated: false,

      // Login action: stores token, sets isAuthenticated, stores initial user data (if provided)
      login: (userData, accessToken) => {
        localStorage.setItem('auth_token', accessToken); // Keep explicit localStorage set for interceptor
        set({
          user: userData, // Store user data passed (might be null initially)
          token: accessToken,
          isAuthenticated: true
        });
        console.log("AuthStore: Logged in. Token stored.");
      },

      // Logout action: clears token, user, and auth status
      logout: () => {
         localStorage.removeItem('auth_token'); // Clear explicit localStorage item
         set({
           user: null,
           token: null,
           isAuthenticated: false
         });
         console.log("AuthStore: Logged out.");
         // Optionally clear other related storage if needed
      },

      // Action to update user details after fetching from /users/me
      setUser: (userData: User) => {
          set((state) => {
              // Only update if currently authenticated to avoid potential issues
              if (state.isAuthenticated) {
                  console.log("AuthStore: Updating user data.", userData);
                  return { user: userData };
              }
              return {}; // No change if not authenticated
          });
      },

    }),
    {
      name: 'auth-storage', // name of the item in localStorage
      // We only *really* need to persist the token.
      // The user object could be rehydrated from /users/me on load if needed,
      // but persisting both is common for quicker initial load.
      // partialize: (state) => ({ token: state.token }), // Example: only persist token
    }
  )
);

// Optional: Function to call on initial app load to potentially set user data
// if token exists but user state is empty (e.g., after browser refresh)
// This requires fetching from /users/me
/*
export const rehydrateAuth = async () => {
    const { token, user, setUser } = useAuthStore.getState();
    if (token && !user) {
        try {
            console.log("Rehydrating user data...");
            // Need getCurrentUserProfile import here
            // const profile = await getCurrentUserProfile();
            // setUser(profile);
        } catch (error) {
            console.error("Failed to rehydrate user data:", error);
            // Maybe logout if token is invalid?
            // useAuthStore.getState().logout();
        }
    }
};
*/