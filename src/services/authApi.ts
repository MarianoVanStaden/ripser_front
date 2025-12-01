import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const authApi = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (credentials) => {
  try {
    const response = await authApi.post('/login', credentials);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error en la solicitud de inicio de sesión';
  }
};

export const logout = async () => {
  try {
    await authApi.post('/logout');
  } catch (error) {
    throw error.response?.data?.message || 'Error en la solicitud de cierre de sesión';
  }
};

export const register = async (userData) => {
  try {
    const response = await authApi.post('/register', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error en la solicitud de registro';
  }
};

export const getProfile = async () => {
  try {
    const response = await authApi.get('/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al obtener el perfil';
  }
};

export const updateProfile = async (userData) => {
  try {
    const response = await authApi.put('/profile', userData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Error al actualizar el perfil';
  }
};

export const changePassword = async (passwordData) => {
  try {
    await authApi.put('/change-password', passwordData);
  } catch (error) {
    throw error.response?.data?.message || 'Error al cambiar la contraseña';
  }
};

export default authApi;