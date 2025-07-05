import api from './config';

// Test connection to backend
export const testConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    // Try actuator health endpoint first (Spring Boot default)
    await api.get('/actuator/health');
    return { connected: true, message: 'Successfully connected to backend (actuator/health)' };
  } catch (error1) {
    try {
      // Fallback to /health (custom endpoint)
      await api.get('/health');
      return { connected: true, message: 'Successfully connected to backend (/health)' };
    } catch (error2) {
      console.error('Backend connection failed:', error2);
      if (error2 instanceof Error) {
        return { connected: false, message: `Connection failed: ${error2.message}` };
      }
      return { connected: false, message: 'Unknown connection error' };
    }
  }
};

// Get backend status and basic info
export const getBackendStatus = async () => {
  try {
    const response = await api.get('/actuator/health');
    return response.data;
  } catch (error) {
    // If actuator endpoint doesn't exist, try a simple endpoint
    try {
      await api.get('/');
      return { status: 'UP', message: 'Backend is running' };
    } catch (fallbackError) {
      throw new Error('Backend is not accessible');
    }
  }
};
