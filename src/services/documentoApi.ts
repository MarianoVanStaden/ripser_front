import { apiClient } from './apiClient';

export const createPresupuesto = async (data: any) => {
  try {
    const empresaId = sessionStorage.getItem('empresaId') || localStorage.getItem('tenantId');
    
    const payload = {
      ...data,
      empresaId: empresaId ? parseInt(empresaId) : undefined,
    };
    
    console.log('Enviando datos:', payload);
    const response = await apiClient.post('/documentos/presupuesto', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating presupuesto:', error);
    throw error;
  }
};