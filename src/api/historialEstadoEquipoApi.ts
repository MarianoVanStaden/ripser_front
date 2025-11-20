import api from './config';
import type { HistorialEstadoEquipo } from '../types';

export const historialEstadoEquipoApi = {
  // Obtener historial de un equipo específico
  getByEquipoId: async (equipoId: number): Promise<HistorialEstadoEquipo[]> => {
    const response = await api.get<HistorialEstadoEquipo[]>(
      `/api/equipos-fabricados/${equipoId}/historial-estados`
    );
    return response.data;
  },
};
