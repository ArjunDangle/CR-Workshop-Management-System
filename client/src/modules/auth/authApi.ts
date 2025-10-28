// src/modules/auth/authApi.ts
import api from '@/lib/api';
// --- Make sure this User type matches the one in authStore.ts ---
import type { User } from './authStore';
// ---

interface LoginCredentials {
  email: string;
  password: string;
}

// Response from /auth/token
interface LoginResponse {
  // User object is NOT returned by /auth/token, so keep it optional or remove
  user?: User | null;
  access_token: string;
  token_type: string;
}

export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await api.post<LoginResponse>('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    // Return the response containing access_token and token_type
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) {
      throw new Error(error.response.data.detail);
    }
    throw new Error('Invalid credentials or server error. Please try again.');
  }
};

// Response from /auth/users/me *does* return the User object
export const getCurrentUserProfile = async (): Promise<User> => {
  try {
    // Ensure the response type matches the User interface in authStore
    const response = await api.get<User>('/auth/users/me');
    return response.data; // This should include the nested role object
  } catch (error: any) {
     console.error("Failed to fetch user profile:", error);
     if (error.response?.data?.detail) {
       throw new Error(error.response.data.detail);
     }
     throw new Error('Failed to fetch user profile. Please try logging in again.');
  }
};