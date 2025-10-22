// src/modules/auth/authApi.ts
import api from '@/lib/api';
import type { User } from './authStore'; // Import User type from authStore

interface LoginCredentials {
  email: string;
  password: string;
}

interface LoginResponse {
  user?: User; // Make user optional as /token endpoint doesn't return it
  access_token: string; // <-- Change 'token' to 'access_token'
  token_type: string; // Add token_type if needed elsewhere
}

// Keep the existing loginUser function
export const loginUser = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  try {
    // NOTE: FastAPI's OAuth2PasswordRequestForm expects 'username' and 'password'
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await api.post<LoginResponse>('/auth/token', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  } catch (error: any) {
    if (error.response?.data?.detail) { // FastAPI often uses 'detail' for errors
      throw new Error(error.response.data.detail);
    }
    // Fallback error message
    throw new Error('Invalid credentials or server error. Please try again.');
  }
};


// --- Add this new function ---
export const getCurrentUserProfile = async (): Promise<User> => {
  try {
    // GET request to the protected endpoint
    const response = await api.get<User>('/auth/users/me');
    return response.data;
  } catch (error: any) {
     // Handle errors, e.g., token expired, network issue
     console.error("Failed to fetch user profile:", error);
     if (error.response?.data?.detail) {
       throw new Error(error.response.data.detail);
     }
     throw new Error('Failed to fetch user profile. Please try logging in again.');
  }
};
// --- End of new function ---