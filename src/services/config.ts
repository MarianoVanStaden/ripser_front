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
    // Use consistent token storage key
    const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
    const empresaId = localStorage.getItem('empresaId');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Attaching token to request:', token.substring(0, 20) + '...', config.url);
    }

    // Add X-Empresa-Id header for multi-tenant support (backend expects this header)
    if (empresaId) {
      config.headers['X-Empresa-Id'] = empresaId;
      console.log('Attaching X-Empresa-Id to request:', empresaId);
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
      const { status, data } = error.response;
      
      // Log detailed error information
      console.error('❌ Server error:', {
        status,
        message: data.message || data.error,
        details: data.details || data,
      });
      
      // Handle specific status codes
      switch (status) {
        case 401:
          // Clear all authentication data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_refresh_token');
          localStorage.removeItem('auth_user');
          localStorage.removeItem('empresaId');
          localStorage.removeItem('sucursalId');
          localStorage.removeItem('esSuperAdmin');
          window.location.href = '/login';
          break;
        case 409:
          console.warn('⚠️ Conflicto de negocio:', data.message || 'Operación rechazada por el servidor');
          break;
        case 500:
          // Check for database integrity errors
          if (data.message?.includes('More than one row with the given identifier')) {
            console.error('💥 Error de integridad de datos:', 
              'Hay registros duplicados en la base de datos. Contacta al administrador del sistema.');
          } else {
            console.error('💥 Error interno del servidor:', data.message);
          }
          break;
      }
    } else if (error.request) {
      console.error('❌ Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);