import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    // Parameter name changed for clarity (optional)
    login: (userData: User | null, accessToken: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      // Use the new parameter name (optional)
      login: (userData, accessToken) => {
        // Store the actual token
        localStorage.setItem('auth_token', accessToken);
        // If userData is null here, user info will be populated later
        // when /users/me is fetched successfully.
        set({ user: userData, token: accessToken, isAuthenticated: true });
      },
      logout: () => {
         localStorage.removeItem('auth_token');
         set({ user: null, token: null, isAuthenticated: false });
       },
    }),
    { name: 'auth-storage' }
  )
);
