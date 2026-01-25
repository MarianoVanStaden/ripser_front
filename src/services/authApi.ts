import axios, { AxiosError } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const authApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

interface LoginCredentials {
  email: string;
  password: string;
}

interface UserData {
  email?: string;
  name?: string;
  [key: string]: unknown;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
}

interface ApiErrorResponse {
  message?: string;
}

const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error instanceof AxiosError) {
    return (error.response?.data as ApiErrorResponse)?.message || defaultMessage;
  }
  return defaultMessage;
};

export const login = async (credentials: LoginCredentials) => {
  try {
    const response = await authApi.post('/login', credentials);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error, 'Error en la solicitud de inicio de sesión');
  }
};

export const logout = async () => {
  try {
    await authApi.post('/logout');
  } catch (error) {
    throw getErrorMessage(error, 'Error en la solicitud de cierre de sesión');
  }
};

export const register = async (userData: UserData) => {
  try {
    const response = await authApi.post('/register', userData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error, 'Error en la solicitud de registro');
  }
};

export const getProfile = async () => {
  try {
    const response = await authApi.get('/profile');
    return response.data;
  } catch (error) {
    throw getErrorMessage(error, 'Error al obtener el perfil');
  }
};

export const updateProfile = async (userData: UserData) => {
  try {
    const response = await authApi.put('/profile', userData);
    return response.data;
  } catch (error) {
    throw getErrorMessage(error, 'Error al actualizar el perfil');
  }
};

export const changePassword = async (passwordData: PasswordData) => {
  try {
    await authApi.put('/change-password', passwordData);
  } catch (error) {
    throw getErrorMessage(error, 'Error al cambiar la contraseña');
  }
};

export default authApi;