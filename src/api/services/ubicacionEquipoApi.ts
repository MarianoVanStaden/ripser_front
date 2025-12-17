import api from '../config';
import type { UbicacionEquipo, UbicacionEquipoCreateDTO } from '../../types';

export const ubicacionEquipoApi = {
  // Consultas
  getAll: async (): Promise<UbicacionEquipo[]> => {
    const response = await api.get('/api/ubicacion-equipo');
    return response.data;
  },

  getById: async (id: number): Promise<UbicacionEquipo> => {
    const response = await api.get(`/api/ubicacion-equipo/${id}`);
    return response.data;
  },

  getByEquipo: async (equipoFabricadoId: number): Promise<UbicacionEquipo> => {
    const response = await api.get(`/api/ubicacion-equipo/equipo/${equipoFabricadoId}`);
    return response.data;
  },

  getByNumeroHeladera: async (numeroHeladera: string): Promise<UbicacionEquipo> => {
    const response = await api.get(`/api/ubicacion-equipo/numero-heladera/${encodeURIComponent(numeroHeladera)}`);
    return response.data;
  },

  getByDeposito: async (depositoId: number): Promise<UbicacionEquipo[]> => {
    const response = await api.get(`/api/ubicacion-equipo/deposito/${depositoId}`);
    return response.data;
  },

  getDisponiblesByDeposito: async (depositoId: number): Promise<UbicacionEquipo[]> => {
    const response = await api.get(`/api/ubicacion-equipo/deposito/${depositoId}/disponibles`);
    return response.data;
  },

  getByDepositoYTipo: async (depositoId: number, tipo: string): Promise<UbicacionEquipo[]> => {
    const response = await api.get(`/api/ubicacion-equipo/deposito/${depositoId}/tipo/${tipo}`);
    return response.data;
  },

  countByDeposito: async (depositoId: number): Promise<number> => {
    const response = await api.get(`/api/ubicacion-equipo/deposito/${depositoId}/count`);
    return response.data;
  },

  // Operaciones
  create: async (ubicacion: UbicacionEquipoCreateDTO): Promise<UbicacionEquipo> => {
    const response = await api.post('/api/ubicacion-equipo', ubicacion);
    return response.data;
  },

  update: async (id: number, ubicacion: Partial<UbicacionEquipoCreateDTO>): Promise<UbicacionEquipo> => {
    const response = await api.put(`/api/ubicacion-equipo/${id}`, ubicacion);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/ubicacion-equipo/${id}`);
  },

  mover: async (
    equipoFabricadoId: number,
    nuevoDepositoId: number,
    ubicacionInterna?: string,
    observaciones?: string
  ): Promise<void> => {
    await api.post('/api/ubicacion-equipo/mover', null, {
      params: { equipoFabricadoId, nuevoDepositoId, ubicacionInterna, observaciones }
    });
  },
};
