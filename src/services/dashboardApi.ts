import { apiClient } from './config';

export const getAdminMetrics = async () => {
  const response = await apiClient.get('/dashboard/admin');
  return response.data;
};

export const getVendedorMetrics = async () => {
  const response = await apiClient.get('/dashboard/vendedor');
  return response.data;
};

export const getProduccionMetrics = async () => {
  const response = await apiClient.get('/dashboard/produccion');
  return response.data;
};

export const getLogisticaMetrics = async () => {
  const response = await apiClient.get('/dashboard/logistica');
  return response.data;
};
