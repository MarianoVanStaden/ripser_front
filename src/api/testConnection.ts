import api from './config';

// Test connection to backend using a simple endpoint (e.g., /api/productos)
export const testConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    await api.get('/api/productos');
    return { connected: true, message: 'Successfully connected to backend (/api/productos)' };
  } catch (error) {
    console.error('Backend connection failed:', error);
    if (error instanceof Error) {
      return { connected: false, message: `Connection failed: ${error.message}` };
    }
    return { connected: false, message: 'Unknown connection error' };
  }
};
