import api from '../config';
import type { CuentaBancaria, CuentaBancariaCreateDTO } from '../../types';

export const cuentaBancariaApi = {
  getAll: async (): Promise<CuentaBancaria[]> => {
    const response = await api.get('/api/cuentas-bancarias');
    return response.data;
  },

  getActivas: async (): Promise<CuentaBancaria[]> => {
    const response = await api.get('/api/cuentas-bancarias/activas');
    return response.data;
  },

  getById: async (id: number): Promise<CuentaBancaria> => {
    const response = await api.get(`/api/cuentas-bancarias/${id}`);
    return response.data;
  },

  create: async (cuenta: CuentaBancariaCreateDTO): Promise<CuentaBancaria> => {
    const response = await api.post('/api/cuentas-bancarias', cuenta);
    return response.data;
  },

  update: async (id: number, cuenta: Partial<CuentaBancariaCreateDTO>): Promise<CuentaBancaria> => {
    const response = await api.put(`/api/cuentas-bancarias/${id}`, cuenta);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/cuentas-bancarias/${id}`);
  },
};
