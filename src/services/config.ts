import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const tenantId = localStorage.getItem('tenantId') || localStorage.getItem('empresaId');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Attaching token to request:', token.substring(0, 20) + '...', config.url);
    }
    
    // Add tenant ID header if available
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
      console.log('Attaching tenant ID to request:', tenantId);
    } else {
      console.warn('⚠️ No tenant ID found in localStorage!');
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.error('❌ Server error:', error.response.data);
      
      // Handle unauthorized errors
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      console.error('❌ Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);