import axios from 'axios';
import { authApi } from './authApi';

// In-memory token reference (faster than hitting localStorage every time)
let authToken: string | null = null;
let printedJwtInfo = false;

// Helper to set/clear token from outside (AuthContext)
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Create axios instance with default configuration
// Resolve base URL and ensure it ends with /api for consistency
const rawBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/RipserApp'; 
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
    const errorCode = error.response?.data?.error;

    // Check if it's a token expiration error (401 with error code "token_expired")
    if (
      status === 401 &&
      errorCode === 'token_expired' &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/refresh')
    ) {
      console.log('🔄 Access token expired, attempting refresh...');
      originalRequest._retry = true;
      
      try {
        const storedRefresh = localStorage.getItem('auth_refresh_token');
        if (!storedRefresh) {
          console.error('❌ No refresh token available');
          throw new Error('No refresh token');
        }
        
        console.log('📡 Calling refresh endpoint...');
        const refreshRes = await authApi.refresh(storedRefresh);
        const newAccess = refreshRes.accessToken;
        
        if (!newAccess) {
          console.error('❌ No access token in refresh response');
          throw new Error('No access token in refresh response');
        }
        
        console.log('✅ Token refreshed successfully');
        
        // Persist & set new tokens
        localStorage.setItem('auth_token', newAccess);
        setAuthToken(newAccess);
        
        if (refreshRes.refreshToken) {
          localStorage.setItem('auth_refresh_token', refreshRes.refreshToken);
          console.log('🔄 Refresh token also updated');
        }
        
        // Reset the printed JWT info flag to log the new token info
        printedJwtInfo = false;
        
        // Update header & retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        
        console.log('🔁 Retrying original request with new token...');
        return api(originalRequest);
      } catch (refreshErr) {
        console.error('❌ Token refresh failed:', refreshErr);
        
        // Clear tokens & redirect to login page
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        setAuthToken(null);
        printedJwtInfo = false;
        
        if (window.location.pathname !== '/login') {
          console.log('🚪 Redirecting to login page...');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshErr);
      }
    }

    // Handle other 401 errors (invalid token, etc.)
    if (
      status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/refresh') &&
      !originalRequest?.url?.includes('/auth/login')
    ) {
      console.warn('⚠️ Unauthorized request, clearing session...');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
      setAuthToken(null);
      
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (status === 500) {
      console.error('❌ Server error:', error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
