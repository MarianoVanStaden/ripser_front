import api from '../config';
import type { Presupuesto, CreatePresupuestoRequest } from '../../types';

export const presupuestoApi = {
  // Get all presupuestos
  getAll: async (): Promise<Presupuesto[]> => {
    const response = await api.get('/api/presupuestos');
    return response.data;
  },

  // Get presupuesto by ID
  getById: async (id: number): Promise<Presupuesto> => {
    const response = await api.get(`/api/presupuestos/${id}`);
    return response.data;
  },

  // Create new presupuesto
  create: async (presupuesto: CreatePresupuestoRequest): Promise<Presupuesto> => {
    const response = await api.post('/api/presupuestos', presupuesto);
    return response.data;
  },

  // Update presupuesto
  update: async (id: number, presupuesto: Partial<CreatePresupuestoRequest>): Promise<Presupuesto> => {
    const response = await api.put(`/api/presupuestos/${id}`, presupuesto);
    return response.data;
  },

  // Delete presupuesto
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/presupuestos/${id}`);
  },

  // Get presupuestos by client
  getByClient: async (clientId: number): Promise<Presupuesto[]> => {
    const response = await api.get(`/api/presupuestos/client/${clientId}`);
    return response.data;
  },

  // Get presupuestos by status
  getByStatus: async (status: string): Promise<Presupuesto[]> => {
    const response = await api.get(`/api/presupuestos/status/${status}`);
    return response.data;
  },

  // Get presupuestos by date range
  getByDateRange: async (startDate: string, endDate: string): Promise<Presupuesto[]> => {
    const response = await api.get(`/api/presupuestos/date-range?start=${startDate}&end=${endDate}`);
    return response.data;
  },

  // Convert presupuesto to sale
  convertToSale: async (id: number): Promise<any> => {
    const response = await api.post(`/api/presupuestos/${id}/convert-to-sale`);
    return response.data;
  },

  // Send presupuesto to client (email)
  sendToClient: async (id: number, email?: string): Promise<void> => {
    const response = await api.post(`/api/presupuestos/${id}/send`, { email });
    return response.data;
  },

  // Get presupuesto PDF
  getPdf: async (id: number): Promise<Blob> => {
    const response = await api.get(`/api/presupuestos/${id}/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Update presupuesto status
  updateStatus: async (id: number, status: string): Promise<Presupuesto> => {
    const response = await api.patch(`/api/presupuestos/${id}/status`, { status });
    return response.data;
  }
};
