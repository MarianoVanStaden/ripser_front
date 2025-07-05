import api from '../config';

export interface ResumenViaje {
  id: number;
  numeroViaje: string;
  fechaViaje: string; // ISO string
  destino: string;
  conductorNombre: string;
  vehiculoInfo: string;
  estado: string;
  totalEntregas: number;
  entregasCompletadas: number;
}

export const resumenViajeApi = {
  // Get all resumen de viajes
  getAll: async (): Promise<ResumenViaje[]> => {
    const response = await api.get('/api/viajes/resumen');
    return response.data;
  },

  // Get resumen de viaje by ID
  getById: async (id: number): Promise<ResumenViaje> => {
    const response = await api.get(`/api/viajes/resumen/${id}`);
    return response.data;
  }
};
