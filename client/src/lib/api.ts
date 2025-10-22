// src/lib/api.ts
import axios from 'axios';
// No longer need useAuthStore here for getting the token initially
// import { useAuthStore } from '@/modules/auth/authStore';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
console.log(`API Base URL set to: ${apiBaseUrl}`);

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // --- CHANGE: Read directly from localStorage ---
    const token = localStorage.getItem('auth_token');
    // --- END CHANGE ---

    console.log("Interceptor: Token from localStorage:", token ? `${token.substring(0, 10)}...` : 'No Token'); // Updated log source

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("Interceptor: Attaching Auth header:", config.headers.Authorization ? 'Yes' : 'No');
    } else {
       console.log("Interceptor: No token found, Auth header not set.");
    }
    console.log(`Making request to: ${config.baseURL}${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - IMPORTANT: Keep using Zustand for logout
// Import useAuthStore here specifically for the response interceptor
import { useAuthStore } from '@/modules/auth/authStore';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Still use Zustand's logout action for consistency and clearing state
      useAuthStore.getState().logout();
      console.error("Unauthorized request (401). Logging out via Zustand.");
    }
    console.error("API Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;