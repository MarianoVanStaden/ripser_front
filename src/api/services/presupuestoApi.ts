import api from '../config';
import type { Presupuesto, CreatePresupuestoRequest, PresupuestoStatus } from '../../types';

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
  //Delete presupuesto
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/presupuestos/${id}`);
  }
,

  // Update presupuesto
  update: async (id: number, presupuesto: Partial<CreatePresupuestoRequest>): Promise<Presupuesto> => {
    const response = await api.put(`/api/presupuestos/${id}`, presupuesto);
    return response.data;
  },

  // Get presupuestos by cliente
  getByCliente: async (clienteId: number): Promise<Presupuesto[]> => {
    const response = await api.get(`/api/presupuestos/cliente/${clienteId}`);
    return response.data;
  },

  // Get presupuestos by estado
  getByEstado: async (estado: PresupuestoStatus): Promise<Presupuesto[]> => {
    const response = await api.get(`/api/presupuestos/estado/${estado}`);
    return response.data;
  },

  // Get vencidos
  getVencidos: async (): Promise<Presupuesto[]> => {
    const response = await api.get('/api/presupuestos/vencidos');
    return response.data;
  },
};
