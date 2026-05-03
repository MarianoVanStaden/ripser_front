import axios from 'axios';
import { authApi } from './authApi';
import { logger } from '../utils/logger';

// In-memory token reference (faster than hitting localStorage every time)
let authToken: string | null = null;
let printedJwtInfo = false;

// Decode JWT payload (no verification) for debugging/diagnostics
const decodeJwtPayload = (token: string): any | null => {
  try {
    const base64 = token.split('.')[1];
    const json = atob(base64.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
};

// Helper to set/clear token from outside (AuthContext)
export const setAuthToken = (token: string | null) => {
  authToken = token;
};

// Create axios instance with default configuration
// Resolve base URL: empty string for relative URLs (works with Nginx proxy)
// In production with Nginx, requests to /api/* are proxied to the backend
const rawBase = import.meta.env.DEV
  ? ''
  : (import.meta.env.VITE_API_BASE_URL ?? '');
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

// Request interceptor: attach Authorization header and X-Empresa-Id if token exists
api.interceptors.request.use(
  (config) => {
    const token = authToken || localStorage.getItem('auth_token');
    const empresaId = sessionStorage.getItem('empresaId');

    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
      logger.log('🔑 Attaching token to request:', token.substring(0, 10) + '...', config.url);
      if (!printedJwtInfo) {
        const payload = decodeJwtPayload(token);
        if (payload) {
          const roles = payload.roles || payload.authorities || payload.scope || payload.scopes;
          logger.log('[JWT Payload]', {
            sub: payload.sub || payload.username || payload.user_name,
            roles,
            empresaId: payload.empresaId || payload.empresa_id || 'NOT IN TOKEN',
            sucursalId: payload.sucursalId || payload.sucursal_id || 'NOT IN TOKEN',
            exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : undefined,
          });
        }
        printedJwtInfo = true;
      }
    } else {
      logger.warn('No token available for request:', config.url);
    }

    // Attach X-Empresa-Id header for multi-tenant support (required after tenant selection)
    // Some endpoints don't require tenant context (auth, empresa selection, etc.)
    const urlPath = config.url || '';
    const endpointsWithoutTenant = [
      '/api/auth/',
      '/api/empresas',
      '/api/admin/empresas',
      '/api/select-tenant',
      '/api/usuario-empresa/',
      '/api/sucursales/activas'
    ];
    const requiresTenant = !endpointsWithoutTenant.some(ep => urlPath.includes(ep));
    
    if (empresaId) {
      config.headers = config.headers || {};
      (config.headers as any)['X-Empresa-Id'] = empresaId;
      logger.log('🏢 Attaching X-Empresa-Id:', empresaId, 'to request:', config.url);
    } else if (requiresTenant) {
      // Only warn for endpoints that actually need tenant context
      logger.warn('⚠️ No empresaId in localStorage for request:', config.url);
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
      logger.log('🔄 Access token expired, attempting refresh...');
      originalRequest._retry = true;

      try {
        const storedRefresh = localStorage.getItem('auth_refresh_token');
        if (!storedRefresh) {
          logger.error('❌ No refresh token available');
          throw new Error('No refresh token');
        }

        logger.log('📡 Calling refresh endpoint...');
        const refreshRes = await authApi.refresh(storedRefresh);
        const newAccess = refreshRes.accessToken;

        if (!newAccess) {
          logger.error('❌ No access token in refresh response');
          throw new Error('No access token in refresh response');
        }

        logger.log('✅ Token refreshed successfully');

        // Persist & set new tokens
        localStorage.setItem('auth_token', newAccess);
        setAuthToken(newAccess);

        if (refreshRes.refreshToken) {
          localStorage.setItem('auth_refresh_token', refreshRes.refreshToken);
          logger.log('🔄 Refresh token also updated');
        }

        // Reset the printed JWT info flag to log the new token info
        printedJwtInfo = false;

        // Update header & retry original request
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;

        logger.log('🔁 Retrying original request with new token...');
        return api(originalRequest);
      } catch (refreshErr) {
        logger.error('❌ Token refresh failed:', refreshErr);
        
        // Clear tokens & redirect to login page
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        setAuthToken(null);
        printedJwtInfo = false;
        // ❌ DON'T clear empresaId/sucursalId/esSuperAdmin on refresh failure!
        // Let the user re-login and preserve their context selection

        if (window.location.pathname !== '/login') {
          logger.log('🚪 Redirecting to login page...');
          window.location.href = '/login';
        }

        return Promise.reject(refreshErr);
      }
    }

    // Handle other 401 errors (invalid token, etc.)
    // 🔥 FIX: Don't clear empresaId/sucursalId on auth errors during validation
    // to preserve SuperAdmin context selection across token refreshes
    if (
      status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes('/auth/refresh') &&
      !originalRequest?.url?.includes('/auth/login')
    ) {
      logger.warn('⚠️ Unauthorized request, clearing session...');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_refresh_token');
      localStorage.removeItem('auth_user');
      setAuthToken(null);
      // ❌ DON'T clear empresaId/sucursalId/esSuperAdmin here!
      // Let the user re-login and preserve their context selection

      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    if (status === 500) {
      logger.error('❌ Server error:', error.response?.data);
    }
    
    return Promise.reject(error);
  }
);

export default api;
