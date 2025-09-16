import axios from 'axios';
import { authApi } from './authApi';

// In-memory token reference (faster than hitting localStorage every time)
let authToken: string | null = null;

// Helper to set/clear token from outside (AuthContext)
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Create axios instance with default configuration
// Resolve base URL and ensure it ends with /api for consistency
const rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:8080/RipserApp');
const normalizedBase = /^https?:\/\//.test(rawBase)
  ? rawBase.replace(/\/$/, '')
  : rawBase;

const api = axios.create({
  baseURL: normalizedBase,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach Authorization header if token exists
api.interceptors.request.use(
  (config) => {
    const token = authToken || localStorage.getItem('auth_token');
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
      console.log('Attaching token to request:', token.substring(0, 10) + '...', config.url);
    } else {
      console.warn('No token available for request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest: any = error.config;
    const status = error.response?.status;

    // Attempt silent refresh on 401/403 (excluding refresh endpoint itself)
    if (
      (status === 401 || status === 403) &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const storedRefresh = localStorage.getItem('auth_refresh_token');
        if (!storedRefresh) throw new Error('No refresh token');
        const refreshRes = await authApi.refresh(storedRefresh);
        const newAccess = refreshRes.accessToken;
        if (!newAccess) throw new Error('No access token in refresh response');
        // Persist & set new tokens
        localStorage.setItem('auth_token', newAccess);
        setAuthToken(newAccess);
        if (refreshRes.refreshToken) {
          localStorage.setItem('auth_refresh_token', refreshRes.refreshToken);
        }
        // Update header & retry
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('Token refresh failed:', refreshErr);
        // Clear tokens & redirect to login page
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        setAuthToken(null);
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      }
    }

    if (status === 500) {
      console.error('Server error');
    }
    return Promise.reject(error);
  }
);

export default api;
