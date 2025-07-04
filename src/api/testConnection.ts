import api from './config';

// Test connection to backend
export const testConnection = async (): Promise<{ connected: boolean; message: string }> => {
  try {
    // Try to make a basic request to test connectivity
    await api.get('/health');
    return { connected: true, message: 'Successfully connected to backend' };
  } catch (error) {
    console.error('Backend connection failed:', error);
    if (error instanceof Error) {
      return { connected: false, message: `Connection failed: ${error.message}` };
    }
    return { connected: false, message: 'Unknown connection error' };
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
