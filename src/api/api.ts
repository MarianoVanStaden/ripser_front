import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/RipserApp/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(
      'API Error Details:',
      {
        message: error.message,
        url: error.config.url,
        method: error.config.method,
        status: error.response?.status,
        data: error.response?.data,
      }
    );
    return Promise.reject(error);
  }
);

export default api;