import api from '../config';
import type { ReclamoGarantia } from '../../types';

export const reclamoGarantiaApi = {
  // Get all reclamos
  getAll: async (): Promise<ReclamoGarantia[]> => {
    const response = await api.get('/api/reclamos-garantia');
    return response.data;
  },

  // Get reclamo by ID
  getById: async (id: number): Promise<ReclamoGarantia> => {
    const response = await api.get(`/api/reclamos-garantia/${id}`);
    return response.data;
  },

  // Get reclamos by garantia
  getByGarantia: async (garantiaId: number): Promise<ReclamoGarantia[]> => {
    const response = await api.get(`/api/reclamos-garantia/garantia/${garantiaId}`);
    return response.data;
  },

  // Get reclamos by estado
  getByEstado: async (estado: string): Promise<ReclamoGarantia[]> => {
    const response = await api.get(`/api/reclamos-garantia/estado/${estado}`);
    return response.data;
  },

  // Get reclamos by tecnico
  getByTecnico: async (tecnicoId: number): Promise<ReclamoGarantia[]> => {
    const response = await api.get(`/api/reclamos-garantia/tecnico/${tecnicoId}`);
    return response.data;
  },

  // Get reclamos by tipo solucion
  getByTipoSolucion: async (tipoSolucion: string): Promise<ReclamoGarantia[]> => {
    const response = await api.get(`/api/reclamos-garantia/tipo-solucion/${tipoSolucion}`);
    return response.data;
  },

  // Get reclamos by periodo
  getByPeriodo: async (fechaInicio: string, fechaFin: string): Promise<ReclamoGarantia[]> => {
    const response = await api.get('/api/reclamos-garantia/periodo', {
      params: { fechaInicio, fechaFin }
    });
    return response.data;
  },

  // Create new reclamo
  create: async (reclamo: ReclamoGarantia): Promise<ReclamoGarantia> => {
    const response = await api.post('/api/reclamos-garantia', reclamo);
    return response.data;
  },

  // Update reclamo
  update: async (id: number, reclamo: ReclamoGarantia): Promise<ReclamoGarantia> => {
    const response = await api.put(`/api/reclamos-garantia/${id}`, reclamo);
    return response.data;
  },

  // Delete reclamo
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/reclamos-garantia/${id}`);
  }
};
